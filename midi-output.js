"use strict";

import MidiPort from "./midi-port.js";
import {
    SYSEX_TYPE
} from "./midi-constants.js";


const MIDI_CLOCK_PPQ = 24;
const DEFAULT_STATIC_TEMPO = 100;


class MidiOutput extends MidiPort {
    constructor (port) {
        super(port);
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

        this.staticTempo = DEFAULT_STATIC_TEMPO;
        this.clockInterval = null;
        this.clockSource = "static";
        this.clockSourceChanged = false;
        this.open = false;
        this.clockRunning = false;

        this.heartRate = 50;
        this.heartRateNumerator = 1;
        this.heartRateDenominator = 1;
        this.heartRateFractionChanged = false;
        this.heartRateChanged = false;
    }

    openUI () {
        this.clockUI();
        this.transportUI();
    }

    clockSourceHandler (event) {
        this.clockSource = event.target.value;
        this.clockSourceChanged = true;
        this.clockUI();
    }

    setClockInterval () {
        if (this.clockSource === "static") {
            this.setStaticClockInterval();
        } else {
            this.setHeartRateClockInterval();
        }
    }


    clockStartHandler (event) {
        this.clockRunning = true;
        this.clockUI();
        this.setClockInterval();
    }

    clockStopHandler (event) {
        this.clockRunning = false;
        this.clockUI();
        clearInterval(this.clockInterval);
    }

    changeStaticTempoHandler (event) {
        const value = parseFloat(event.target.value);
        this.staticTempo = value;
        this.staticTempoChanged = true;
        this.clockUI();
    }

    setStaticClockInterval () {
        const interval = 1000 * 60.0 / this.staticTempo / MIDI_CLOCK_PPQ;
        this.clockInterval = setInterval(this.sendClock, interval);
    }

    sendClock () {
        this.port.send([SYSEX_TYPE.CLOCK]);
        if (this.clockSource === "heart-rate") {
            if (this.heartRateChanged || this.heartRateFractionChanged || this.clockSourceChanged) {
                this.clockSourceChanged = false;
                this.heartRateChanged = false;
                this.heartRateFractionChanged;
                clearInterval(this.clockInterval);
                this.setHeartRateClockInterval();
            }
        } else {
            if (this.staticTempoChanged || this.clockSourceChanged) {
                this.clockSourceChanged = false;
                this.staticTempoChanged = false;
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
        const interval = 1000 * 60.0 / (this.heartRate * this.heartRateDenominator / this.heartRateNumerator) / MIDI_CLOCK_PPQ;
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

    transportUI () {
        const transportContainer = document.createElement("div");
        const heading = document.createElement("h5");
        heading.innerText = "transport";
        transportContainer.appendChild(heading);

        const startButton = document.createElement("button");
        startButton.innerText = "start";
        startButton.addEventListener("click", this.transportStartHandler);
        transportContainer.appendChild(startButton);

        const continueButton = document.createElement("button");
        continueButton.innerText = "continue";
        continueButton.addEventListener("click", this.transportContinueHandler);
        transportContainer.appendChild(continueButton);

        const stopButton = document.createElement("button");
        stopButton.innerText = "stop";
        stopButton.addEventListener("click", this.transportStopHandler);
        transportContainer.appendChild(stopButton);

        this.rootElement.appendChild(transportContainer);

    }

    clockUI () {
        if (this.clockElement === null) {
            this.clockElement = document.createElement("div");
            const heading = document.createElement("h5");
            heading.innerText = "clock";
            this.clockElement.appendChild(heading);

            this.clockStartButton = document.createElement("button");
            this.clockStopButton = document.createElement("button");
            this.clockStartButton.innerText = "start";
            this.clockStopButton.innerText = "stop";
            this.clockStartButton.addEventListener("click", this.clockStartHandler);
            this.clockStopButton.addEventListener("click", this.clockStopHandler);

            const staticContainer = document.createElement("div");
            const heartRateContainer = document.createElement("div");

            const staticLabelElement = document.createElement("label");
            const staticLabelText = document.createElement("span");
            staticLabelText.classList.add("label-text");
            staticLabelText.innerText = "static";
            const clockSourceSelectorStatic = document.createElement("input");
            clockSourceSelectorStatic.setAttribute("type", "radio");
            clockSourceSelectorStatic.setAttribute("name", "clock-source");
            clockSourceSelectorStatic.setAttribute("value", "static");
            clockSourceSelectorStatic.addEventListener("change", this.clockSourceHandler);
            this.clockSourceSelectorStatic = clockSourceSelectorStatic;
            staticLabelElement.appendChild(clockSourceSelectorStatic);
            staticLabelElement.appendChild(staticLabelText);
            staticContainer.appendChild(staticLabelElement);


            const heartRateLabelElement = document.createElement("label");
            const heartRateLabelText = document.createElement("span");
            heartRateLabelText.classList.add("label-text");
            heartRateLabelText.innerText = "heart rate";
            const clockSourceSelectorHeartRate = document.createElement("input");
            clockSourceSelectorHeartRate.setAttribute("type", "radio");
            clockSourceSelectorHeartRate.setAttribute("name", "clock-source");
            clockSourceSelectorHeartRate.setAttribute("value", "heart-rate");
            clockSourceSelectorHeartRate.addEventListener("change", this.clockSourceHandler);
            this.clockSourceSelectorHeartRate = clockSourceSelectorHeartRate;
            heartRateLabelElement.appendChild(clockSourceSelectorHeartRate);
            heartRateLabelElement.appendChild(heartRateLabelText);
            heartRateContainer.appendChild(heartRateLabelElement);

            const numerator = document.createElement("input");
            numerator.setAttribute("type", "number");
            numerator.setAttribute("min", 1);
            numerator.setAttribute("max", 12);
            numerator.setAttribute("step", 1);
            numerator.addEventListener("change", this.heartRateNumeratorChangeHandler);
            this.heartRateNumeratorElement = numerator;

            const denominator = document.createElement("input");
            denominator.setAttribute("type", "number");
            denominator.setAttribute("min", 1);
            denominator.setAttribute("max", 12);
            denominator.setAttribute("step", 1);
            denominator.addEventListener("change", this.heartRateDenominatorChangeHandler);
            this.heartRateDenominatorElement = denominator;

            heartRateContainer.appendChild(numerator);
            heartRateContainer.appendChild(denominator);

            this.clockStaticTempoSlider = document.createElement("input");
            this.clockStaticTempoSlider.setAttribute("type", "range");
            this.clockStaticTempoSlider.setAttribute("min", 30);
            this.clockStaticTempoSlider.setAttribute("max", 240);
            this.clockStaticTempoSlider.setAttribute("value", this.staticTempo);
            this.clockStaticTempoSlider.setAttribute("step", 0.1);
            this.clockStaticTempoSlider.addEventListener("input", this.changeStaticTempoHandler);

            this.staticTempoDisplay = document.createElement("span");

            staticContainer.appendChild(this.clockStaticTempoSlider);
            staticContainer.appendChild(this.staticTempoDisplay);

            this.clockElement.appendChild(staticContainer);
            this.clockElement.appendChild(heartRateContainer);
            this.clockElement.appendChild(this.clockStartButton);
            this.clockElement.appendChild(this.clockStopButton);

            this.rootElement.appendChild(this.clockElement);

        }

        this.heartRateNumeratorElement.value = this.heartRateNumerator;
        this.heartRateDenominatorElement.value = this.heartRateDenominator;
        this.clockSourceSelectorStatic.checked = this.clockSource === "static";
        this.clockSourceSelectorHeartRate.checked = this.clockSource === "heart-rate";
        this.staticTempoDisplay.innerText = this.staticTempo;
        this.clockStartButton.disabled = !!this.clockRunning;
        this.clockStopButton.disabled = !this.clockRunning;
    }


}


export default MidiOutput;
