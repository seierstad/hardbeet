import {signal} from "@preact/signals";

import {DEFAULT} from "./defaults.js";


const getInitialState = (state = {}) => {
    const {
        staticTempo = DEFAULT.STATIC_TEMPO,
        source = DEFAULT.SOURCE,
        running = DEFAULT.RUNNING,
        numerator = DEFAULT.FRACTION.NUMERATOR,
        denominator = DEFAULT.FRACTION.DENOMINATOR
    } = state;

    return {
        staticTempo: signal(),
        source: signal(source),
        running: signal(running),
        fraction: {
            numerator: signal(numerator),
            denominator: signal(denominator)
        }
    };
};


export {
    getInitialState
};
