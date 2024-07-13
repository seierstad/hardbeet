import {createContext} from "preact";
import {useState, useContext, useRef, useEffect, useLayoutEffect} from "preact/hooks";
import {html} from "htm/preact";

import {AppHandlersContext} from "../hardbeet.js";
import {MidiSoftwareConnectionEvent} from "./software-ports.js";
import {portString} from "./port.js";

const MidiAccessContext = createContext();


const MidiAccessProvider = (props = {}) => {
    const {children = null} = props;

    const {midi: handler, log: {log, logError}} = useContext(AppHandlersContext);

    const [available, setAvailable] = useState(null);
    const [accessRequested, setAccessRequested] = useState(false);
    const [access, setAccess] = useState(null);
    const [accessError, setAccessError] = useState(null);

    const firstRender = useRef(true);

    const inputs = useRef(new Set());
    const outputs = useRef(new Set());

    const addMidiInput = (port) => {
        if (access !== null) {
            access.dispatchEvent(new MidiSoftwareConnectionEvent(port));
        } else {
            inputs.current.add(port);
        }
    };
    const removeMidiInput = (inputId) => console.log(inputId);

    const addMidiOutput = (port) => {
        if (access !== null) {
            access.dispatchEvent(new MidiSoftwareConnectionEvent(port));
        } else {
            outputs.current.add(port);
        }
    };
    const removeMidiOutput = () => {};

    useLayoutEffect(() => {
        log("testing if MIDI is available");
        setAvailable(!!navigator.requestMIDIAccess);
    }, [firstRender]);

    useEffect(() => {
        if (available !== null) {
            if (available) {
                log("MIDI is available.");
            } else {
                log("MIDI is not available");
            }
        }
    }, [available]);

    useEffect(() => {
        if (available && accessRequested) {
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

    const [MidiAccessButton] = useState(html`<button disabled=${accessRequested} onClick=${() => setAccessRequested(true)}>${accessError ? "try again" : "connect midi"}</button>`);


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

    const softwareConnectionHandler = event => {
        accessStateChangeHandler({...event, port: event.detail.port});
    };

    useEffect(() => {
        if (access !== null) {
            log("MIDI access granted!");

            const inputIterator = access.inputs.values();
            for (let port of inputIterator) {
                handler.addInputPort(port);
            }
            for (let port of inputs.current) {
                handler.addInputPort(port);
            }
            log(`connected ${access.inputs.size + inputs.current.size} MIDI input ports`);
            inputs.current.clear();


            const outputIterator = access.outputs.values();
            for (let port of outputIterator) {
                handler.addOutputPort(port);
            }
            for (let port of outputs.current) {
                handler.addOutputPort(port);
            }
            log(`connected ${access.outputs.size + outputs.current.size} MIDI output ports`);
            outputs.current.clear();

            access.addEventListener("statechange", accessStateChangeHandler);
            access.addEventListener("hardbeet_custom_statechange", softwareConnectionHandler);

            return () => {
                access.removeEventListener("statechange", accessStateChangeHandler);
                access.removeEventListener("hardbeet_custom_statechange", softwareConnectionHandler);
            };
        }
    }, [access]);


    return html`
        <${MidiAccessContext.Provider} value=${{access, MidiAccessButton, addMidiInput, addMidiOutput, removeMidiInput, removeMidiOutput}}>
            ${children}
        <//>
    `;
};


export {
    MidiAccessContext,
    MidiAccessProvider
};
