import {lookupUUID} from "../functions.js";
import {Characteristic as GenericCharacteristic} from "./characteristic.js";
import {PolarDataCharacteristic, UUID as POLAR_DATA_UUID, getState as getPolarDataState, getHandlers as getPolarDataHandlers} from "../polar/characteristic/data.js";
import {PolarControlPointCharacteristic, UUID as POLAR_CONTROL_POINT_UUID, getState as getPolarControlPointState, getHandlers as getPolarControlPointHandlers} from "../polar/characteristic/control-point.js";
/*
import {BatteryCharacteristic, UUID as BATTERY_UUID, getState as getBatteryState, getHandlers as getBatteryHandlers} from "./battery.js";
import {DeviceInformationCharacteristic, UUID as DEVICE_INFORMATION_UUID, getState as getDeviceInformationState, getHandlers as getDeviceInformationHandlers} from "./device-information.js";
import {UserDataCharacteristic, UUID as USER_DATA_UUID, getState as getUserDataState, getHandlers as getUserDataHandlers} from "./user-data.js";
import {HeartRateCharacteristic, UUID as HEART_RATE_UUID, getState as getHeartRateState, getHandlers as getHeartRateHandlers} from "./heart-rate.js";
import {MidiCharacteristic, UUID as MIDI_UUID, getState as getMidiState, getHandlers as getMidiHandlers} from "./midi/characteristic.js";
*/

const specifics = {
    [POLAR_DATA_UUID]: {
        state: getPolarDataState,
        handlers: getPolarDataHandlers,
        view: PolarDataCharacteristic
    },
    [POLAR_CONTROL_POINT_UUID]: {
        state: getPolarControlPointState,
        handlers: getPolarControlPointHandlers,
        view: PolarControlPointCharacteristic
    }
    /*,
    [USER_DATA_UUID]: {
        state: getUserDataState,
        handlers: getUserDataHandlers,
        view: UserDatacharacteristic
    },
    [HEART_RATE_UUID]: {
        state: getHeartRateState,
        handlers: getHeartRateHandlers,
        view: HeartRatecharacteristic
    },
    [POLAR_UUID]: {
        state: getPolarState,
        handlers: getPolarHandlers,
        view: Polarcharacteristic
    },
    [MIDI_UUID]: {
        state: getMidiState,
        handlers: getMidiHandlers,
        view: Midicharacteristic
    }
    */
};


const getCharacteristicSpecificState = (characteristicId) => {
    const lookup = lookupUUID(characteristicId);
    if (Object.prototype.hasOwnProperty.call(specifics, lookup)) {
        return specifics[lookup].state;
    }
    return () => {};
};

const getCharacteristicSpecificHandlers = (state = {}) => {
    const lookup = lookupUUID(state.uuid);
    if (Object.prototype.hasOwnProperty.call(specifics, lookup)) {
        return specifics[lookup].handlers(state);
    }
    return {};
};

const getCharacteristicSpecificView = (characteristicId) => {
    const lookup = lookupUUID(characteristicId);
    if (Object.prototype.hasOwnProperty.call(specifics, lookup)) {
        return specifics[lookup].view;
    }
    console.log("genericCharacteristic " + lookup);
    return GenericCharacteristic;
};


export {
    getCharacteristicSpecificState,
    getCharacteristicSpecificHandlers,
    getCharacteristicSpecificView
};
