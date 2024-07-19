import {signal} from "@preact/signals";

import {DEFAULT} from "./defaults.js";


const getInitialFeatureState = (initialValues = {}) => {
    const {
        code,
        status = DEFAULT.STATUS,
        sampleZero = DEFAULT.SAMPLE_ZERO,
        parameters = [],
        offsets = [],
        data = null
    } = initialValues;

    return {
        code,
        status: signal(status),
        sampleZero: signal(sampleZero),
        parameters,
        offsets: signal(offsets),
        activeStreamProperties: signal([]),
        data: signal(data)
    };
};

const getState = () => signal({});


export {
    getState,
    getInitialFeatureState
};
