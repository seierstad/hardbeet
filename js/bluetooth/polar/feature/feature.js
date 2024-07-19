import {useEffect, useLayoutEffect, useState, useContext, useMemo, useRef} from "preact/hooks";
import {html} from "htm/preact";

import {AppHandlersContext} from "hardbeet";

import Visualizer from "../../../visualizer.js";

import {
    OP_CODE,
    MEASUREMENT_NAME,
    SETTING_TYPE_NAME,
    SETTING_TYPE_LENGTH,
    SETTING_VALUES,
    SETTING_LENGTH
} from "../constants.js";


const median = arr => {
    const sorted = [...arr].sort();
    const half = Math.floor(arr.length / 2);
    return (arr.length % 2 === 1) ? sorted[half] : (sorted[half - 1] + sorted[half]) / 2;
};

const channelSplitter = (acc, curr, index) => index === 1 ? acc.map((a, i) => [a, curr[i]]) : acc.map((a, i) => [...a, curr[i]]);
const multiChannelSum = (acc, curr) => acc.map((sum, i) => sum + curr[i]);

const multiChannelMedian = data => data.reduce(channelSplitter).map(median);
const multiChannelAverage = data => data.reduce(multiChannelSum).map(channelSum => channelSum / data.length);

const parameterList2Properties = (parameterList) => {
    return parameterList.reduce((acc, [parameterCode, valueCode]) => {
        return {
            ...acc,
            [SETTING_TYPE_NAME[parameterCode]]: SETTING_VALUES[parameterCode][valueCode]
        };
    }, {});
};

const getMultiChannelAdder = (offsets = []) => (offsets.length === 0) ? (data => data) : (data => data.map((value, index) => value - offsets[index]));

const initMinMaxAbs = {min: Number.MAX_VALUE, max: Number.MIN_VALUE, abs: Number.EPSILON};

const absoluteMax = (value1, value2) => {
    return Math.max(Math.abs(value1), Math.abs(value2));
};

const getMinMaxReducer = (channels = 1) => (data) => data.reduce((acc, curr) => acc.map((channel, index) => ({
    min: Math.min(curr[index], channel.min),
    max: Math.max(curr[index], channel.max)
})), Array(channels).fill({...initMinMaxAbs}));


const getStartRequest = (featureCode, parameters) => {
    const parametersByteCount = parameters.reduce((acc, [parameter]) => acc + SETTING_TYPE_LENGTH[parameter], 0) + parameters.length * 2;

    const request = new ArrayBuffer(2 + parametersByteCount);
    const view = new DataView(request);

    view.setUint8(0, OP_CODE.START_MEASUREMENT);
    view.setUint8(1, featureCode);

    let i = 2;
    parameters.forEach(([parameter, value]) => {
        const length = SETTING_TYPE_LENGTH[parameter];
        view.setUint8(i, parameter);
        i += 1;
        view.setUint8(i, SETTING_LENGTH);
        i += 1;
        if (length === 1) {
            view.setUint8(i, value);
            i += 1;
        }
        if (length === 2) {
            view.setUint16(i, value, true);
            i += 2;
        }
    });
    return request;
};

const getStopRequest = featureCode => {
    return Uint8Array.of(OP_CODE.STOP_MEASUREMENT, featureCode);
};

const getMeasurementStatusRequest = featureCode => {
    return Uint8Array.of(OP_CODE.GET_MEASUREMENT_STATUS, featureCode);
};

const PolarFeature = (props = {}) => {
    const {log: {logError}} = useContext(AppHandlersContext);
    const {state = {}, controlPoint, getHandlers} = props;
    const {code, parameters, activeStreamProperties, data, sampleZero, offsets} = state;
    const handlers = useMemo(() => getHandlers(state));
    const {setActiveStreamProperties, startZeroSampling, stopZeroSampling, setOffsets} = handlers;
    const [zeroData, setZeroData] = useState([]);
    const [normalizeFactor, setNormalizeFactor] = useState(1);
    const [{min, max, abs}, setMinMaxAbs] = useState({...initMinMaxAbs});
    const [visualizer] = useState(new Visualizer());
    const [error] = useState(null);
    const [debug, setDebug] = useState(false);

    useEffect(() => {
        if (error !== null) {
            const {
                operation,
                status: {
                    message
                }
            } = error;
            logError(`${MEASUREMENT_NAME[code]} measurement error: ${operation}: ${message}`);
        }
    }, [error]);

    const normalize = ([...values]) => {
        return [...values].map(value => Math.min(Math.max(value * normalizeFactor, -1), 1));
    };

    const visualizerContainer = useRef(null);

    useLayoutEffect(() => {
        visualizerContainer.current && visualizerContainer.current.appendChild(visualizer.rootElement);
        visualizer.initializeResolution();
    }, [visualizerContainer.current]);

    useEffect(() => {
        if (data.value !== null) {
            const {
                data: dataArr = [],
                channels = 1,
                ...rest
            } = data.value;
            if (!visualizer.configured) {
                visualizer.configure({channels, ...rest});
            }
            if (dataArr && dataArr.length > 0) {
                const offsetMapper = getMultiChannelAdder(offsets.value);
                const offsetData = dataArr.map(offsetMapper);
                const channelsMinMax = getMinMaxReducer(channels)(offsetData);
                const {min: pMin, max: pMax} = channelsMinMax.reduce((acc, curr) => ({min: Math.min(acc.min, curr.min), max: Math.max(acc.max, curr.max)}));

                if (pMin < min || pMax > max) {
                    const newMin = (pMin < min) ? pMin : min;
                    const newMax = (pMax > max) ? pMax : max;
                    setMinMaxAbs({min: newMin, max: newMax, abs: absoluteMax(newMin, newMax)});
                }
                const properties = activeStreamProperties.value;

                visualizer.appendData(offsetData.map(normalize), properties);
                if (sampleZero.value) {
                    setZeroData([...zeroData, ...dataArr]);
                }
                //callback(MEASUREMENT_NAME[code], dataArr.map(normalize), properties);
            }
        }
    }, [data.value]);

    const getZeroOffsets = (data = [[0]]) => {
        //console.log(multiChannelAverage(data));
        return multiChannelMedian(data);
    };

    useEffect(() => {
        if (sampleZero.value === false) {
            setOffsets(getZeroOffsets(zeroData));
        }
    }, [sampleZero.value]);

    const stopEvent = event => {
        event.preventDefault();
        event.stopPropagation();
    };

    const stopMeasurementHandler = event => {
        stopEvent(event);
        const request = getStopRequest(code);
        controlPoint.writeValueWithResponse(request);
    };

    const measurementStatusHandler = event => {
        stopEvent(event);
        const request = getMeasurementStatusRequest(code);
        controlPoint.writeValueWithResponse(request);
    };

    const startMeasurementHandler = (event) => {
        stopEvent(event);
        const parameters = Array.from(new FormData(event.target).entries()).map(
            ([id, value]) => [parseInt(id, 10), parseInt(value, 10)]
        ).sort(([keyA], [keyB]) => keyA - keyB);

        setActiveStreamProperties(parameterList2Properties([...parameters]));

        const request = getStartRequest(code, parameters);
        controlPoint.writeValueWithResponse(request);
    };

    const resetHandler = (event) => {
        stopEvent(event);
        setMinMaxAbs({...initMinMaxAbs});
        visualizer.reset();
    };

    const normalizeHandler = (event) => {
        stopEvent(event);
        setNormalizeFactor(1 / abs);
    };

    const startZeroHandler = event => {
        stopEvent(event);
        startZeroSampling();
    };

    const stopZeroHandler = event => {
        stopEvent(event);
        stopZeroSampling();
    };

    const resetZeroHandler = event => {
        stopEvent(event);

    };

    const toggleDebug = event => {
        stopEvent(event);
        setDebug(!debug);
    };

    return html`
        <div>
            <form onSubmit=${startMeasurementHandler}>
                <fieldset>
                    <legend>${MEASUREMENT_NAME[code]}</legend>
                    <button onClick=${toggleDebug}>${debug ? "de-debug" : "debug"}</button>
                    ${parameters.map(({name, values, code, unit}) => html`
                        <label>
                            <span class="label-text">${name}</span>
                            <select name=${code}>
                                ${values.map(({label: optionLabel, value}) => html`
                                    <option key=${value} value=${value}>${optionLabel} ${unit}</option>
                                `)}
                            </select>
                        </label>
                    `)}
                    <button name="operation" type="submit" value=${OP_CODE.START_MEASUREMENT}>start</button>
                    <button name="operation" onClick=${stopMeasurementHandler}>stop</button>
                    <button name="operation" onClick=${measurementStatusHandler}>status?</button>

                    <!-- visualizer -->
                    <div class="visualizer-container" ref=${visualizerContainer}></div>
                    <button onClick=${resetHandler}>reset</button>
                    <button onClick=${normalizeHandler}>normalize</button>
                    <label class=${Math.abs(min * normalizeFactor) > 1 ? "clip" : null}>
                        <span class="label-text">min</span>
                        <output value=${min} />
                    </label>
                    <label class=${Math.abs(max * normalizeFactor) > 1 ? "clip" : null}>
                        <span class="label-text">max</span>
                        <output value=${max} />
                    </label>
                    <fieldset>
                        <legend>remove offset</legend>
                        ${sampleZero.value ? html`
                            <button onClick=${stopZeroHandler}>stop</button>
                        ` : html`
                            <button onClick=${startZeroHandler}>start</button>
                        `}
                        <button onClick=${resetZeroHandler}>reset</button>
                    </fieldset>
                </fieldset>
            </form>
        </div>
    `;
};


export {
    PolarFeature,
    parameterList2Properties
};
