import {batch} from "@preact/signals";

import {indexById} from "hardbeet/handlers";

import {getHandlers as getDescriptorsHandlers} from "./descriptor/handlers.js";
import {getCharacteristicSpecificHandlers} from "./characteristic-specific.js";
import {getInitialCharacteristicState} from "./state.js";


const addCharacteristic = (characteristics = [], characteristic) => {
    const index = indexById(characteristics, characteristic.uuid);
    if (index !== -1) {
        return characteristics;
    }
    const newState = getInitialCharacteristicState(characteristic);

    const result = [...characteristics, newState];
    return result;
};

const removeCharacteristic = (characteristics = [], characteristicId) => {
    const index = indexById(characteristics, characteristicId);
    if (index === -1) {
        return characteristics;
    }

    return [...characteristics.slice(0, index), ...characteristics.slice(index + 1)];
};

const getCharacteristicHandlers = (characteristics = [], characteristic = {}) => {
    const {uuid} = characteristic;
    const index = indexById(characteristics, uuid);
    if (index === -1) {
        throw new Error(`no characteristic with id=${uuid}`);
    }

    const state = characteristics[index];
    return {
        ...getDescriptorsHandlers(state.descriptors),
        ...getCharacteristicSpecificHandlers(characteristic)
    };
};

const getHandlers = (state = {value: []}) => {
    return {
        addCharacteristic: characteristic => state.value = addCharacteristic(state.value, characteristic),
        addCharacteristics: (characteristics = []) => state.value = characteristics.reduce((acc, c) => addCharacteristic(acc, c), state.value),
        removeCharacteristic: characteristicId => state.value = removeCharacteristic(state.value, characteristicId),
        getCharacteristicHandlers: characteristic => getCharacteristicHandlers(state.value, characteristic)
    };
};


export {
    getHandlers,
    getCharacteristicHandlers
};
