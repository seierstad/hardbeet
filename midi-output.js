"use strict";
import {html, Component, useState, useEffect} from "./preact-standalone.module.min.js";
import MidiPort from "./midi-port.js";
import Transport from "./midi-transport.js";

import {
    MESSAGE_TYPE,
    SYSEX_TYPE
} from "./midi-constants.js";

const MIDI_CLOCK_PPQ = 24;
const DEFAULT_STATIC_TEMPO = 100;
const STATIC_TEMPO_MIN = 30;
const STATIC_TEMPO_MAX = 300;

const initialState = {
    clock: {
        staticTempo: DEFAULT_STATIC_TEMPO,
        source: "static",
        running: false,
        fraction: {
            numerator: 1,
            denominator: 1
        }
    },
    transport: {
        running: false
    },
    open: false

};

const ACTION = {
    MIDI_CLOCK_SET_STATIC_TEMPO: Symbol("MIDI_CLOCK_SET_STATIC_TEMPO"),
    MIDI_CLOCK_SOURCE: Symbol("MIDI_CLOCK_SOURCE"),
    MIDI_CLOCK_NUMERATOR: Symbol("MIDI_CLOCK_NUMERATOR"),
    MIDI_CLOCK_DENOMINATOR: Symbol("MIDI_CLOCK_DENOMINATOR")
};

const clockReducer = (state, action = {}) => {
    const {type, payload = {}} = action;

    switch (type) {
        case ACTION.MIDI_CLOCK_SET_STATIC_TEMPO:
            return {
                ...state,
                staticTempo: payload.value
            };

        case ACTION.MIDI_CLOCK_SOURCE:
            return {
                ...state,
                source: payload.value
            };

        case ACTION.MIDI_CLOCK_NUMERATOR:
            return {
                ...state,
                fraction: {
                    ...state.fraction,
                    numerator: payload.value
                }
            };

        case ACTION.MIDI_CLOCK_DENOMINATOR:
            return {
                ...state,
                fraction: {
                    ...state.fraction,
                    denominator: payload.value
                }
            };

    }

    return state;
};

const reducer = (state, action = {}) => {
    const {type, payload = {}} = action;

    switch (type) {
        case ACTION.MIDI_CLOCK_SET_STATIC_TEMPO:
        case ACTION.MIDI_CLOCK_SOURCE:
        case ACTION.MIDI_CLOCK_NUMERATOR:
        case ACTION.MIDI_CLOCK_DENOMINATOR:
            return {
                ...state,
                clock: clockReducer(state.clock, action)
            };

    }

    return state;
};

class Clock {
    constructor (port, options = {}) {
        const {
            numerator = 1,
            denominator = 1
        } = options;

        this.port = port;
        this.interval = null;
        this.numerator = numerator;
        this.denominator = denominator;
        this.recalculateInterval = false;
        this._running = false;
        this._staticTempo = {value: 100};
        this.heartRate = {value: 40};
        this.source = "static";
    }

    start () {
        this.running = true;
        this.calculateClockInterval();
    }

    stop () {
        this.running = false;

        if (this.interval !== null) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    sendClock () {
        if (this.running) {
            this.port.send([SYSEX_TYPE.CLOCK]);
            if (this.recalculateInterval) {
                clearInterval(this.interval);
                this.calculateClockInterval();
            }
        } else {
            clearInterval(this.interval);
        }
    }

    calculateClockInterval () {
        const interval = 1000 * 60.0 / (this.selectedSource.value * this.numerator / this.denominator) / MIDI_CLOCK_PPQ;
        this.interval = setInterval(this.sendClock.bind(this), interval);
        this.recalculateInterval = false;
    }

    set source (source) {
        switch (source) {
            case "static":
                this.selectedSource = this._staticTempo;
                break;
            case "heart-rate":
                this.selectedSource = this.heartRate;
                break;
        }

        this.recalculateInterval = true;
    }

    get numerator () {
        return this._numerator;
    }
    set numerator (numerator) {
        this._numerator = numerator;
        this.recalculateInterval = true;
    }

    get denominator () {
        return this._denominator;
    }
    set denominator (denominator) {
        this._denominator = denominator;
        this.recalculateInterval = true;
    }

    set running (running) {
        this._running = running;
    }

    get running () {
        return this._running;
    }

    get staticTempo () {
        return this._staticTempo.value;
    }

    set staticTempo (staticTempo) {
        this._staticTempo.value = staticTempo;
        this.recalculateInterval = true;
    }
}


function MidiOutput (props) {
    const {port} = props;
    const [clock] = useState(new Clock(port));
    const [clockRunning, setClockRunning] = useState(false);
    const [clockSource, setClockSource] = useState("static");
    const [numerator] = useState(1);
    const [denominator] = useState(1);
    const [staticTempo, setStaticTempo] = useState(DEFAULT_STATIC_TEMPO);

    const clockStartHandler = () => {
        setClockRunning(true);
    };

    const clockStopHandler = () => {
        setClockRunning(false);
    };

    const numeratorHandler = (event) => {
        const value = parseInt(event.target.value, 10);
        //setNumerator(value);
        clock.numerator = value;
    };

    const denominatorHandler = (event) => {
        clock.denominator = parseInt(event.target.value, 10);
    };

    const clockSourceHandler = (event) => {
        setClockSource(event.target.value);
    };

    const staticTempoHandler = (event) => {
        setStaticTempo(parseInt(event.target.value, 10));
    };

    useEffect(() => {
        clock.source = clockSource;
    }, [clockSource]);

    useEffect(() => {
        if (clockRunning) {
            clock.start();
        } else if (clock.running) {
            clock.stop();
        }
    }, [clockRunning]);

    useEffect(() => {
        clock.staticTempo = staticTempo;
    }, [staticTempo]);

    return html`
        <${MidiPort} port=${port}>
            <${Transport} port=${port} />
            <div>
                <h5>clock</h5>
                <button disabled=${!!clockRunning} onClick=${clockStartHandler}>start</button>
                <button disabled=${!clockRunning} onClick=${clockStopHandler}>stop</button>

                <div>
                    <label>
                        <input
                            checked=${clockSource === "static"}
                            type="radio"
                            name="clock-source"
                            value="static"
                            onClick=${clockSourceHandler}
                        />
                        <span class="label-text">static</span>
                    </label>
                    <input
                        type="range"
                        min=${STATIC_TEMPO_MIN}
                        max=${STATIC_TEMPO_MAX}
                        value=${staticTempo}
                        step="0.1"
                        onInput=${staticTempoHandler}
                    />
                    <span class="static-tempo-display">${staticTempo}</span>
                </div>

                <div>
                    <label>
                        <input
                            checked=${clockSource === "heart-rate"}
                            type="radio"
                            name="clock-source"
                            value="heart-rate"
                            onClick=${clockSourceHandler}
                        />
                        <span class="label-text">heart-rate</span>
                    </label>
                    <input
                        type="number"
                        min="1"
                        max="12"
                        step="1"
                        size="2"
                        value=${numerator}
                        onChange=${numeratorHandler}
                    />
                    <input
                        type="number"
                        min="1"
                        max="12"
                        step="1"
                        size="2"
                        value=${denominator}
                        onChange=${denominatorHandler}
                    />
                    (${numerator} / ${denominator})
                </div>
            </div>
        <//>
    `;

}


export default MidiOutput;

export {
    initialState,
    ACTION,
    reducer
};

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