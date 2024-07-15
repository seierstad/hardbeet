import {indexById} from "hardbeet/handlers";

import {getHandlers as getCharacteristicsHandlers} from "../characteristic/handlers.js";

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
        throw new Error(`no service with id=${service.uuid}`);
    }

    const state = services[index];
    return {
        ...getCharacteristicsHandlers(state.characteristics),
        ...getServiceSpecificHandlers(state)
    };
};

const getHandlers = (state = getState()) => ({
    addService: service => state.value = addService(state.value, service),
    addServices: (services = []) => state.value = services.reduce((acc, service) => addService(acc, service), state.value),
    removeService: serviceId => state.value = removeService(state.value, serviceId),
    getServiceHandlers: service => getServiceHandlers(state.value, service)
});


export {
    addService,
    getHandlers
};
