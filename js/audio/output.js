import {useEffect, useState, useContext} from "preact/hooks";
import {html} from "htm/preact";

import {AppStateContext, AppHandlersContext} from "hardbeet";

import {Carrier} from "./carrier/carrier.js";
import {Constant} from "./constant/constant.js";
import {Noise} from "./noise/noise.js";


const AudioOutput = (props = {}) => {
    const {audio: state} = useContext(AppStateContext);
    const {audio: handlers} = useContext(AppHandlersContext);

    const [ctx] = useState(new AudioContext());
    const [masterGain] = useState(ctx.createGain());
    const [modulatedGain] = useState(ctx.createGain());

    useEffect(() => {
        modulatedGain.gain.value = 0.4;
        modulatedGain.connect(masterGain).connect(ctx.destination);
    }, []);

    return html`
        <section>
            <header><h2>audio output</h2></header>
            <${Carrier} state=${state.carrier} ctx=${ctx} destination=${modulatedGain} handlers=${handlers.carrier} />
            <${Noise} state=${state.noise} ctx=${ctx} destination=${modulatedGain} handlers=${handlers.noise} />
            <${Constant} state=${state.constant} ctx=${ctx} destination=${modulatedGain} handlers=${handlers.constant} />
        </section>
    `;
};

/*






    initialize () {
        if (this.ctx === null) {
            this.previousTimestamp = this.ctx.currentTime;

            this.pingOscillator = this.ctx.createOscillator();
            this.pingOscillator.start();
            this.pingGain = this.ctx.createGain();
            this.pingGain.gain.value = 0;

            this.pingOscillator
                .connect(this.pingGain)
                .connect(this.masterGain);

            this.noiseGain.connect(this.modulatedGain);

            this.modulatedGain
                .connect(this.masterGain)
                .connect(this.ctx.destination);

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


export {
    AudioOutput
};
