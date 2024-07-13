const getHandlers = (state = {}) => {
    return {
        setControlPointCharacteristic: controlPoint => state.controlPointCharacteristic.value = controlPoint,
        setDataCharacteristic: data => state.dataCharacteristic.value = data
    };
};


export {
    getHandlers
};


/*
const ACTION = {
    ...FEATURE_ACTION,
    POLAR_FEATURES_SUPPORTED: Symbol("POLAR_FEATURES_SUPPORTED")
};

const reducer = (state = initialState, action = {}) => {
    const {type, payload = {}} = action;
    const {measurementCode} = payload;
    const {features = []} = state;
    const featureIndex = features.findIndex(feature => feature.code === measurementCode);

    switch (type) {
        case ACTION.POLAR_FEATURES_SUPPORTED:
            return {
                ...state,
                features: [
                    ...features,
                    ...payload.featureSupport.filter(feature => feature.supported)
                ]
            };
    }

    if (Object.values(FEATURE_ACTION).indexOf(type) !== -1 && featureIndex !== -1) {
        return {
            ...state,
            features: [
                ...state.features.slice(0, featureIndex),
                featureReducer(state.features[featureIndex], action),
                ...state.features.slice(featureIndex + 1)
            ]
        };
    }

    return state;
};


*/

