import "preact/debug";
import {render, createContext} from "preact";
import {useReducer, useEffect, useContext} from "preact/hooks";
import {html} from "htm/preact";

import {Log} from "./log/log.js";
import {Midi} from "./midi/midi.js";

import {getState} from "./state.js";
import {getHandlers} from "./handlers.js";

/*
import Sensors, {
    reducer as devicesReducer,
    initialState as devicesInitialState
} from "./bluetooth/sensor/sensors.js";



import AudioOutput, {
    reducer as audioReducer,
    ACTION as AUDIO_ACTION,
    initialState as audioInitialState
} from "./audio/output.js";
*/
const AppStateContext = createContext();
const AppHandlersContext = createContext();

const appState = getState();
const appHandlers = getHandlers(appState);

/*
const initialState = {
    devices: devicesInitialState,
    status: statusInitialState,
    audio: audioInitialState,
    midi: midiInitialState,
    bluetoothAvailable: null,
    midiAvailable: null,
    interactive: false
};

const rootReducer = (state, action = {}) => {
    const {type, payload = {}} = action;
    const {audioContext = false} = payload;

    switch (type) {
        case ACTION.SET_INTERACTIVE:
            return {
                ...state,
                audioContext,
                interactive: true
            };
    }
};

const reducer = (state, action = {}) => {
    return {
        ...rootReducer(state, action),
        devices: devicesReducer(state.devices, action),
        audio: audioReducer(state.audio, action),
        midi: midiReducer(state.midi, action)
    };
};
*/

const Hardbeet = () => {
    const handlers = useContext(AppHandlersContext);
    const state = useContext(AppStateContext);

    const {
        setInteractive,
        log: {
            log
        },
        bluetooth: {
            setAvailable: setBTAvailable
        },
        midi: {
            setAvailable: setMidiAvailable
        }
    } = handlers;

    useEffect(() => {
        log("testing if bluetooth is available");

        if (!navigator.bluetooth || typeof navigator.bluetooth.getAvailability !== "function") {
            setBTAvailable(false);
        } else {
            navigator.bluetooth.addEventListener("advertisementreceived", event => {
                log("bluetooth advertisement received: " + event);
            });
            navigator.bluetooth.addEventListener("availabilitychanged", event => {
                log("bluetooth availability changed: " + event);
            });

            navigator.bluetooth.getAvailability().then(
                isAvailable => setBTAvailable(isAvailable),
                rejection => log("bluetooth is not available" + (rejection ? (": " + rejection) : ""))
            );
        }

        log("testing if MIDI is available");
        setMidiAvailable(!!navigator.requestMIDIAccess);

        return () => {
            navigator.bluetooth.removeEventListener("advertisementreceived");
            navigator.bluetooth.removeEventListener("availabilitychanged");
        };
    }, []);

    useEffect(() => {
        if (state.bluetooth.available.value !== null) {
            log(`bluetooth is ${state.bluetooth.available.value ? "" : "not "}available`);

        }
    }, [state.bluetooth.available.value]);


    useEffect(() => {
        if (state.midi.available.value !== null) {
            if (state.midi.available.value) {
                log("MIDI is available.");
            } else {
                log("MIDI is not available");
            }
        }
    }, [state.midi.available.value]);

    useEffect(() => {
        if (state.interactive.value) {
            log("interactive!");
        }
    }, [state.interactive.value]);

    const firstClickHandler = () => {
        if (!state.interactive.value) {
            setInteractive(true);
        }
    };


    return html`
        <main onClick=${firstClickHandler}>
            <${Log} entries=${state.log.entries} title=${state.log.title} />
            <${Midi} state=${state.midi} />
        </main>
    `;
};



/*

                    ${devices.map(({device}) => html`<p>${device.name}, ${device.type}</p>`)}
                    <${Sensors} bluetoothAvailable=${bluetoothAvailable} bluetooth=${navigator.bluetooth} devices=${devices} dispatch=${dispatch} functions=${this.dataFunctions} />
                    ${interactive ? html`<${AudioOutput} dispatch=${dispatch} state=${state.audio}/>` : null}



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


render(
    html`
        <${AppStateContext.Provider} value=${appState}>
            <${AppHandlersContext.Provider} value=${appHandlers}>
                <${Hardbeet} />
            <//>
        <//>
    `,
    document.body
);


export {
    AppHandlersContext,
    AppStateContext
};
