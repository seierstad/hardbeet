"use strict";
import { html, render, useReducer, useEffect } from "./preact-standalone.module.min.js";
//import { html, render, useReducer, useEffect } from "./preact.module.js";

import Status, {ACTION as STATUS_ACTION, LOGLEVEL, reducer as statusReducer, initialState as statusInitialState} from "./status.js";
import Sensors, {reducer as devicesReducer, initialState as devicesInitialState} from "./sensors.js";
import Midi, {initialState as midiInitialState, ACTION as MIDI_ACTION, reducer as midiReducer} from "./midi.js";
import AudioOutput, {reducer as audioReducer, ACTION as AUDIO_ACTION, initialState as audioInitialState} from "./audio-output.js";


const initialState = {
    devices: devicesInitialState,
    status: statusInitialState,
    audio: audioInitialState,
    midi: midiInitialState,
    bluetoothAvailable: null,
    midiAvailable: null,
    interactive: false
};

const ACTION = {
    SET_INTERACTIVE: Symbol("SET_INTERACTIVE"),
    BT_AVAILABILITY: Symbol("BT_AVAILABILITY"),
    MIDI_AVAILABILITY: Symbol("MIDI_AVAILABILITY"),
    TEST_1: Symbol("TEST_1"),
    TEST_2: Symbol("TEST_2")
};

const rootReducer = (state, action = {}) => {
    const {type, payload = {}} = action;
    const {audioContext = false} = payload;

    switch (type) {
        case ACTION.TEST_1:
            console.log("test 1");
            return {
                ...state
            };

        case ACTION.TEST_2:
            console.log("test 2");
            return {
                ...state
            };

        case ACTION.SET_INTERACTIVE:
            return {
                ...state,
                audioContext,
                interactive: true
            };

        case ACTION.BT_AVAILABILITY:
            return {
                ...state,
                bluetoothAvailable: payload
            };

        case ACTION.MIDI_AVAILABILITY:
            return {
                ...state,
                midiAvailable: payload
            };

        default:
            return state;
    }
};

const reducer = (state, action = {}) => {
    return {
        ...rootReducer(state, action),
        status: statusReducer(state.status, action),
        devices: devicesReducer(state.devices, action),
        audio: audioReducer(state.audio, action),
        midi: midiReducer(state.midi, action)
    };
};


function Hardbeet () {
    const [state, dispatch] = useReducer(reducer, initialState);
    const log = (text) => dispatch({type: STATUS_ACTION.LOG, payload: {text, timestamp: new Date()}});

    useEffect(() => {
        log("testing if bluetooth is available");

        if (!navigator.bluetooth || typeof navigator.bluetooth.getAvailability !== "function") {
            dispatch({type: ACTION.BT_AVAILABILITY, payload: false});
        } else {
            navigator.bluetooth.addEventListener("advertisementreceived", event => {
                log("bluetooth advertisement received: " + event);
            });
            navigator.bluetooth.addEventListener("availabilitychanged", event => {
                log("bluetooth availability changed: " + event);
            });

            navigator.bluetooth.getAvailability().then(
                isAvailable => dispatch({type: ACTION.BT_AVAILABILITY, payload: isAvailable}),
                rejection => log("bluetooth is not available" + (rejection ? (": " + rejection) : ""))
            );
        }

        log("testing if MIDI is available");
        dispatch({type: ACTION.MIDI_AVAILABILITY, payload: !!navigator.requestMIDIAccess});
    }, []);


    useEffect(() => {
        dispatch({type: ACTION.TEST_1});
        if (state.interactive) {
            log("interactive!");
        }
        dispatch({type: ACTION.TEST_2});
    }, [state.interactive]);

    useEffect(() => {
        if (state.bluetoothAvailable !== null) {
            log(`bluetooth is ${state.bluetoothAvailable ? "" : "not "}available`);

        }
    }, [state.bluetoothAvailable]);

    useEffect(() => {
        if (state.midiAvailable !== null) {
            if (state.midiAvailable) {
                log("MIDI is available.");
            } else {
                log("MIDI is not available");
            }
        }
    }, [state.midiAvailable]);

    const firstClickHandler = () => {
        if (!state.interactive) {
            dispatch({type: ACTION.SET_INTERACTIVE});
        }
    };

    const {
        devices,
        status,
        interactive,
        bluetoothAvailable,
        midiAvailable
    } = state;

    return html`
        <main onClick=${firstClickHandler}>
            <${Status} messages=${status}/>
            ${devices.map(({device}) => html`<p>${device.name}, ${device.type}</p>`)}
            <${Sensors} bluetoothAvailable=${bluetoothAvailable} bluetooth=${navigator.bluetooth} devices=${devices} dispatch=${dispatch} functions=${this.dataFunctions} />
            ${midiAvailable ? html`<${Midi} dispatch=${dispatch} state=${state.midi} />` : null}
            ${interactive ? html`<${AudioOutput} dispatch=${dispatch} state=${state.audio}/>` : null}
        </main>
    `;
}

/*

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

callbackFunctions.ecg.push(audioOutput.addModulationData);
callbackFunctions.ecg.push(midi.addModulationData);
*/


render(html`<${Hardbeet} />`, document.body);
