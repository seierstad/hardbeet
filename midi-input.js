"use strict";
import {MESSAGE_TYPE} from "./midi-constants.js";
import MidiPort from "./midi-port.js";

const initialState = {};

const ACTION = {
    MIDI_INPUT_ADD_PORT: Symbol("MIDI_INPUT_ADD_PORT")
};

const reducer = (state, action = {}) => {
    return state;
};

function MidiInput (props) {
    return MidiPort(props);
}

export default MidiInput;


export {
    initialState,
    ACTION,
    reducer
};
