"use strict";

import {html, Component} from "./preact-standalone.module.min.js";

import {
    OP_CODE,
    MEASUREMENT_NAME,
    SETTING_TYPE_NAME,
    SETTING_VALUES
} from "./polar-codes.js";

import Visualizer from "./visualizer.js";

import {
    parseMeasurementData
} from "./polar-parsers.js";


const parameterList2Properties = (parameterList) => {
    return parameterList.reduce((acc, [parameterCode, valueCode]) => {
        return {
            ...acc,
            [SETTING_TYPE_NAME[parameterCode]]: SETTING_VALUES[parameterCode][valueCode]
        };
    }, {});
};


class PolarFeature {
    constructor ({featureCode, commandFn}) {
        this.featureCode = featureCode;

        this.commandFn = commandFn;
        this.requestedStreamProperties = [];
        this.activeStreamProperties = [];

        this.normalizeFactor = 1;
        this.inputs = {};

        this.submitHandler = this.submitHandler.bind(this);
        this.resetHandler = this.resetHandler.bind(this);
        this.normalize = this.normalize.bind(this);
        this.normalizeHandler = this.normalizeHandler.bind(this);
        this.controlPointHandler = this.controlPointHandler.bind(this);

        this.visualizer = new Visualizer();
        //this.rootElement.appendChild(this.visualizer.rootElement);

        this.state = {
            max: null,
            min: null,
            normalizeFactor: 1,
            absoluteMax: Number.EPSILON
        };
    }

    render (props, state) {
        const {featureCode, parameters = []} = props;
        const {min, max, normalizeFactor} = state;

        return html`
            <div>
                <form onSubmit=${this.submitHandler}>
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
                        <button onClick=${this.resetHandler}>reset</button>
                        <button onClick=${this.normalizeHandler}>normalize</button>
                        <label class=${min * normalizeFactor < -1 ? "clip" : null}>
                            <span class="label-text">min</span>
                            <output value=${min} />
                        </label>
                        <label class=${max * this.normalizeFactor > 1 ? "clip" : null}>
                            <span class="label-text">max</span>
                            <output value=${max} />
                        </label>
                    </fieldset>
                </form>
            </div>
        `;
    }

    controlPointHandler (event) {
        console.log("controlPointHandler for " + this.featureCode);
    }

    normalizeHandler () {
        this.setState({normalizeFactor: 1 / this.state.absoluteMax});
    }

    resetHandler () {
        this.setState({min: 0, max: 0});
        this.visualizer.reset();
    }

    submitHandler (event) {
        event.preventDefault();
        event.stopPropagation();
        const parameters = Array.from(new FormData(event.target).entries()).map(([id, value]) => [parseInt(id, 10), parseInt(value, 10)]);
        const operation = parseInt(event.submitter.value, 10);
        this.commandFn(parseInt(this.featureCode, 10), operation, parameters);

        if (operation === OP_CODE.START_MEASUREMENT) {
            this.requestedStreamProperties = [...parameters];
        }
    }

    normalize ([value]) {
        return [Math.min(Math.max(value * this.normalizeFactor, -1), 1)];
    }

    parseData (data) {
        const properties = parameterList2Properties(this.activeStreamProperties);
        const parsedDataResponse = parseMeasurementData(data, properties);
        this.data = parsedDataResponse.data;
    }


    set callback (callbackFn) {
        this._callback = callbackFn;
    }
    get callback () {
        return this._callback;
    }

    get absoluteMax () {
        return Math.max(Math.abs(this.max), Math.abs(this.min));
    }

    set data (data) {
        this._data = data;

        const {min, max} = this._data.reduce((acc, curr) => ({
            min: Math.min(curr, acc.min),
            max: Math.max(curr, acc.max)
        }), {min: Number.MAX_VALUE, max: Number.MIN_VALUE});

        if (this.max === null || max > this.max) {
            this.max = max;
        }
        if (this.min === null || min < this.min) {
            this.min = min;
        }

        const properties = parameterList2Properties(this.activeStreamProperties);
        this.visualizer.appendData(data, properties);
        this.callback(MEASUREMENT_NAME[this.featureCode], data.map(this.normalize), properties);
    }


    get max () {
        return this.state.max;
    }
    set max (max) {
        this.setState({max});
    }

    get min () {
        return this.state.min;
    }
    set min (min) {
        this.setState({min});
    }

    set error (error) {
        const {
            operation,
            status: {
                message
            }
        } = error;
        alert(`ERROR: ${operation}: ${message}`);
    }

}


export {
    parameterList2Properties
};

export default PolarFeature;
