import {useEffect, useLayoutEffect, useState, useContext, useMemo, useRef} from "preact/hooks";
import {html} from "htm/preact";

import {AppHandlersContext} from "hardbeet";

import Visualizer from "../../../visualizer.js";

import {
    OP_CODE,
    MEASUREMENT_NAME,
    SETTING_TYPE_NAME,
    SETTING_VALUES,
    SETTING_LENGTH
} from "../constants.js";


const parameterList2Properties = (parameterList) => {
    return parameterList.reduce((acc, [parameterCode, valueCode]) => {
        return {
            ...acc,
            [SETTING_TYPE_NAME[parameterCode]]: SETTING_VALUES[parameterCode][valueCode]
        };
    }, {});
};

const absoluteMax = (value1, value2) => {
    return Math.max(Math.abs(value1), Math.abs(value2));
};


const getMinMax = (data) => data.reduce((acc, curr) => ({
    min: Math.min(curr, acc.min),
    max: Math.max(curr, acc.max)
}), {min: Number.MAX_VALUE, max: Number.MIN_VALUE});


const PolarFeature = (props = {}) => {
    const {log: {logError}} = useContext(AppHandlersContext);
    const {state = {}, callback, controlPoint, getHandlers} = props;
    const {code, parameters, status, activeStreamProperties, data} = state;
    const handlers = useMemo(() => getHandlers(state));
    const {setActiveStreamProperties} = handlers;
    const [normalizeFactor, setNormalizeFactor] = useState(1);
    const [min, setMin] = useState(null);
    const [max, setMax] = useState(null);
    const [visualizer] = useState(new Visualizer());
    const [error, setError] = useState(null);

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

    const normalize = ([value]) => {
        return [Math.min(Math.max(value * normalizeFactor, -1), 1)];
    };

    const visualizerContainer = useRef(null);

    useLayoutEffect(() => {
        visualizerContainer.current && visualizerContainer.current.appendChild(visualizer.rootElement);
    }, [visualizerContainer.current]);

    useEffect(() => {
        const {value: {
            data: dataArr = []
        } = {}} = data;
        if (dataArr && dataArr.length > 0) {
            const {
                min: dataMin,
                max: dataMax
            } = getMinMax(dataArr);

            if (max === null || dataMax > max) {
                setMax(dataMax);
            }
            if (min === null || dataMin < min) {
                setMin(dataMin);
            }

            const properties = parameterList2Properties(activeStreamProperties.value);
            visualizer.appendData(dataArr, properties);
            //callback(MEASUREMENT_NAME[code], dataArr.map(normalize), properties);
        }
    }, [data.value]);

    const featureCommandHandler = (featureId, operationCode, parameters) => {
        let request = null;

        switch (operationCode) {
            case OP_CODE.START_MEASUREMENT:
                request = new ArrayBuffer(2 + (4 * parameters.length));
                const view = new DataView(request);

                view.setUint8(0, operationCode);
                view.setUint8(1, featureId);

                let i = 2;
                parameters.forEach(([parameter, value]) => {
                    view.setUint8(i, parameter);
                    i += 1;
                    view.setUint8(i, SETTING_LENGTH);
                    i += 1;
                    view.setUint16(i, value, true);
                    i += 2;
                });
                break;

            case OP_CODE.STOP_MEASUREMENT:
                request = Uint8Array.of(operationCode, featureId);
                break;

            default:
                logError(`unknown operation code: ${operationCode}`);
        }

        if (request !== null) {
            controlPoint.writeValueWithResponse(request);
        }
    };

    const submitHandler = (event) => {
        event.preventDefault();
        event.stopPropagation();
        const parameters = Array.from(new FormData(event.target).entries()).map(([id, value]) => [parseInt(id, 10), parseInt(value, 10)]);
        const operation = parseInt(event.submitter.value, 10);
        featureCommandHandler(parseInt(code, 10), operation, parameters);

        if (operation === OP_CODE.START_MEASUREMENT) {
            setActiveStreamProperties([...parameters]);
        }
    };

    const resetHandler = () => {
        setMin(0);
        setMax(0);
        visualizer.reset();
    };


    return html`
        <div>
            <form onSubmit=${submitHandler}>
                <fieldset>
                    <legend>${MEASUREMENT_NAME[code]}</legend>
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
                    <button name="operation" type="submit" value=${OP_CODE.STOP_MEASUREMENT}>stop</button>
                    <!-- visualizer -->
                    <div ref=${visualizerContainer}></div>
                    <button onClick=${resetHandler}>reset</button>
                    <button onClick=${setNormalizeFactor(1 / absoluteMax(min, max))}>normalize</button>
                    <label class=${min * normalizeFactor < -1 ? "clip" : null}>
                        <span class="label-text">min</span>
                        <output value=${min} />
                    </label>
                    <label class=${max * normalizeFactor > 1 ? "clip" : null}>
                        <span class="label-text">max</span>
                        <output value=${max} />
                    </label>
                </fieldset>
            </form>
        </div>
    `;
};


export {
    PolarFeature,
    parameterList2Properties
};
