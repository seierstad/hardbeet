import {getState as getFeaturesState} from "./feature/state.js";


const getState = (initialValues = {}) => {
    const {features = []} = initialValues;

    return {
        features: getFeaturesState(features)
    };
};


export {
    getState
};
