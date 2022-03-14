"use strict";
import {MESSAGE_TYPE} from "./midi-constants.js";
import MidiPort from "./midi-port.js";

function MidiInput (props) {
    return MidiPort(props);
}

export default MidiInput;
