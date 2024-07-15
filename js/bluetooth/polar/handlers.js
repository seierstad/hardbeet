import {getHandlers as getFeatureHandlers} from "./feature/handlers.js";

const getHandlers = (state = {}) => {
    const {features = []} = state;
    return {
        setControlPointCharacteristic: controlPoint => state.controlPointCharacteristic.value = controlPoint,
        setDataCharacteristic: data => state.dataCharacteristic.value = data,
        ...getFeatureHandlers(features)
    };
};


export {
    getHandlers
};
