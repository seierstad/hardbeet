import {signal} from "@preact/signals";

import {getState as getServicesState} from "../service/state.js";
import {byteArray2Array} from "../parser-functions.js";

const getInitialDeviceState = device => {
    const {services = []} = device;
    return {
        id: device.id,
        name: device.name ? device.name : "",
        object: device,
        services: getServicesState(services)
    };
};

const getState = (initialValues = []) => signal(initialValues.map(device => getInitialDeviceState(device)));


export {
    getState,
    getInitialDeviceState
};
