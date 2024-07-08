import {signal} from "@preact/signals";

import {getState as getDevicesState} from "./device/state.js";
import {DEFAULT} from "./defaults.js";


const getState = (initialState = {}) => {
    const {
        available = DEFAULT.AVAILABLE,
        devices = []
    } = initialState;

    return {
        available: signal(available),
        devices: getDevicesState(devices)
    };
};


export {
    getState
};
