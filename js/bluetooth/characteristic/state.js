import {signal} from "@preact/signals";

import {getState as getDescriptorsState} from "./descriptor/state.js";

import {getCharacteristicSpecificState} from "./characteristic-specific.js";


const getInitialCharacteristicState = (characteristic = {}) => {
    const {
        uuid,
        descriptors = []
    } = characteristic;
    const specificState = getCharacteristicSpecificState(uuid);

    console.log({uuid});
    return {
        id: uuid,
        uuid,
        descriptors: getDescriptorsState(descriptors),
        object: characteristic,
        ...specificState(characteristic)
    };
};

const getState = (initialValues = []) => signal(initialValues.map(characteristic => getInitialCharacteristicState(characteristic)));


export {
    getState,
    getInitialCharacteristicState
};
