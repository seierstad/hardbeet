import {signal} from "@preact/signals";

import {getServiceSpecificState} from "./service-specific.js";


const getServiceState = (service = {}) => ({
    object: service,
    uuid: service.uuid,
    id: service.uuid,
    isPrimary: service.isPrimary,
    characteristics: signal([]),
    features: signal([]),
    ...getServiceSpecificState(service.uuid)
});

const getState = (initialValues = []) => signal(initialValues.map(service => getInitialServiceState(service)));


export {
    getState,
    getServiceState
};
