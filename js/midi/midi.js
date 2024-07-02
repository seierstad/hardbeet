import {useEffect, useLayoutEffect, useState, useContext, useRef} from "preact/hooks";
import {html} from "htm/preact";

import {AppStateContext} from "../hardbeet.js";
import {AppHandlersContext} from "../hardbeet.js";

import {portString} from "./port.js";
import {MidiInput} from "./input.js";
import {MidiOutput} from "./output.js";


const sameId = (arr, id) => arr.find(element => element.id === id);

const Midi = props => {
    const {midi: state} = useContext(AppStateContext);
    const {midi: handler, log: {log, logError}} = useContext(AppHandlersContext);
    const [accessRequested, setAccessRequested] = useState(false);
    const [access, setAccess] = useState(null);
    const [accessError, setAccessError] = useState(null);

    const firstRender = useRef(true);

    useLayoutEffect(() => {
        log("testing if MIDI is available");
        handler.setAvailable(!!navigator.requestMIDIAccess);
    }, [firstRender]);

    useEffect(() => {
        if (state.available.value !== null) {
            if (state.available.value) {
                log("MIDI is available.");
            } else {
                log("MIDI is not available");
            }
        }
    }, [state.available.value]);

    useEffect(() => {
        if (state.available.value && accessRequested) {
            navigator.requestMIDIAccess({"sysex": true}).then(setAccess, setAccessError);
            log("Requesting MIDI access");
        }
    }, [accessRequested]);

    useEffect(() => {
        if (accessError !== null) {
            logError(`MIDI access error: ${accessError.name} - ${accessError.message} (code ${accessError.code})`);
            setAccessRequested(false);
        }
    }, [accessError]);

    const accessStateChangeHandler = event => {
        if (event.port.state === "connected") {
            if (event.port.type === "input") {
                handler.addInputPort(event.port);
            } else {
                handler.addOutputPort(event.port);
            }
        } else {
            log(`${portString(event.port)} disconnected`);
            if (event.port.type === "input") {
                handler.removeInputPort(event.port);
            } else {
                handler.removeOutputPort(event.port);
            }
        }
    };

    useEffect(() => {
        if (access !== null) {
            log("MIDI access granted!");


            const inputIterator = access.inputs.entries();
            for (let [id, port] of inputIterator) {
                handler.addInputPort(port);
            }
            log(`connected ${access.inputs.size} MIDI input ports`);

            const outputIterator = access.outputs.entries();
            for (let [id, port] of outputIterator) {
                handler.addOutputPort(port);
            }
            log(`connected ${access.outputs.size} MIDI output ports`);

            access.addEventListener("statechange", accessStateChangeHandler);

            return () => {
                access.removeEventListener("statechange", accessStateChangeHandler);
            };
        }
    }, [access]);


    return html`
        <section id="midi">
            <header><h2>MIDI</h2></header>
            ${state.inputs.map(port => html`<span>${port.id} - ${port.name}</span>`)}
            ${access !== null ? html`
                <fieldset>
                    <legend>inputs</legend>
                    ${state.inputCount.value > 0 ?
                        Array.from(access.inputs).map(([id, port]) =>
                            html`<${MidiInput} port=${port} key=${id} handlers=${handler} state=${sameId(state.inputs, id)} />`)
                        : "no inputs"
                    }
                </fieldset>
                <fieldset>
                    <legend>outputs</legend>
                    ${state.outputCount.value > 0 ?
                        Array.from(access.outputs).map(([id, port]) =>
                            html`<${MidiOutput} port=${port} key=${id} handlers=${handler} state=${sameId(state.outputs, id)} />`)
                        : "no outputs"
                    }
                </fieldset>
            ` : html`
                <button disabled=${accessRequested} onClick=${() => setAccessRequested(true)}>${accessError ? "try again" : "connect midi"}</button>
            `}
        </section>
    `;

};


export {
    Midi
};
