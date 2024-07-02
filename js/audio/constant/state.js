import {signal} from "@preact/signals";

import {DEFAULT} from "./defaults.js";


const getState = (initialValues = {}) => {
    const {
        toggle = DEFAULT.TOGGLE,
    } = initialValues;


    return {
        toggle: signal(toggle)
    };
};


export {
    getState
};
