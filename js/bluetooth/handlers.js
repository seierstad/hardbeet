import {getHandlers as getDevicesHandlers} from "./device/handlers.js";

const getHandlers = (state = {}) => {
    const {
        devices
    } = state;

    return {
        setAvailable: available => state.available.value = !!available,
        devices: getDevicesHandlers(devices)
    };
};


export {
    getHandlers
};
