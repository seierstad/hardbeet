import {
    MESSAGE_TYPE,
    SYSEX_TYPE,
    CONTROL
} from "./midi-constants.js";

const MIDI_BLE_SERVICE_UUID = "03b80e5a-ede8-4b33-a751-6ce34ec4c700";
const MIDI_BLE_CHARACTERISTIC_UUID = "7772e5db-3868-4112-a1a9-f2669d106bf3";

class Midi {
    constructor (logger = console) {
        this.logger = logger;
        this.access = null;
        this.inputs = [];
        this.outputs = [];
        this.rootElement = document.createElement("div");

        this.checkboxHandler = this.checkboxHandler.bind(this);
        this.onAccess = this.onAccess.bind(this);
        this.addConnectButton();
    }

    checkboxHandler (event) {
        const {
            target: {
                value,
                checked
            } = {}
        } = event;
        const port = this.outputs.find(p => p.port.id === value);
        if (port) {
            console.log({port: port.port});
            port.port.open().then(p => p.send([0x90, 60, 0x20]));
        }
    }

    connectHandler = (event) => {
        this.logger.log("Requesting access to MIDI.");
        navigator.requestMIDIAccess({"sysex": true}).then(this.onAccess, this.onAccessFailure);
    }

    onAccessFailure = (message) => {
        this.logger.log("Failed to get MIDI access: " + message);
    }

    addConnectButton () {
        const connectButton = document.createElement("button");
        connectButton.innerText = "connect midi";
        connectButton.addEventListener("click", this.connectHandler);
        this.connectButton = connectButton;
        this.rootElement.appendChild(connectButton);
    }

    removeConnectButton () {
        this.connectButton.removeEventListener("click", this.connectHandler);
        this.connectButton.parentNode.removeChild(this.connectButton);
    }

    onAccess = (access) => {
        this.removeConnectButton();
        this.logger.log("MIDI access granted!");
        this.access = access;
        this.access.addEventListener("statechange", this.accessStateChangeHandler);

        const outputIterator = access.outputs.entries();
        for (let [, port] of outputIterator) {
            this.outputs.push({port, active: false});

            const {connection, name, id, manufacturer, state} = port;
            const value = {connection, name, id, manufacturer, state};
            //this.inputState.push(value);
            this.logger.log({type: "output", value});
        }



        const inputIterator = access.inputs.entries();
        for (let [, port] of inputIterator) {
            this.inputs.push({port, active: false});

            const {connection, name, id, manufacturer, state} = port;
            const value = {connection, name, id, manufacturer, state};
            //this.inputState.push(value);
            this.logger.log({type: "input", value});


        }

        this.updatePortsUI();
    }

    updatePortsUI () {
        if (!this.inputsElement) {
            const inputs = document.createElement("fieldset");
            const inputsLegend = document.createElement("legend");
            inputsLegend.innerText = "inputs";
            inputs.appendChild(inputsLegend);

            this.rootElement.appendChild(inputs);
            this.inputsElement = inputs;
        }
        if (!this.outputsElement) {
            const outputs = document.createElement("fieldset");
            const outputsLegend = document.createElement("legend");
            outputsLegend.innerText = "outputs";
            outputs.appendChild(outputsLegend);

            this.rootElement.appendChild(outputs);
            this.outputsElement = outputs;
        }
        for (let i = 0; i < this.inputs.length; i += 1) {
            const inputElements = Array.from(this.inputsElement.querySelectorAll("input"));
            const {
                port = {},
                active = false
            } = this.inputs[i];
            const elementId = `midi-input-${port.id}`;
            let inputElement = inputElements.find(element => element.id === elementId);
            if (!inputElement) {
                const labelElement = document.createElement("label");
                inputElement = document.createElement("input");
                inputElement.id = elementId;
                inputElement.value = port.id;
                inputElement.name = "input-port-active";
                inputElement.setAttribute("type", "checkbox");
                const labelText = document.createElement("span");
                labelText.classList.add("label-text");
                labelText.innerText = `${port.manufacturer} ${port.name}`;
                labelElement.appendChild(labelText);
                labelElement.appendChild(inputElement);
                this.inputsElement.appendChild(labelElement);
            }

            inputElement.checked = active;
        }

        for (let i = 0; i < this.outputs.length; i += 1) {
            const outputElements = Array.from(this.outputsElement.querySelectorAll("output"));
            const {
                port = {},
                active = false
            } = this.outputs[i];
            const elementId = `midi-output-${port.id}`;
            let outputElement = outputElements.find(element => element.id === elementId);
            if (!outputElement) {
                const labelElement = document.createElement("label");
                outputElement = document.createElement("input");
                outputElement.id = elementId;
                outputElement.value = port.id;
                outputElement.name = "output-port-active";
                outputElement.setAttribute("type", "checkbox");
                outputElement.addEventListener("click", this.checkboxHandler);
                const labelText = document.createElement("span");
                labelText.classList.add("label-text");
                labelText.innerText = `${port.manufacturer} ${port.name}`;
                labelElement.appendChild(labelText);
                labelElement.appendChild(outputElement);
                this.outputsElement.appendChild(labelElement);
            }

            outputElement.checked = active;
        }
    }
}

export default Midi;
