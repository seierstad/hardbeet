"use strict";
import {html, Component} from "./preact-standalone.module.min.js";
import MidiPort from "./midi-port.js";

import {
    MESSAGE_TYPE,
    SYSEX_TYPE
} from "./midi-constants.js";


const MIDI_CLOCK_PPQ = 24;
const DEFAULT_STATIC_TEMPO = 100;


class MidiOutput extends Component {
    constructor (props) {
        super();

        this.port = props.port;
        this.clockStartHandler = this.clockStartHandler.bind(this);
        this.clockStopHandler = this.clockStopHandler.bind(this);
        this.changeStaticTempoHandler = this.changeStaticTempoHandler.bind(this);
        this.clockSourceHandler = this.clockSourceHandler.bind(this);
        this.heartRateNumeratorChangeHandler = this.heartRateNumeratorChangeHandler.bind(this);
        this.heartRateDenominatorChangeHandler = this.heartRateDenominatorChangeHandler.bind(this);
        this.sendClock = this.sendClock.bind(this);

        this.transportStartHandler = this.transportStartHandler.bind(this);
        this.transportContinueHandler = this.transportContinueHandler.bind(this);
        this.transportStopHandler = this.transportStopHandler.bind(this);

        this.stateChangeHandler = this.stateChangeHandler.bind(this);

        this.port.addEventListener("statechange", this.stateChangeHandler);

        this.clockInterval = null;
        this.state = {
            staticTempo: DEFAULT_STATIC_TEMPO,
            clockSource: "static",
            clockSourceChanged: false,
            open: false,
            clockRunning: false,
            heartRate: 50,
            heartRateNumerator: 1,
            heartRateDenominator: 1,
            heartRateFractionChanged: false,
            heartRateChanged: false
        };
    }

    stateChangeHandler (event) {
        const portState = event.port.connection === "open";
        if (this.state.open !== portState) {
            this.setState({open: portState});
        }
    }

    render () {
        return html`
            <${MidiPort} port=${this.port}>
                ${this.state.open ? html`
                    <>
                        <div>
                            <h5>transport</h5>
                            <button onClick=${this.transportStartHandler}>start</button>
                            <button onClick=${this.transportContinueHandler}>continue</button>
                            <button onClick=${this.transportStopHandler}>stop</button>
                        </div>
                        <div>
                            <h5>clock</h5>
                            <button disabled=${!!this.state.clockRunning} onClick=${this.clockStartHandler}>start</button>
                            <button disabled=${!this.state.clockRunning} onClick=${this.clockStopHandler}>stop</button>
                            <div>
                                <label>
                                    <input
                                        checked=${this.state.clockSource === "static"}
                                        type="radio"
                                        name="clock-source"
                                        value="static"
                                        onChange=${this.clockSourceHandler}
                                    />
                                    <span class="label-text">static</span>
                                </label>
                                <input
                                    type="range"
                                    min="30"
                                    max="240"
                                    value=${this.state.staticTempo}
                                    step="0.1"
                                    onInput=${this.changeStaticTempoHandler}
                                />
                                <span class="static-tempo-display">${this.state.staticTempo}</span>
                            </div>
                            <div>
                                <label>
                                    <input
                                        checked=${this.state.clockSource === "heart-rate"}
                                        type="radio"
                                        name="clock-source"
                                        value="heart-rate"
                                        onChange=${this.clockSourceHandler}
                                    />
                                    <span class="label-text">heart-rate</span>
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="12"
                                    step="1"
                                    value=${this.state.heartRateNumerator}
                                    onChange=${this.heartRateNumeratorChangeHandler}
                                />
                                <input
                                    type="number"
                                    min="1"
                                    max="12"
                                    step="1"
                                    value=${this.state.heartRateDenominator}
                                    onChange=${this.heartRateDenominatorChangeHandler}
                                />
                            </div>
                        </>
                ` : null}
            <//>
        `;
    }

    clockSourceHandler (event) {
        this.setState({
            clockSource: event.target.value,
            clockSourceChanged: true
        });
    }

    setClockInterval () {
        if (this.clockSource === "static") {
            this.setStaticClockInterval();
        } else {
            this.setHeartRateClockInterval();
        }
    }


    clockStartHandler () {
        this.setState({clockRunning: true});
        this.setClockInterval();
    }

    clockStopHandler () {
        this.setState({clockRunning: false});
        clearInterval(this.clockInterval);
    }

    changeStaticTempoHandler (event) {
        const value = parseFloat(event.target.value);
        this.setState({
            staticTempo: value,
            staticTempoChanged: true
        });
    }

    setStaticClockInterval () {
        const interval = 1000 * 60.0 / this.state.staticTempo / MIDI_CLOCK_PPQ;
        this.clockInterval = setInterval(this.sendClock, interval);
    }

    sendClock () {
        this.port.send([SYSEX_TYPE.CLOCK]);
        if (this.state.clockSource === "heart-rate") {
            if (this.state.heartRateChanged || this.state.heartRateFractionChanged || this.state.clockSourceChanged) {
                this.setState({
                    clockSourceChanged: false,
                    heartRateChanged: false,
                    heartRateFractionChanged: false
                });
                clearInterval(this.clockInterval);
                this.setHeartRateClockInterval();
            }
        } else {
            if (this.state.staticTempoChanged || this.state.clockSourceChanged) {
                this.setState({
                    clockSourceChanged: false,
                    staticTempoChanged: false
                });
                clearInterval(this.clockInterval);
                this.setStaticClockInterval();
            }
        }
    }

    heartRateNumeratorChangeHandler (event) {
        const value = parseInt(event.target.value, 10);
        if (value !== this.heartRateNumerator) {
            this.heartRateFractionChanged = true;
            this.heartRateNumerator = value;
        }
    }


    setHeartRateClockInterval () {
        const interval = 1000 * 60.0 / (this.state.heartRate * this.state.heartRateDenominator / this.state.heartRateNumerator) / MIDI_CLOCK_PPQ;
        this.clockInterval = setInterval(this.sendClock, interval);
    }

    heartRateDenominatorChangeHandler (event) {
        const value = parseInt(event.target.value, 10);
        if (value !== this.heartRateDenominator) {
            this.heartRateFractionChanged = true;
            this.heartRateDenominator = value;
        }
    }

    transportStartHandler () {
        this.port.send([SYSEX_TYPE.START]);
    }
    transportContinueHandler () {
        this.port.send([SYSEX_TYPE.CONTINUE]);
    }
    transportStopHandler () {
        this.port.send([SYSEX_TYPE.STOP]);
    }
}


export default MidiOutput;


/*
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
}
*/