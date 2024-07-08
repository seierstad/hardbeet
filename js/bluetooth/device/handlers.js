import {batch} from "@preact/signals";
import {getValue, indexById} from "hardbeet/handlers";

import {getHandlers as getServicesHandlers, addService} from "../service/handlers.js";

import {getState, getInitialDeviceState} from "./state.js";


const addDevice = (devices = [], device) => {
    const index = indexById(devices, device.id);
    if (index !== -1) {
        return devices;
    }

    return [...devices, getInitialDeviceState(device)];
};

const getDeviceHandlers = (devices = [], deviceId) => {
    const index = indexById(devices, deviceId);
    if (index === -1) {
        throw new Error(`no device with id=${deviceId}`);
    }

    const state = devices[index];
    const {services = []} = state;
    return {
        ...getServicesHandlers(services)
    };
};


const getHandlers = (state = getState()) => ({
    addDevice: device => state.value = addDevice(state.value, device),
    getDeviceHandlers: deviceId => getDeviceHandlers(state.value, deviceId)
});


export {
    getHandlers
};
