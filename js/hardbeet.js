import "preact/debug";
import {render, createContext} from "preact";
import {useEffect, useContext} from "preact/hooks";
import {html} from "htm/preact";

import {Log} from "./log/log.js";
import {MidiAccessProvider} from "./midi/context.js";
import {Midi} from "./midi/midi.js";
import {Bluetooth} from "./bluetooth/bluetooth.js";

import {getState} from "./state.js";
import {getHandlers} from "./handlers.js";

import {AudioOutput} from "./audio/output.js";


const AppStateContext = createContext();
const AppHandlersContext = createContext();

const appState = getState();
const appHandlers = getHandlers(appState);


const Hardbeet = () => {
    const handlers = useContext(AppHandlersContext);
    const state = useContext(AppStateContext);

    const {
        setInteractive,
        log: {
            log
        }
    } = handlers;

    const firstClickHandler = () => {
        if (!state.interactive.value) {
            setInteractive(true);
        }
    };

    useEffect(() => {
        document.addEventListener("click", firstClickHandler);
        document.addEventListener("pointer", firstClickHandler);
    }, []);

    useEffect(() => {
        if (state.interactive.value) {
            log("interactive!");
            document.removeEventListener("click", firstClickHandler);
            document.removeEventListener("pointer", firstClickHandler);
        }
    }, [state.interactive.value]);

    return html`
        <main>
            <${Log} entries=${state.log.entries} title=${state.log.title} />
            <${Bluetooth} />
            <${Midi} state=${state.midi} />
            ${state.interactive.value ? html`<${AudioOutput} state=${state.audio}/>` : null}
        </main>
    `;
};


/*

                    ${devices.map(({device}) => html`<p>${device.name}, ${device.type}</p>`)}
                    <${Sensors} bluetoothAvailable=${bluetoothAvailable} bluetooth=${navigator.bluetooth} devices=${devices} dispatch=${dispatch} functions=${this.dataFunctions} />


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
                <${MidiAccessProvider}>
                    <${Hardbeet} />
                <//>
            <//>
        <//>
    `,
    document.body
);


export {
    AppHandlersContext,
    AppStateContext
};
