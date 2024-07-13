import {signal} from "@preact/signals";

import {getState as getCharacteristicsState} from "../characteristic/state.js";
import {getServiceSpecificState} from "./service-specific.js";


const getServiceState = (service = {}) => {
    const {characteristics = []} = service;
    return {
        object: service,
        uuid: service.uuid,
        id: service.uuid,
        isPrimary: service.isPrimary,
        characteristics: getCharacteristicsState(characteristics),
        ...getServiceSpecificState(service.uuid)
    };
};

const getState = (initialValues = []) => signal(initialValues.map(service => getServiceState(service)));


export {
    getState,
    getServiceState
};
