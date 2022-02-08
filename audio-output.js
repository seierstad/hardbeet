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

		this.carrierButton = document.createElement("button");
		this.carrierButton.innerText = "start carrier";
		this.carrierButton.addEventListener("click", this.startCarrierHandler);
		this.rootElement.appendChild(this.carrierButton);
	}

	startCarrierHandler (event) {
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

	stopCarrierHandler (event) {
		this.carrierOscillator.stop();

		this.createCarrier();

		this.carrierButton.innerText = "start carrier";
		this.carrierButton.removeEventListener("click", this.stopCarrierHandler);
		this.carrierButton.addEventListener("click", this.startCarrierHandler);
	}


	initNoise () {
		this.noise = new Noise(this.ctx);
		this.noise.connect(this.modulatedGain);
	}

	initialize () {
		this.ctx = new AudioContext();
		this.previousTimestamp = this.ctx.currentTime;

		this.masterGain = this.ctx.createGain();

		this.modulatedGain = this.ctx.createGain();
		this.modulatedGain.gain.value = 0;

		this.createCarrier();

		this.pingOscillator = this.ctx.createOscillator();
		this.pingOscillator.start();
		this.pingGain = this.ctx.createGain();
		this.pingGain.gain.value = 0;

		this.pingOscillator
			.connect(this.pingGain)
			.connect(this.masterGain);


		this.carrierOscillator
			.connect(this.modulatedGain)
			.connect(this.masterGain)
			.connect(this.ctx.destination);

		this.ctx.audioWorklet.addModule("noise-processor.js").then(() => this.initNoise());
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

		const duration = data.length / this.modulatorParameters.samplerate;
		const deltaTime = 1 / this.modulatorParameters.samplerate;
		data.forEach(([value], index) => {
			this.modulatedGain.gain.linearRampToValueAtTime(value, this.previousTimestamp + deltaTime);
			this.previousTimestamp += deltaTime;
		});
//		this.modulatedGain.gain.setValueCurveAtTime(curve, this.ctx.currentTime, duration);
	}

	set gain (gain) {
		this.masterGain.gain.setValue(gain);
	}

	set rate (heartRate) {
		this.heartRate = heartRate;
	}
}

export default AudioOutput;
