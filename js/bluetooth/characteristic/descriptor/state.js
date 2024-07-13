import {signal} from "@preact/signals";


const getInitialDescriptorState = (descriptor = {}) => {
    const {uuid} = descriptor;
    //const specificState = getDescriptorSpecificState(uuid);

    return {
        id: uuid,
        object: descriptor
    };
};

const getState = (initialValues = []) => signal(initialValues.map(descriptor => getInitialDescriptorState(descriptor)));


export {
    getState,
    getInitialDescriptorState
};
