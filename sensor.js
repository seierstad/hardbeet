import {
    POLAR_CHARACTERISTICS,
    POLAR_MEASUREMENT_DATA_SERVICE_UUID,
    POLAR_UUID1,
    POLAR_UUID2,
    POLAR_NAMES,
    POLAR_H10_UNDOCUMENTED_SERVICE,
    POLAR_ERROR_CODES,
    MEASUREMENT_TYPE,
    MEASUREMENT_NAME,
    SETTING_TYPE_NAME,
    SETTING_TYPE,
    CONTROL_POINT_REQUEST,
    PMD_FLAG,
    OP_CODE,
    SETTING_VALUES
} from "./polar-codes.js";

import {
    GATT_SERVICE_NAME,
    GATT_SERVICE_UUID,
    GATT_DESCRIPTOR_NAME
} from "./GATT_constants.js";

import {
    CHARACTERISTIC_UUID,
    CHARACTERISTIC_OR_OBJECT_TYPE
} from "./characteristics_and_object_types.js";

import UserData from "./user-data.js";
import BatteryService from "./battery-service.js";
import HeartRateService from "./heart-rate-service.js";
import DeviceInformation from "./device-information.js";


const mainServiceUUID = GATT_SERVICE_UUID.HEART_RATE;
const optionalServicesUUIDs = [
    GATT_SERVICE_UUID.BATTERY,
    GATT_SERVICE_UUID.DEVICE_INFORMATION,
    GATT_SERVICE_UUID.USER_DATA,
    //GATT_SERVICE_UUID.GENERIC_ACCESS,
    //GATT_SERVICE_UUID.GENERIC_ATTRIBUTE,
    //"00001801-0000-1000-8000-00805f9b34fb",
    //"00001800-0000-1000-8000-00805f9b34fb",
    POLAR_UUID1,
    POLAR_MEASUREMENT_DATA_SERVICE_UUID,
    POLAR_H10_UNDOCUMENTED_SERVICE
];



function byteArray2Array (byteArray) {
    let result = [];
    for (let i = 0; i < byteArray.byteLength; i += 1) {
        result.push(byteArray.getUint8(i));
    }
    return result;
}

function byteArray2String (byteArray) {
    return String.fromCharCode(...byteArray2Array(byteArray));
}




class Sensor {
    constructor (device, index, logger = console, dataCallbackFn = (dataType, data, parameters) => logger.log({dataType, data, parameters})) {
        this.logger = logger;
        this.index = index;

        this.dataCallbackFn = dataCallbackFn;
        this.heartRateService = null;
        this.services = {};

        this.connectHeartRateService = this.connectHeartRateService.bind(this);
        this.connectBatteryService = this.connectBatteryService.bind(this);
        this.connectUserDataService = this.connectUserDataService.bind(this);


        this.handleGATTServerDisconnected = this.handleGATTServerDisconnected.bind(this);

        this.rootElement = document.createElement("section");
        this.rootElement.classList.add("sensor");

        this.serviceDescriptors = [{
            id: "heart_rate",
            connectFn: this.connectHeartRateService,
            errorFn: this.heartRateServiceError
        }, {
            id: "battery_service",
            connectFn: this.connectBatteryService,
            errorFn: this.batteryServiceError
        }, {
            id: "user_data",
            connectFn: this.connectUserDataService,
            errorFn: this.userDataServiceError
        }];

        this.device = device;
        this.device.addEventListener("advertisementreceived", event => this.logger.log(`sensor ${this.index}: advertisement received: ${event}`));
        if (typeof this.device.watchAdvertisements === "function") {
            this.device.watchAdvertisements().then(_ => logger.log(`sensor ${index}: watching advertisements`));
        }

        let header = document.createElement("header");
        this.headerElement = header;
        let heading = document.createElement("h2");
        heading.innerText = "sensor " + index;
        header.appendChild(heading);
        this.rootElement.appendChild(header);
        const nameElement = document.createElement("span");
        nameElement.innerText = device.name;
        nameElement.classList.add("sensor-device-name");
        this.headerElement.appendChild(nameElement);

        const idElement = document.createElement("span");
        idElement.innerText = device.id;
        idElement.classList.add("sensor-device-id");
        this.headerElement.appendChild(idElement);
    }

    connect () {
        this.device.gatt.connect().then(server => this.setupGATTServer(server));
    }

    handleGATTServerDisconnected (event) {
        this.logger.log("GATT SERVER DISCONNECTED!!!!!!!!!!");
        this.logger.log({event});
    }


    setupGATTServer (server) {
        this.server = server;
        this.server.device.addEventListener("gattserverdisconnected", this.handleGATTServerDisconnected);

        const servicePromises = this.serviceDescriptors.map(s => server.getPrimaryService(s.id).then(s.connectFn, s.errorFn));

        return Promise.all(servicePromises);
    }


    connectUserDataService (service) {
        this.userData = new UserData(service);
        this.rootElement.appendChild(this.userData.rootElement);
    }

    userDataServiceError (error) {
        this.logger.log(`${this.index}: user data service error: ${error}`);
    }


    connectBatteryService (service) {
        this.batteryService = new BatteryService(service);
        this.rootElement.appendChild(this.batteryService.rootElement);
    }

    batteryServiceError (error) {
        this.logger.log(`${this.index}: battery service error: ${error}`);
    }


    connectHeartRateService (service) {
        this.heartRateService = new HeartRateService(service, this.dataCallbackFn);
        this.rootElement.appendChild(this.heartRateService.rootElement);
    }

    heartRateServiceError (error) {
        this.logger.log(`${this.index}: heart rate service error: ${error}`);
    }



}

export default Sensor;

export {
    mainServiceUUID,
    optionalServicesUUIDs
};
