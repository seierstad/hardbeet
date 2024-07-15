import {signal} from "@preact/signals";

import {DEFAULT} from "./defaults.js";


const getInitialFeatureState = (initialValues = {}) => {
    const {
        code,
        status = DEFAULT.STATUS,
        parameters = [],
        data = {}
    } = initialValues;

    return {
        code,
        status: signal(status),
        parameters,
        activeStreamProperties: signal([]),
        data: signal(data)
    };
};

const getState = () => signal({});


export {
    getState,
    getInitialFeatureState
};
