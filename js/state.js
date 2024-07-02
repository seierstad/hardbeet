import {signal} from "@preact/signals";

import {getState as getLogState} from "./log/state.js";
import {getState as getBluetoothState} from "./bluetooth/state.js";
import {getState as getMidiState} from "./midi/state.js";
import {getState as getAudioState} from "./audio/state.js";


const getState = (initialState = {}) => {
    const {
        audio = {},
        midi = {},
        bluetooth = {},
        log = {}
    } = initialState;

    return {
        audio: getAudioState(audio),
        log: getLogState(log),
        bluetooth: getBluetoothState(bluetooth),
        midi: getMidiState(midi),
        interactive: signal(false)
    };
};


export {
    getState
};
