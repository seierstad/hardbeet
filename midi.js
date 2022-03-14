"use strict";
import {html, useState, useEffect} from "./preact-standalone.module.min.js";
import {ACTION as STATUS_ACTION} from "./status.js";

import MidiInput from "./midi-input.js";
import MidiOutput from "./midi-output.js";

const initialState = {
    inputs: [],
    outputs: []
};

const ACTION = {
    ADD_INPUT_PORT: Symbol("ADD_INPUT_PORT"),
    ADD_OUTPUT_PORT: Symbol("ADD_OUTPUT_PORT")
};

const reducer = (state, action = {}) => {
    const {type, payload} = action;

    switch (type) {
        case ACTION.ADD_INPUT_PORT:
            return {
                ...state,
                inputs: [
                    ...state.inputs,
                    payload
                ]
            };
    }

    return state;
};


function Midi (props) {
    const {state, dispatch} = props;
    const [accessRequested, setAccessRequested] = useState(false);
    const [access, setAccess] = useState(null);
    const [accessError, setAccessError] = useState(null);

    useEffect(() => {
        if (accessRequested) {
            navigator.requestMIDIAccess({"sysex": true}).then(setAccess, setAccessError);
            dispatch({type: STATUS_ACTION.LOG, payload: {text: "Requesting MIDI access", timestamp: new Date()}});
        }
    }, [accessRequested]);

    useEffect(() => {
        if (accessError !== null) {
            dispatch({
                type: STATUS_ACTION.ERROR,
                payload: {
                    text: `MIDI access error: ${accessError.name} - ${accessError.message} (code ${accessError.code})`,
                    timestamp: new Date()
                }
            });
            setAccessRequested(false);
        }
    }, [accessError]);

    const accessStateChangeHandler = (event) => {
        console.log({midi_statechange: event});
    };

    useEffect(() => {
        if (access !== null) {
            dispatch({type: STATUS_ACTION.LOG, payload: {text: "MIDI access granted!", timestamp: new Date()}});
            access.addEventListener("statechange", accessStateChangeHandler);

            const outputIterator = access.outputs.entries();
            for (let [id, port] of outputIterator) {
                dispatch({type: ACTION.ADD_OUTPUT_PORT, payload: {id, name: port.name}});
            }

            const inputIterator = access.inputs.entries();
            for (let [id, port] of inputIterator) {
                dispatch({type: ACTION.ADD_INPUT_PORT, payload: {id, name: port.name}});
            }
            return () => {
                access.removeEventListener("statechange", accessStateChangeHandler);
            };
        }
    }, [access]);

    this._samplerate = null;
    this.samplerateChanged = false;
    this.buffer = [];
    this.interval = null;

    return html`
        <section id="midi">
            <header><h2>MIDI</h2></header>
            ${state.inputs.map(port => html`<span>${port.id} - ${port.name}</span>`)}
            ${access ? html`
                <fieldset>
                    <legend>inputs</legend>
                    ${Array.from(access.inputs).map(([id, port]) => html`<${MidiInput} port=${port} key=${id}/>`)}
                </fieldset>
                <fieldset>
                    <legend>outputs</legend>
                    ${Array.from(access.outputs).map(([id, port]) => html`<${MidiOutput} port=${port} key=${id}/>`)}
                </fieldset>
            ` : html`
                <button disabled=${accessRequested} onClick=${() => setAccessRequested(true)}>${accessError ? "try again" : "connect midi"}</button>
            `}
        </section>
    `;

}


export default Midi;

export {
    initialState,
    ACTION,
    reducer
};
