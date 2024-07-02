import {signal} from "@preact/signals";

import {DEFAULT} from "./defaults.js";


const getState = (initialValues = {}) => {
    const {
        toggle = DEFAULT.TOGGLE,
        color = DEFAULT.COLOR
    } = initialValues;


    return {
        toggle: signal(toggle),
        color: signal(color)
    };
};


export {
    getState
};
