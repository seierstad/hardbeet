"use strict";
import {html, useEffect, useState, useReducer} from "./preact-standalone.module.min.js";
import {NoiseNode, Noise, initialState as initialNoiseState} from "./noise.js";
import Toggle from "./toggle.js";

const ACTION = {
    AUDIO_CARRIER_TOGGLE: Symbol("AUDIO_CARRIER_TOGGLE"),
    AUDIO_CONSTANT_TOGGLE: Symbol("AUDIO_CONSTANT_TOGGLE")
};

const initialState = {
    carrier: {
        toggle: "off",
        frequency: 440
    },
    constant: {
        toggle: "off"
    },
    noise: initialNoiseState
};

const reducer = (state, action = {}) => {
    const {type, payload} = action;

    switch (type) {

        case ACTION.AUDIO_CARRIER_TOGGLE:
            return {
                ...state,
                carrier: {
                    ...state.carrier,
                    toggle: payload
                }
            };

        case ACTION.AUDIO_CONSTANT_TOGGLE:
            return {
                ...state,
                constant: {
                    ...state.constant,
                    toggle: payload
                }
            };

        default:
            return state;
    }
};

function AudioOutput (props) {

    const [state, dispatch] = useReducer(reducer, initialState);
    useEffect(() => {
        console.log("carrier toggled");
    }, [state.carrier.toggle]);

    useEffect(() => {
        console.log("constant toggled");
    }, [state.constant.toggle]);

    useEffect(() => {
        console.log("listen carefully - I will say this önly once");
    }, []);

    /*
    this.ctx = null;
    this.noise = null;
    this.previousTimestamp = null;

    this.pingParameters = {};
    */

    const {
        carrier: {
            toggle: carrierToggle
        },
        constant: {
            toggle: constantToggle
        },
        noiseInitialized
    } = state;

    return html`
        <section>
            <header><h2>audio output</h2></header>
            <div class="carrier">
                <h5>carrier</h5>
                <${Toggle} name="toggle-carrier" legend="toggle" options=${[["off"], ["on"]]} selected=${carrierToggle} default="off" dispatch=${dispatch} action=${ACTION.AUDIO_CARRIER_TOGGLE} />
            </div>
            <div class="constant">
                <h5>constant</h5>
                <${Toggle} name="toggle-constant" legend="toggle" options=${[["off"], ["on"]]} selected=${constantToggle} default="off" dispatch=${dispatch} action=${ACTION.AUDIO_CONSTANT_TOGGLE} />
            </div>
            ${noiseInitialized ? html`<${Noise} noise=${this.noise} />` : null}
        </section>
    `;
}

/*
    toggleCarrierHandler () {
        if (this.ctx === null) {
            this.initialize();
        }

        if (this.state.carrierRunning) {
            this.carrierOscillator.stop();
            this.createCarrier();
            this.setState(prevState => ({...prevState, carrierRunning: false}));
        } else {
            this.carrierOscillator.start();
            this.setState(prevState => ({...prevState, carrierRunning: true}));
        }

    }

    createCarrier () {
        this.carrierOscillator = this.ctx.createOscillator();
        this.carrierOscillator.frequency.value = this.carrierFrequency;
        this.carrierOscillator.connect(this.modulatedGain);
    }


    toggleConstantSource () {
        if (this.ctx === null) {
            this.initialize();
        }
        if (this.state.constantSourceRunning) {
            this.constantSource.stop();
            this.createConstantSource();
            this.setState(prevState => ({...prevState, constantSourceRunning: false}));
        } else {
            this.constantSource.start();
            this.setState(prevState => ({...prevState, constantSourceRunning: true}));
        }
    }

    createConstantSource () {
        this.constantSource = this.ctx.createConstantSource();
        this.constantSource.connect(this.modulatedGain);
    }

    initNoise () {
        this.noise = new NoiseNode(this.ctx);
        this.noise.connect(this.modulatedGain);
        this.setState(prevState => ({...prevState, noiseInitialized: true}));
    }

    initialize () {
        if (this.ctx === null) {
            this.ctx = new AudioContext();
            this.previousTimestamp = this.ctx.currentTime;

            this.masterGain = this.ctx.createGain();

            this.modulatedGain = this.ctx.createGain();
            this.modulatedGain.gain.value = 0.4;

            this.createConstantSource();
            this.createCarrier();

            this.pingOscillator = this.ctx.createOscillator();
            this.pingOscillator.start();
            this.pingGain = this.ctx.createGain();
            this.pingGain.gain.value = 0;

            this.pingOscillator
                .connect(this.pingGain)
                .connect(this.masterGain);

            this.noiseGain = this.ctx.createGain();
            this.noiseGain.connect(this.modulatedGain);

            this.modulatedGain
                .connect(this.masterGain)
                .connect(this.ctx.destination);

            this.ctx.audioWorklet.addModule("noise-processor.js").then(() => this.initNoise());
        }
    }

    set modulatorParameters (parameters = {}) {
        const {
            frequency = null
        } = parameters;

        if (frequency) {
            this._modulatorParameters.frequency = frequency;
        }
    }

    get modulatorParameters () {
        return this._modulatorParameters;
    }

    addModulationData (data, parameters = {}) {
        const {
            samplerate = null
        } = parameters;

        this.previousTimestamp = Math.max(this.previousTimestamp, this.ctx.currentTime);

        if (samplerate) {
            this._modulatorParameters.samplerate = samplerate;
        }

        //const duration = data.length / this.modulatorParameters.samplerate;
        const deltaTime = 1 / this.modulatorParameters.samplerate;
        data.forEach(([value]) => {
            this.modulatedGain.gain.linearRampToValueAtTime(value, this.previousTimestamp + deltaTime);
            this.previousTimestamp += deltaTime;
        });
    }

    set gain (gain) {
        this.masterGain.gain.setValue(gain);
    }

    set rate (heartRate) {
        this.heartRate = heartRate;
    }
}
*/

export default AudioOutput;
