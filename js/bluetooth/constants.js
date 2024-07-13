import {UUID as HEART_RATE_SERVICE_UUID} from "./service/heart-rate.js";
import {UUID as BATTERY_SERVICE_UUID} from "./service/battery.js";
import {UUID as USER_DATA_SERVICE_UUID} from "./service/user-data.js";
import {UUID as DEVICE_INFORMATION_SERVICE_UUID} from "./service/device-information.js";
import {POLAR_UUID1, POLAR_MEASUREMENT_DATA_SERVICE_UUID, POLAR_H10_UNDOCUMENTED_SERVICE} from "./polar/constants.js";

const mainServiceUUID = HEART_RATE_SERVICE_UUID;
const optionalServicesUUIDs = [
    BATTERY_SERVICE_UUID,
    USER_DATA_SERVICE_UUID,
    DEVICE_INFORMATION_SERVICE_UUID,
    //GATT_SERVICE_UUID.GENERIC_ACCESS,
    //GATT_SERVICE_UUID.GENERIC_ATTRIBUTE,
    //"00001801-0000-1000-8000-00805f9b34fb",
    //"00001800-0000-1000-8000-00805f9b34fb",
    POLAR_UUID1,
    POLAR_MEASUREMENT_DATA_SERVICE_UUID,
    POLAR_H10_UNDOCUMENTED_SERVICE
];


export {
    mainServiceUUID,
    optionalServicesUUIDs
};
