"use strict";
import {html, Component} from "./preact-standalone.module.min.js";
import {NoiseNode, NoiseComponent} from "./noise.js";


class AudioOutput extends Component {
    constructor () {
        super();
        this.ctx = null;
        this.noise = null;
        this.carrierFrequency = 440;
        this.heartRate = 60;
        this.previousTimestamp = null;

        this._modulatorParameters = {};
        this.pingParameters = {};

        this.toggleCarrierHandler = this.toggleCarrierHandler.bind(this);
        this.initialize = this.initialize.bind(this);
        this.addModulationData = this.addModulationData.bind(this);
        this.initNoise = this.initNoise.bind(this);
        this.toggleConstantSource = this.toggleConstantSource.bind(this);

        this.state = {
            carrierRunning: false,
            constantSourceRunning: false,
            noiseInitialized: false
        };
    }

    render (props, state) {
        const {
            carrierRunning,
            constantSourceRunning,
            noiseInitialized
        } = state;

        return html`
            <section>
                <header><h2>audio output</h2></header>
                <button onClick=${this.toggleCarrierHandler}>${carrierRunning ? "stop" : "start"} carrier</button>
                <button onClick=${this.toggleConstantSource}>${constantSourceRunning ? "stop" : "start"} constant source</button>
                ${noiseInitialized ? html`<${NoiseComponent} noise=${this.noise} />` : null}
            </section>
        `;
    }

    toggleCarrierHandler () {
        if (this.ctx === null) {
            this.initialize();
        }

        if (this.state.carrierRunning) {
            this.carrierOscillator.stop();
            this.createCarrier();
            this.setState({carrierRunning: false});
        } else {
            this.carrierOscillator.start();
            this.setState({carrierRunning: true});
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
            this.setState({constantSourceRunning: false});
        } else {
            this.constantSource.start();
            this.setState({constantSourceRunning: true});
        }
    }

    createConstantSource () {
        this.constantSource = this.ctx.createConstantSource();
        this.constantSource.connect(this.modulatedGain);
    }

    initNoise () {
        this.noise = new NoiseNode(this.ctx);
        this.noise.connect(this.modulatedGain);
        this.setState({noiseInitialized: true});
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

export default AudioOutput;
