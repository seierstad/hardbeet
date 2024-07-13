import {signal} from "@preact/signals";

const getState = (initialValues = {}) => {
    const {features = []} = initialValues;
    return {
        features: signal([])
    };
};


export {
    getState
};
