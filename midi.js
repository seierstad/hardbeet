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
        this.midiChannel = 0;
        this._samplerate = null;
        this.samplerateChanged = false;
        this.buffer = [];

        this.addModulationData = this.addModulationData.bind(this);
        this.checkboxHandler = this.checkboxHandler.bind(this);
        this.onAccess = this.onAccess.bind(this);
        this.sendPitch = this.sendPitch.bind(this);
        this.playBuffer = this.playBuffer.bind(this);
        this.addConnectButton();

        this.interval = null;
    }

    playBuffer () {
        if (this.buffer.length > 0) {
            this.sendPitch(this.buffer.shift());
        }
        if (this.samplerateChanged) {
            clearInterval(this.interval);
            this.interval = setInterval(this.playBuffer, 1000 / this.samplerate);
            this.samplerateChanged = false;
        }
    }

    set samplerate (samplerate) {
        if (samplerate !== this._samplerate) {
            this._samplerate = samplerate;
            this.samplerateChanged = true;

        }
        if (this.interval === null) {
            this.interval = setInterval(this.playBuffer, 1000 / samplerate);
        }
    }

    get samplerate () {
        return this._samplerate;
    }

    sendPitch (value) {
        const pitchValue = Math.floor(0x2000 + value * 0x1fff);
        const mvb = pitchValue >> 7;
        const lvb = pitchValue & 0x7f;
        this.outputs.forEach(port => {
            port.port.send([MESSAGE_TYPE.PITCH_BEND, lvb, mvb]);
        });
    }

    addModulationData (data, parameters = {}) {
        this.buffer.push(...data.map(([value]) => value));
        const samplerate = (parameters.hasOwnProperty("samplerate")) ? parameters.samplerate : 130;
        if (this.samplerate !== samplerate) {
            this.samplerate = samplerate;
        }
    }

    checkboxHandler (event) {
        const {
            target: {
                value,
                checked
            } = {}
        } = event;
        const port = this.outputs.find(p => p.port.id === value);
        const velocity = 127;
        const note = 65;
        if (port) {
            if (checked) {
                port.port.open().then(p => p.send([MESSAGE_TYPE.NOTE_ON, note, velocity]));
            } else {
                port.port.send([MESSAGE_TYPE.NOTE_OFF, note, velocity]);
            }
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
