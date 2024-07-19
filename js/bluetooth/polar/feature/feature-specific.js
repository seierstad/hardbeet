import {MEASUREMENT_TYPE} from "../constants.js";


const SPECIFICS = {
    [MEASUREMENT_TYPE.ECG]: {},
    [MEASUREMENT_TYPE.ACCELERATION]: {}
};

const getFeatureSpecificState = featureCode => {
    const {[featureCode]: state = {
        addTotalMagnitude: false
    }} = SPECIFICS;
    return state;
};

const getFeatureSpecificHandlers = (state = {}) => {
    const {code} = state;
    const {[code]: handlers = {}} = SPECIFICS;
    return handlers;
};


export {
    getFeatureSpecificHandlers,
    getFeatureSpecificState
};
