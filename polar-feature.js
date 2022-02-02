import {
	OP_CODE,
	MEASUREMENT_NAME,
	SETTING_TYPE_NAME,
	SETTING_VALUES
} from "./polar-codes.js";

import Visualizer from "./visualizer.js";

import {
    parseMeasurementData,
    parseFeatureReadResponse,
    parseControlPointResponse
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
	constructor (
		featureCode,
		commandFn = () => console.log("command " + featureCode),
		state = {streaming: false}
	) {
		this.featureCode = featureCode;
		this.commandFn = commandFn;
		this._parameters = {};
		this.requestedStreamProperties = [];
		this.activeStreamProperties = [];

		this._state = {};
		this.state = state;
		this.inputs = {};

		this.submitHandler = this.submitHandler.bind(this);

		this.rootElement = document.createElement("div");
		this.form = document.createElement("form");
		this.fieldset = document.createElement("fieldset");

		const legend = document.createElement("legend");
		legend.innerText = MEASUREMENT_NAME[featureCode];
		this.fieldset.appendChild(legend);

		this.startButton = document.createElement("button");
		this.startButton.name = "operation";
		this.startButton.type = "submit";
		this.startButton.innerText = "start";
		this.startButton.value = OP_CODE.START_MEASUREMENT;

		this.stopButton = document.createElement("button");
		this.stopButton.name = "operation";
		this.stopButton.type = "submit";
		this.stopButton.innerText = "stop";
		this.stopButton.value = OP_CODE.STOP_MEASUREMENT;

		this.fieldset.appendChild(this.startButton);
		this.fieldset.appendChild(this.stopButton);
		this.form.appendChild(this.fieldset);
		this.form.addEventListener("submit", this.submitHandler);
		this.rootElement.appendChild(this.form);

		this.visualizer = new Visualizer();
		this.rootElement.appendChild(this.visualizer.rootElement);

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

	parseData (data, callback) {
        const properties = parameterList2Properties(this.activeStreamProperties);
        const parsedDataResponse = parseMeasurementData(data, properties);
        this.data = parsedDataResponse.data;
        callback(MEASUREMENT_NAME[this.featureCode], parsedDataResponse.data, properties);
	}

	set parameters (parameters) {
		this._parameters = [...parameters];

		this._parameters.forEach(({name, values, code, unit}) => {
			const label = document.createElement("label");
			const labelText = document.createElement("span");
			labelText.innerText = name;
			label.appendChild(labelText);

			const input = document.createElement("select");
			input.name = code;
			label.appendChild(input);
			this.fieldset.appendChild(label);
			values.forEach(({label: optionLabel, value}) => {
				const optionElement = document.createElement("option");
				optionElement.value = value;
				optionElement.innerText = `${optionLabel} ${unit}`;
				input.appendChild(optionElement);
			});
		});
	}

	set state (state) {
		this._state = state;
		if (state.status === "running") {
			this.activeStreamProperties = [
				...this.requestedStreamProperties
			];
		}
	}

	set data (data) {
		this._data = data;

		this.visualizer.appendData(this._data, parameterList2Properties(this.activeStreamProperties));
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
