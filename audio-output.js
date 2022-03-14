"use strict";
import {html, useEffect, useState} from "./preact-standalone.module.min.js";
import {NoiseNode, Noise, reducer as noiseReducer, ACTION as NOISE_ACTION, initialState as initialNoiseState} from "./noise.js";
import Carrier, {initialState as initialCarrierState, ACTION as CARRIER_ACTION, reducer as carrierReducer} from "./audio-carrier.js";
import Constant, {initialState as initialConstantState, ACTION as CONSTANT_ACTION, reducer as constantReducer} from "./audio-constant.js";

const ACTION = {
    ...CARRIER_ACTION,
    ...CONSTANT_ACTION,
    ...NOISE_ACTION
};

const initialState = {
    carrier: initialCarrierState,
    constant: initialConstantState,
    noise: initialNoiseState
};

const reducer = (state, action = {}) => {

    if (Object.values(ACTION).indexOf(action.type) === -1) {
        return state;
    }

    return {
        carrier: carrierReducer(state.carrier, action),
        constant: constantReducer(state.constant, action),
        noise: noiseReducer(state.noise, action)
    };
};

function AudioOutput (props) {
    const {dispatch, state} = props;

    const [ctx] = useState(new AudioContext());
    const [masterGain] = useState(ctx.createGain());
    const [modulatedGain] = useState(ctx.createGain());

    useEffect(() => {
        console.log("listen carefully - I will say this önly once: initialize context, carrier & noise!");
        modulatedGain.gain.value = 0.4;
        modulatedGain.connect(masterGain).connect(ctx.destination);
    }, []);

    useEffect(() => {
        console.log("carrier toggled");
    }, [state.carrier.toggle]);

    useEffect(() => {
        console.log("constant toggled");
    }, [state.constant.toggle]);


    /*
    this.previousTimestamp = null;
    */

    const {
        noiseInitialized
    } = state;


    return html`
        <section>
            <header><h2>audio output</h2></header>
            <${Carrier} dispatch=${dispatch} state=${state.carrier} ctx=${ctx} destination=${modulatedGain} />
            <${Constant} dispatch=${dispatch} state=${state.constant} ctx=${ctx} destination=${modulatedGain} />
            ${noiseInitialized ? html`<${Noise} noise=${this.noise} />` : null}
        </section>
    `;
}

/*

    initNoise () {
        this.noise = new NoiseNode(this.ctx);
        this.noise.connect(this.modulatedGain);
        this.setState(prevState => ({...prevState, noiseInitialized: true}));
    }

    initialize () {
        if (this.ctx === null) {
            this.previousTimestamp = this.ctx.currentTime;

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

export {
    ACTION,
    initialState,
    reducer
};
