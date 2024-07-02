import {getState} from "./state.js";

import {getHandlers as getCarrierHandlers} from "./carrier/handlers.js";
import {getHandlers as getConstantHandlers} from "./constant/handlers.js";
import {getHandlers as getNoiseHandlers} from "./noise/handlers.js";


const getHandlers = (state = getState()) => {
    const {
        carrier: carrierState = {},
        constant: constantState = {},
        noise: noiseState = {}
    } = state;

    return {
        available: value => state.available.value = !!value,
        carrier: getCarrierHandlers(carrierState),
        constant: getConstantHandlers(constantState),
        noise: getNoiseHandlers(noiseState)
    };
};


export {
    getHandlers
};
