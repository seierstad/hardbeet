import {lookupUUID} from "../functions.js";
import {Characteristic} from "./characteristic.js";
import {PolarDataCharacteristic, UUID as POLAR_DATA_UUID, getState as getPolarDataState, getHandlers as getPolarDataHandlers} from "../polar/characteristic/data.js";
import {PolarControlPointCharacteristic, UUID as POLAR_CONTROL_POINT_UUID, getState as getPolarControlPointState, getHandlers as getPolarControlPointHandlers} from "../polar/characteristic/control-point.js";
import {CHARACTERISTIC_UUID} from "../characteristics_and_object_types.js";
import {HeartRateMeasurementCharacteristic, getState as getHeartRateState, getHandlers as getHeartRateHandlers} from "./heart-rate-measurement.js";
import {BodySensorLocationCharacteristic, getState as getBodySensorLocationState, getHandlers as getBodySensorLocationHandlers} from "./body-sensor-location.js";
import {BatteryLevelCharacteristic, getState as getBatteryLevelState, getHandlers as getBatteryLevelHandlers} from "./battery-level.js";

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
    },
    [CHARACTERISTIC_UUID.HEART_RATE_MEASUREMENT]: {
        state: getHeartRateState,
        handlers: getHeartRateHandlers,
        view: HeartRateMeasurementCharacteristic
    },
    [CHARACTERISTIC_UUID.BODY_SENSOR_LOCATION]: {
        state: getBodySensorLocationState,
        handlers: getBodySensorLocationHandlers,
        view: BodySensorLocationCharacteristic
    },
    [CHARACTERISTIC_UUID.BATTERY_LEVEL]: {
        state: getBatteryLevelState,
        handlers: getBatteryLevelHandlers,
        view: BatteryLevelCharacteristic
    }
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
    const {
        [lookup]: {
            view = Characteristic
        } = {}
    } = specifics;
    return view;
};


export {
    getCharacteristicSpecificState,
    getCharacteristicSpecificHandlers,
    getCharacteristicSpecificView
};
