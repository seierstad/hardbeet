import {signal} from "@preact/signals";

import {DEFAULT} from "./defaults.js";
import {getState as getCarrierState} from "./carrier/state.js";
import {getState as getConstantState} from "./constant/state.js";
import {getState as getNoiseState} from "./noise/state.js";


const getState = (initialValues = {}) => {
    const {
        available = DEFAULT.AVAILABLE,
        noise = {},
        carrier = {},
        constant = {}
    } = initialValues;

    return {
        available: signal(available),
        carrier: getCarrierState(carrier),
        constant: getConstantState(constant),
        noise: getNoiseState(noise)
    };
};


export {
    getState
};
