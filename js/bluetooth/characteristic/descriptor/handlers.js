import {indexById} from "hardbeet/handlers";

import {getInitialDescriptorState} from "./state.js";


const addDescriptor = (descriptors = [], descriptor) => {
    const index = indexById(descriptors, descriptor.uuid);
    if (index !== -1) {
        return descriptors;
    }
    const newState = getInitialDescriptorState(descriptor);

    const result = [...descriptors, newState];
    return result;
};

const removeDescriptor = (descriptors = [], descriptorId) => {
    const index = indexById(descriptors, descriptorId);
    if (index === -1) {
        return descriptors;
    }

    return [...descriptors.slice(0, index), ...descriptors.slice(index + 1)];
};

const getDescriptorHandlers = (descriptors = [], descriptor = {}) => {
    const {uuid} = descriptor;
    const index = indexById(descriptors, uuid);
    if (index === -1) {
        throw new Error(`no descriptor with id=${uuid}`);
    }

    const state = descriptors[index];
    return {
        setValue: value => state.value.value = value
    };
};

const getHandlers = (state = {value: []}) => {
    return {
        addDescriptor: descriptor => state.value = addDescriptor(state.value, descriptor),
        addDescriptors: (descriptors = []) => state.value = descriptors.reduce((acc, d) => addDescriptor(acc, d), state.value),
        removeDescriptor: descriptorId => state.value = removeDescriptor(state.value, descriptorId),
        getDescriptorHandlers: descriptor => getDescriptorHandlers(state.value, descriptor)
    };
};


export {
    getHandlers,
    getDescriptorHandlers
};
