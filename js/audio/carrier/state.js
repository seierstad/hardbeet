import {signal} from "@preact/signals";

import {DEFAULT} from "./defaults.js";


const getState = (initialValues = {}) => {
    const {
        toggle = DEFAULT.TOGGLE,
        frequency = DEFAULT.FREQUENCY
    } = initialValues;


    return {
        toggle: signal(toggle),
        frequency: signal(frequency)
    };
};


export {
    getState
};
