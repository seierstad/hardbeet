import {signal} from "@preact/signals";

import {DEFAULT} from "./defaults.js";


const getFeatureInitialState = (initialValues = {}) => {
    const {
        status = DEFAULT.STATUS
    } = initialValues;
    /*
    code: 0, 1, 2, 3, 5, 6
    supported: true
    parameters: {},
    */

    return {
        status: signal(status)
    };
};

const getState = (initialValues = []) => signal(initialValues.map(getFeatureInitialState));


export {
    getState
};
