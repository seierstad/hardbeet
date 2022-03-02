"use strict";
import { html, Component, render } from "./preact-standalone.module.min.js";
//import {combineReducers, compose, createStore} from "https://unpkg.com/redux@4.1.2/es/redux.mjs";
import {Provider} from "https://unpkg.com/react-redux";
//import {createStore} from "https://unpkg.com/unistore/full/preact.umd.js";
import Status, {LOGLEVEL} from "./status.js";
import Sensors from "./sensors.js";
import Midi from "./midi.js";
import AudioOutput from "./audio-output.js";
import {combineReducers, compose, createStore} from "./redux.mjs";



const callbackFunctions = {
    ecg: [],
    accelerometer: [],
    heartRate: []
};

/*
const defaultState = {
    sources: {
        sensors: [],
        midi: []
    },
    destinations: {
        midi: []
    }
};
const store = createStore(function (state) {return state;});
*/


class HardBeet extends Component {
    constructor (...args) {
        super(...args);

        this.log = this.log.bind(this);
        this.error = this.error.bind(this);
        this.firstClickHandler = this.firstClickHandler.bind(this);

        this.dataFunctions = {
            registerDevice: this.registerDevice.bind(this),
            registerSource: this.registerSource.bind(this),
            registerDestination: this.registerDestination.bind(this)
        };

        this.destinationsCounter = -1;
        this.sourceCounter = -1;
        this.deviceCounter = -1;

        this.state = {
            audioOutput: new AudioOutput(),
            midi: [],
            status: [],
            sources: [],
            destinations: [],
            devices: [],
            interactive: false,
            bluetoothAvaliable: false,
            midiAvailable: false
        };
    }

    componentDidMount () {

        this.log("testing if bluetooth is available");

        if (!navigator.bluetooth || typeof navigator.bluetooth.getAvailability !== "function") {
            this.unavailableBT();
        } else {
            navigator.bluetooth.onadvertisementreceived = event => this.log({"type": "onadvertisement", event});
            navigator.bluetooth.addEventListener("advertisementreceived", event => this.log("bluetooth advertisement received: " + event));
            navigator.bluetooth.addEventListener("availabilitychanged", event => this.log("bluetooth availability changed: " + event));

            navigator.bluetooth.getAvailability().then(
                isAvailable => {isAvailable ? this.btAvailable() : this.unavailableBT();},
                rejection => {
                    this.unavailableBT(rejection);
                });
        }
    }

    log (text) {
        this.setState({status: [{time: new Date(), text, level: LOGLEVEL.INFO}, ...this.state.status]});
    }

    error (text) {
        this.setState({status: [{time: new Date(), text, level: LOGLEVEL.ERROR}, ...this.state.status]});
    }

    dataCallbackFn (dataType, data, parameters) {
        const {
            [dataType]: typeFunctions = []
        } = callbackFunctions;

        for (let fn of typeFunctions) {
            fn(data, parameters);
        }
    }

    registerDevice (type, name) {
        this.deviceCounter += 1;
        console.log("registerDevice");
        this.setState({devices: [...this.state.devices, {type, name, index: this.deviceCounter}]});
        return this.deviceCounter;
    }

    registerSource (deviceIndex, type, name, channels, range = []) {
        this.sourceCounter += 1;

        this.setState({sources: [...this.state.sources, {type, name, channels, range, index: this.sourceCounter}]});
        return this.sourceCounter;

    }

    registerDestination (deviceIndex, type, name) {
        this.sourceCounter += 1;

        this.setState({sources: [...this.state.sources, {type, name, index: this.sourceCounter}]});
        return this.sourceCounter;
    }

    btAvailable () {
        this.log("bluetooth is available");
        this.setState({bluetoothAvaliable: true});
        this.checkMIDIAvaliability();
    }

    unavailableBT (reason = null) {
        this.log("bluetooth is not available" + (reason ? (": " + reason) : ""));
        this.checkMIDIAvaliability();
    }

    checkMIDIAvaliability () {
        this.log("testing if MIDI is available");
        if (!navigator.requestMIDIAccess) {
            this.unavailableMIDI();
        } else {
            this.log("MIDI is available.");
            this.setState({midiAvailable: true});
        }
    }

    unavailableMIDI () {
        status.log("MIDI is not available");
    }

    firstClickHandler () {
        this.state.audioOutput.initialize();
        document.body.removeEventListener("click", this.firstClickHandler);
    }

    render (props, state) {
        const {
            status,
            bluetoothAvaliable = false,
            devices = []
        } = state;

        return html`
            <main onClick=${this.firstClickHandler}>
                ${devices.map(device => html`<p>${device.name}, ${device.type}</p>`)}
                <${Status} messages=${status}/>
                <${Sensors} bluetoothAvaliable=${bluetoothAvaliable} bluetooth=${navigator.bluetooth} functions=${this.dataFunctions} />
                <${Midi} log=${this.log} error=${this.error} />
                <${AudioOutput} />
            </main>
        `;
    }


    /*
    callbackFunctions.ecg.push(audioOutput.addModulationData);
    callbackFunctions.ecg.push(midi.addModulationData);
    */
}

render(html`<${HardBeet} />`, document.body);
