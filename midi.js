"use strict";
import {html, Component} from "./preact-standalone.module.min.js";
import {MESSAGE_TYPE} from "./midi-constants.js";

import MidiInput from "./midi-input.js";
import MidiOutput from "./midi-output.js";


class Midi extends Component {
    constructor (props) {
        super(props);

        const {
            log,
            error
        } = props;
        this.log = log;
        this.error = error;
        this.access = null;
        this.inputs = [];
        this.outputs = [];
        this._samplerate = null;
        this.samplerateChanged = false;
        this.buffer = [];

        this.addModulationData = this.addModulationData.bind(this);
        this.checkboxHandler = this.checkboxHandler.bind(this);
        this.connectHandler = this.connectHandler.bind(this);
        this.onAccess = this.onAccess.bind(this);
        this.onAccessFailure = this.onAccessFailure.bind(this);
        this.sendPitch = this.sendPitch.bind(this);
        this.playBuffer = this.playBuffer.bind(this);

        this.interval = null;
        this.state = {
            access: null,
            accessRequested: false,
            accessError: null
        };
    }

    render (props, state) {
        const {
            access,
            accessRequested,
            accessError
        } = state;

        return (html`
            <section id="midi">
                <header><h2>MIDI</h2></header>
                ${access ? html`
                    <fieldset>
                        <legend>inputs</legend>
                        ${this.inputs.map((port, index) => html`<${MidiInput} port=${port} key=${index + "_" + port.id}/>`)}
                    </fieldset>
                    <fieldset>
                        <legend>outputs</legend>
                        ${this.outputs.map((port, index) => html`<${MidiOutput} port=${port} key=${index + "_" + port.id}/>`)}
                    </fieldset>
                ` : html`
                    <button disabled=${accessRequested} onClick=${this.connectHandler}>connect midi</button>
                `}
                ${accessError ? html`<span>${accessError}</span>` : null}
            </section>
        `);
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
        const {
            samplerate = 130
        } = parameters;

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

    connectHandler () {
        this.setState({accessRequested: true});
        //this.logger.log("Requesting access to MIDI.");
        navigator.requestMIDIAccess({"sysex": true}).then(this.onAccess, this.onAccessFailure);
    }

    onAccessFailure (message) {
        this.log("Failed to get MIDI access: " + message);
        this.setState({accessError: "Failed to get MIDI access: " + message});
    }


    removeConnectButton () {
        this.connectButton.removeEventListener("click", this.connectHandler);
        this.connectButton.parentNode.removeChild(this.connectButton);
    }

    onAccess (access) {
        this.log("MIDI access granted!");
        access.addEventListener("statechange", this.accessStateChangeHandler);

        const outputIterator = access.outputs.entries();
        for (let [, port] of outputIterator) {
            this.outputs.push(port);
        }

        const inputIterator = access.inputs.entries();
        for (let [, port] of inputIterator) {
            this.inputs.push(port);
        }

        this.setState({access});
    }
}

export default Midi;
