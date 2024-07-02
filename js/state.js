import {signal} from "@preact/signals";

import {getState as getLogState} from "./log/state.js";
import {getState as getBluetoothState} from "./bluetooth/state.js";
import {getState as getMidiState} from "./midi/state.js";


const getState = (initialState = {}) => {
    const {
        audio = {},
        midi = {},
        bluetooth = {},
        log = {}
    } = initialState;

    return {
        log: getLogState(log),
        bluetooth: getBluetoothState(bluetooth),
        midi: getMidiState(midi),
        interactive: signal(false)
    };
};


export {
    getState
};
