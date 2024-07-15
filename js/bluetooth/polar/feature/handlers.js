import {MEASUREMENT_STATUS} from "./constants.js";
import {getFeatureSpecificHandlers} from "./feature-specific.js";
import {getState, getInitialFeatureState} from "./state.js";


const addFeature = (features = {}, feature) => {
    const {[feature.code]: state = null} = features;
    if (state !== null) {
        return features;
    }

    return ({...features, [feature.code]: getInitialFeatureState(feature)});
};

const removeFeature = (features = {}, featureCode) => {
    const {[featureCode]: state = null, ...rest} = features;
    return (state === null) ? features : {...rest};
};

const getFeatureHandlers = (features = {}, feature) => {
    const {[feature.code]: state = null} = features;
    if (state === null) {
        throw new Error(`no feature with code=${feature.code}`);
    }

    return {
        setActiveStreamProperties: properties => state.activeStreamProperties.value = properties,
        ...getFeatureSpecificHandlers(state)
    };
};

const startMeasurement = (features = {}, featureCode) => {
    const {[featureCode]: feature = null, ...rest} = features;
    if (feature === null) {
        return features;
    }
    feature.status.value = MEASUREMENT_STATUS.STARTED;

    return {
        ...rest,
        [featureCode]: feature
    };
};

const stopMeasurement = (features = {}, featureCode) => {
    const {[featureCode]: feature = null, ...rest} = features;
    if (feature === null) {
        return features;
    }
    feature.status.value = MEASUREMENT_STATUS.STOPPED;
    feature.activeStreamProperties.value = [];

    return {
        ...rest,
        [featureCode]: feature
    };
};

const setFeatureData = (features = {}, featureCode, data) => {
    const {[featureCode]: feature = null, ...rest} = features;
    if (feature === null) {
        return features;
    }
    feature.data.value = data;

    return {
        ...rest,
        [featureCode]: feature
    };
};


const getHandlers = (state = getState()) => {
    return {
        addFeature: feature => state.value = addFeature(state.value, feature),
        addFeatures: (features = []) => state.value = features.reduce((acc, c) => addFeature(acc, c), state.value),
        removeFeature: featureId => state.value = removeFeature(state.value, featureId),
        getFeatureHandlers: feature => getFeatureHandlers(state.value, feature),
        startMeasurement: featureCode => state.value = startMeasurement(state.value, featureCode),
        stopMeasurement: featureCode => state.value = stopMeasurement(state.value, featureCode),
        setFeatureData: (featureCode, data) => state.value = setFeatureData(state.value, featureCode, data)
    };
};


export {
    getHandlers
};
