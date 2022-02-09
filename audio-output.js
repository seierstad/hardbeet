"use strict";

import Noise from "./noise.js";

class AudioOutput {
    constructor () {
        this.ctx = null;
        this.carrierFrequency = 440;
        this.heartRate = 60;
        this.previousTimestamp = null;

        this.rootElement = document.createElement("section");
        const header = document.createElement("header");
        const heading = document.createElement("h2");
        heading.innerText = "Audio output";
        header.appendChild(heading);
        this.rootElement.appendChild(header);

        this._modulatorParameters = {};
        this.pingParameters = {};

        this.startCarrierHandler = this.startCarrierHandler.bind(this);
        this.stopCarrierHandler = this.stopCarrierHandler.bind(this);
        this.initialize = this.initialize.bind(this);
        this.addModulationData = this.addModulationData.bind(this);
        this.initNoise = this.initNoise.bind(this);
        this.startConstantSource = this.startConstantSource.bind(this);
        this.stopConstantSource = this.stopConstantSource.bind(this);

        this.carrierButton = document.createElement("button");
        this.carrierButton.innerText = "start carrier";
        this.carrierButton.addEventListener("click", this.startCarrierHandler);
        this.rootElement.appendChild(this.carrierButton);

        this.constantSourceButton = document.createElement("button");
        this.constantSourceButton.innerText = "start constant source";
        this.constantSourceButton.addEventListener("click", this.startConstantSource);
        this.rootElement.appendChild(this.constantSourceButton);

    }

    startCarrierHandler () {
        if (this.ctx === null) {
            this.initialize();
        }

        this.carrierOscillator.start();
        this.carrierButton.innerText = "stop carrier";
        this.carrierButton.removeEventListener("click", this.startCarrierHandler);
        this.carrierButton.addEventListener("click", this.stopCarrierHandler);
    }

    createCarrier () {
        this.carrierOscillator = this.ctx.createOscillator();
        this.carrierOscillator.frequency.value = this.carrierFrequency;
        this.carrierOscillator.connect(this.modulatedGain);
    }

    stopCarrierHandler () {
        this.carrierOscillator.stop();

        this.createCarrier();

        this.carrierButton.innerText = "start carrier";
        this.carrierButton.removeEventListener("click", this.stopCarrierHandler);
        this.carrierButton.addEventListener("click", this.startCarrierHandler);
    }


    startConstantSource () {
        if (this.ctx === null) {
            this.initialize();
        }

        this.constantSource.start();
        this.constantSourceButton.innerText = "stop constant source";
        this.constantSourceButton.removeEventListener("click", this.startConstantSource);
        this.constantSourceButton.addEventListener("click", this.stopConstantSource);
    }

    createConstantSource () {
        this.constantSource = this.ctx.createConstantSource();
        this.constantSource.connect(this.modulatedGain);
    }

    stopConstantSource () {
        this.constantSource.stop();

        this.createConstantSource();

        this.constantSourceButton.innerText = "start constant source";
        this.constantSourceButton.removeEventListener("click", this.stopConstantSource);
        this.constantSourceButton.addEventListener("click", this.startConstantSource);
    }

    initNoise () {
        this.noise = new Noise(this.ctx);
        this.noise.connect(this.modulatedGain);
        this.rootElement.appendChild(this.noise.rootElement);
    }

    initialize () {
        if (this.ctx === null) {
            this.ctx = new AudioContext();
            this.previousTimestamp = this.ctx.currentTime;

            this.masterGain = this.ctx.createGain();

            this.modulatedGain = this.ctx.createGain();
            this.modulatedGain.gain.value = 0;

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
