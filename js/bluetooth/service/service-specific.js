import {lookupUUID} from "./functions.js";
import {PolarService, UUID as POLAR_UUID, getState as getPolarState, getHandlers as getPolarHandlers} from "../polar/service.js";
import {BatteryService, UUID as BATTERY_UUID, getState as getBatteryState, getHandlers as getBatteryHandlers} from "./battery.js";
import {DeviceInformationService, UUID as DEVICE_INFORMATION_UUID, getState as getDeviceInformationState, getHandlers as getDeviceInformationHandlers} from "./device-information.js";
import {UserDataService, UUID as USER_DATA_UUID, getState as getUserDataState, getHandlers as getUserDataHandlers} from "./user-data.js";
import {HeartRateService, UUID as HEART_RATE_UUID, getState as getHeartRateState, getHandlers as getHeartRateHandlers} from "./heart-rate.js";
import {MidiService, UUID as MIDI_UUID, getState as getMidiState, getHandlers as getMidiHandlers} from "./midi/service.js";

const specifics = {
    [BATTERY_UUID]: {
        state: getBatteryState,
        handlers: getBatteryHandlers,
        view: BatteryService
    },
    [DEVICE_INFORMATION_UUID]: {
        state: getDeviceInformationState,
        handlers: getDeviceInformationHandlers,
        view: DeviceInformationService
    },
    [USER_DATA_UUID]: {
        state: getUserDataState,
        handlers: getUserDataHandlers,
        view: UserDataService
    },
    [HEART_RATE_UUID]: {
        state: getHeartRateState,
        handlers: getHeartRateHandlers,
        view: HeartRateService
    },
    [POLAR_UUID]: {
        state: getPolarState,
        handlers: getPolarHandlers,
        view: PolarService
    },
    [MIDI_UUID]: {
        state: getMidiState,
        handlers: getMidiHandlers,
        view: MidiService
    }
};

const getServiceSpecificState = (serviceId) => {
    const lookup = lookupUUID(serviceId);
    if (Object.prototype.hasOwnProperty.call(specifics, lookup)) {
        return specifics[lookup].state();
    }
    return {};
};

const getServiceSpecificHandlers = (state = {}) => {
    const lookup = lookupUUID(state.uuid);
    if (Object.prototype.hasOwnProperty.call(specifics, lookup)) {
        return specifics[lookup].handlers(state);
    }
    return {};
};

const getServiceSpecificView = (serviceId) => {
    const lookup = lookupUUID(serviceId);
    if (Object.prototype.hasOwnProperty.call(specifics, lookup)) {
        return specifics[lookup].view;
    }
    return () => null;
};


export {
    getServiceSpecificState,
    getServiceSpecificHandlers,
    getServiceSpecificView
};
