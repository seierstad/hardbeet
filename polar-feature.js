"use strict";

import {html, useState, useEffect} from "./preact-standalone.module.min.js";

import {
    OP_CODE,
    MEASUREMENT_NAME,
    SETTING_TYPE_NAME,
    SETTING_VALUES
} from "./polar-codes.js";

import {ACTION as STATUS_ACTION} from "./status.js";
import {parseMeasurementData} from "./polar-parsers.js";
import Visualizer from "./visualizer.js";

const initialState = {
    /*
    code: 0, 1, 2, 3, 5, 6
    supported: true
    */
    parameters: {},
    status: "stopped"
};

const ACTION = {
    POLAR_FEATURE_MEASUREMENT_PARAMETERS: Symbol("POLAR_FEATURE_MEASUREMENT_PARAMETERS"),
    POLAR_MEASUREMENT_START: Symbol("POLAR_MEASUREMENT_START"),
    POLAR_MEASUREMENT_STOP: Symbol("POLAR_MEASUREMENT_STOP"),
    POLAR_MEASUREMENT_ERROR: Symbol("POLAR_MEASUREMENT_ERROR")
};

const reducer = (state = initialState, action = {}) => {
    const {type, payload} = action;

    switch (type) {

        case ACTION.POLAR_FEATURE_MEASUREMENT_PARAMETERS:
            return {
                ...state,
                parameters: payload.parameters
            };

        case ACTION.POLAR_MEASUREMENT_START:
            return {
                ...state,
                status: "running"
            };

        case ACTION.POLAR_MEASUREMENT_STOP:
            return {
                ...state,
                status: "stopped"
            };

        case ACTION.POLAR_MEASUREMENT_ERROR:
            return {
                ...state,
                error: {
                    status: payload.status,
                    operation: payload.operation
                }
            };

    }

    return state;
};


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

function PolarFeature (props) {
    const {state, featureCode, commandFn, dispatch, callback = () => console.log("TODO: feature callback fn")} = props;
    const [normalizeFactor, setNormalizeFactor] = useState(1);
    const [min, setMin] = useState(null);
    const [max, setMax] = useState(null);
    const [visualizer] = useState(new Visualizer());
    const [requestedStreamProperties, setRequestedStreamProperties] = useState([]);
    const [data, setData] = useState([]);
    const [activeStreamProperties, setActiveStreamProperties] = useState([]);
    const {parameters = []} = props;
    const [error, setError] = useState(null);

    useEffect(() => {
        if (error !== null) {
            const {
                operation,
                status: {
                    message
                }
            } = error;
            dispatch({type: STATUS_ACTION.ERROR, payload: {text: `ERROR: ${operation}: ${message}`, timestamp: new Date()}});
        }
    }, [error]);

    const normalize = ([value]) => {
        return [Math.min(Math.max(value * normalizeFactor, -1), 1)];
    };

    const parseData = (data) => {
        const properties = parameterList2Properties(activeStreamProperties);
        const parsedDataResponse = parseMeasurementData(data, properties);
        setData(parsedDataResponse.data);
    };

    useEffect(() => {
        if (data.length > 0) {
            const {
                min: dataMin,
                max: dataMax
            } = getMinMax(data);

            if (max === null || dataMax > max) {
                setMax(dataMax);
            }
            if (min === null || dataMin < min) {
                setMin(dataMin);
            }

            const properties = parameterList2Properties(activeStreamProperties);
            visualizer.appendData(data, properties);
            callback(MEASUREMENT_NAME[featureCode], data.map(normalize), properties);
        }
    }, data);

    const submitHandler = (event) => {
        event.preventDefault();
        event.stopPropagation();
        const parameters = Array.from(new FormData(event.target).entries()).map(([id, value]) => [parseInt(id, 10), parseInt(value, 10)]);
        const operation = parseInt(event.submitter.value, 10);
        commandFn(parseInt(featureCode, 10), operation, parameters);

        if (operation === OP_CODE.START_MEASUREMENT) {
            setRequestedStreamProperties([...parameters]);
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
                    <legend>${MEASUREMENT_NAME[featureCode]}</legend>
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
}


export {
    ACTION,
    reducer,
    parameterList2Properties
};

export default PolarFeature;
