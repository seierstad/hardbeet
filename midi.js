"use strict";
import {html, useState, useEffect} from "./preact-standalone.module.min.js";
import {ACTION as STATUS_ACTION} from "./status.js";

import MidiInput, {initialState as inputInitialState, ACTION as MIDI_INPUT_ACTION, reducer as midiInputReducer} from "./midi-input.js";
import MidiOutput, {initialState as outputInitialState, ACTION as MIDI_OUTPUT_ACTION, reducer as midiOutputReducer} from "./midi-output.js";

const initialState = {
    inputs: [],
    outputs: []
};

const ACTION = {
    MIDI_OUTPUTS_ADD_PORT: Symbol("MIDI_OUTPUTS_ADD_PORT"),
    MIDI_INPUTS_ADD_PORT: Symbol("MIDI_INPUTS_ADD_PORT"),
    ...MIDI_INPUT_ACTION,
    ...MIDI_OUTPUT_ACTION
};

const reducer = (state, action = {}) => {
    const {type, payload = {}} = action;
    const {id = null} = payload;

    if (Object.values(ACTION).indexOf(action.type) === -1) {
        return state;
    }

    switch (type) {
        case ACTION.MIDI_INPUTS_ADD_PORT:
            return {
                ...state,
                inputs: [
                    ...state.inputs,
                    payload
                ]
            };

        case ACTION.MIDI_OUTPUTS_ADD_PORT:
            return {
                ...state,
                outputs: [
                    ...state.outputs,
                    payload
                ]
            };
    }

    if (Object.values(MIDI_INPUT_ACTION).indexOf(action.type) !== -1) {
        const index = state.inputs.findIndex(port => port.id === id);
        if (index === -1) {
            return state;
        }

        return {
            ...state,
            inputs: [
                ...state.inputs.slice(0, index),
                midiInputReducer(state.inputs[index], action),
                ...state.inputs.slice(index + 1)
            ]
        };
    }

    if (Object.values(MIDI_OUTPUT_ACTION).indexOf(action.type) === -1) {
        const index = state.outputs.findIndex(port => port.id === id);
        if (index === -1) {
            return state;
        }

        return {
            ...state,
            outputs: [
                ...state.outputs.slice(0, index),
                midiOutputReducer(state.outputs[index], action),
                ...state.outputs.slice(index + 1)
            ]
        };
    }


    return state;
};

const sameId = (arr, id) => arr.find(element => element.id === id);


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
                dispatch({type: ACTION.MIDI_OUTPUTS_ADD_PORT, payload: {...outputInitialState, id, name: port.name}});
            }

            const inputIterator = access.inputs.entries();
            for (let [id, port] of inputIterator) {
                dispatch({type: ACTION.MIDI_INPUTS_ADD_PORT, payload: {...inputInitialState, id, name: port.name}});
            }
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
                    ${Array.from(access.inputs).map(([id, port]) => html`<${MidiInput} port=${port} key=${id} state=${sameId(state.inputs, id)} dispatch=${dispatch} />`)}
                </fieldset>
                <fieldset>
                    <legend>outputs</legend>
                    ${Array.from(access.outputs).map(([id, port]) => html`<${MidiOutput} port=${port} key=${id} state=${sameId(state.outputs, id)} dispatch=${dispatch} />`)}
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
