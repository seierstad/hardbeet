import {
    SYSEX_TYPE
} from "../constants.js";

import {MIDI_CLOCK_PPQ} from "./constants.js";


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


export {
    Clock
};
