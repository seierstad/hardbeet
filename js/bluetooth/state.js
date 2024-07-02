import {signal} from "@preact/signals";

import {DEFAULT} from "./defaults.js";


const getState = (initialState = {}) => {
    const {
        available = DEFAULT.AVAILABLE
    } = initialState;

    return {
        available: signal(available)
    };
};


export {
    getState
};
