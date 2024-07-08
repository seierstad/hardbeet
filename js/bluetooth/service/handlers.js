import {indexById} from "hardbeet/handlers";

import {getServiceSpecificHandlers} from "./service-specific.js";
import {getState, getServiceState} from "./state.js";


const addService = (services = [], service) => {
    const index = indexById(services, service.id);
    if (index !== -1) {
        return services;
    }

    return [...services, getServiceState(service)];
};

const removeService = (services = [], serviceId) => {
    const index = indexById(services, serviceId);
    if (index === -1) {
        return services;
    }

    return [...services.slice(0, index), ...services.slice(index + 1)];
};


const getServiceHandlers = (services = [], service) => {
    const index = indexById(services, service.uuid);
    if (index === -1) {
        throw new Error(`no service with id=${serviceId}`);
    }

    const state = services[index];
    return {
        addCharacteristic: service => state.services.value = addService(state.services.value, service),
        ...getServiceSpecificHandlers(state)
    };
};

const getHandlers = (state = getState()) => ({
    addService: service => state.value = addService(state.value, service),
    removeService: serviceId => state.value = removeService(state.value, serviceId),
    getServiceHandlers: service => getServiceHandlers(state.value, service)
});


export {
    addService,
    getHandlers,
};
