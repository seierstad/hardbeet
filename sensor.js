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





function lookupNameFromUUID (uuid, dictionaries) {
    let name = null;

    dictionaries.forEach(d => {
        if (d.hasOwnProperty(uuid)) {
            name = d[uuid];
        }
    });

    if (name === null && typeof uuid === "string" && uuid.length === 36) {
        const shortID = parseInt(uuid.substring(4, 8), 16);
        dictionaries.forEach(d => {
            if (d.hasOwnProperty(shortID)) {
                name = d[shortID];
            }
        });
    }

    return name || uuid.toString();
}

function getDescriptorName (uuid) {
    return lookupNameFromUUID(uuid, [GATT_DESCRIPTOR_NAME]);
}

function getCharacteristicName (uuid) {
    return lookupNameFromUUID(uuid, [POLAR_NAMES, CHARACTERISTIC_OR_OBJECT_TYPE]);
}

function getServiceName (uuid) {
    return lookupNameFromUUID(uuid, [POLAR_NAMES, GATT_SERVICE_NAME]);
}


class Sensor {
    constructor (device, index, logger = console) {
        this.logger = logger;
        this.index = index;

        this.heartRateService = null;
        this.services = {};

        this.connectHeartRateService = this.connectHeartRateService.bind(this);
        this.connectBatteryService = this.connectBatteryService.bind(this);
        this.connectUserDataService = this.connectUserDataService.bind(this);
        this.queryService = this.queryService.bind(this);

        this.handleGATTServerDisconnected = this.handleGATTServerDisconnected.bind(this);
        this.characteristicNotificationEventHandler = this.characteristicNotificationEventHandler.bind(this);

        this.rootElement = document.createElement("section");
        this.rootElement.classList.add("sensor");


        this.device = device;
        this.device.addEventListener("advertisementreceived", event => this.logger.log(`sensor ${this.index}: advertisement received: ${event}`));
        if (typeof this.device.watchAdvertisements === "function") {
            logger.log(`device ${index}: watching advertisements`);
            this.device.watchAdvertisements();
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

        device.gatt.connect().then(server => this.setupGATTServer(server));
    }

    handleGATTServerDisconnected (event) {
        this.logger.log("GATT SERVER DISCONNECTED!!!!!!!!!!");
        this.logger.log({event});
    }

    queryService (uuid) {
        return this.server.getPrimaryService(uuid)
            .then(service => {
                this.services[service.uuid] = {
                    service,
                    characteristics: {}
                };

                return service.getCharacteristics().then(chars => chars.forEach(char => {
                    this.services[service.uuid].characteristics[char.uuid] = {characteristic: char, descriptors: {}};
                    //console.log(getCharacteristicName(char.uuid), char.properties);

                    const promises = [
                        char.getDescriptors().then(descriptors => descriptors.forEach(descriptor => {
                            console.log(`sensor ${this.index}: service ${getServiceName(service.uuid)}, ${getCharacteristicName(char.uuid)}: descriptor ${decriptor.uuid}`);
                        })).catch(error => {
                            console.log(`sensor ${this.index}: no descriptors found in service ${getServiceName(service.uuid)}, characteristic ${getCharacteristicName(char.uuid)}`)
                        }),
                    ];

                    if (char.properties.read) {
                        this.logger.log(`reading characteristic ${getCharacteristicName(char.uuid)} from service ${getServiceName(service.uuid)}`);
                        promises.push(
                            char.readValue()
                                .then(value => {
                                    this.services[service.uuid].characteristics[char.uuid].value = value;
                                    this.services[service.uuid].characteristics[char.uuid].valueString = byteArray2String(value);
                                    this.services[service.uuid].characteristics[char.uuid].valueBytes = byteArray2Array(value);
                                })
                                .catch(err => console.error(`sensor ${this.index} ${getCharacteristicName(char.uuid)} read error: ${err}`))
                        );
                    }

                    if (char.properties.notify) {
                        char.addEventListener("characteristicvaluechanged", this.characteristicNotificationEventHandler);

                        promises.push(
                            char.startNotifications()
                                .then(char => {
                                    console.log(`sensor ${this.index}: notifications started for characteristic ${getCharacteristicName(char.uuid)}`);
                                })
                                .catch(err => console.error(`sensor ${this.index}: start notifications failed for characteristic ${getCharacteristicName(char.uuid)}: ${err}`))
                        );
                    }

                    return Promise.all(promises).catch(err => console.log(err));
                }));
            });
    }

    characteristicNotificationEventHandler (event) {
        this.logger.log(
            `sensor ${this.index}:
             notification from ${getCharacteristicName(event.target.uuid)} -
             ${byteArray2Array(event.target.value)} - ${byteArray2String(event.target.value)}`);
    }

    setupGATTServer (server) {
        this.server = server;

        const promises = [];
        /*
            mainServiceUUID,
            ...optionalServicesUUIDs
        ].map(this.queryService);
        */

        this.server.device.addEventListener("gattserverdisconnected", this.handleGATTServerDisconnected);

        const heartRateServicePromise = server.getPrimaryService("heart_rate").then(this.connectHeartRateService);
        const batteryService = server.getPrimaryService("battery_service").then(this.connectBatteryService);
        const userDataService = server.getPrimaryService("user_data")
            .then(
                this.connectUserDataService,
                err => this.logger.log(`${this.index}: no user data service`)
            );
        const pmdService = server.getPrimaryService(POLAR_MEASUREMENT_DATA_SERVICE_UUID).then(this.connectPmdService);

        return Promise.all([
            ...promises,
            heartRateServicePromise,
            batteryService,
            userDataService,
            pmdService
        ]);
    }


    connectUserDataService (service) {
        this.userData = new UserData(service);
        this.rootElement.appendChild(this.userData.rootElement);
    }

    connectBatteryService (service) {
        this.batteryService = new BatteryService(service);
        this.rootElement.appendChild(this.batteryService.rootElement);
    }

    connectHeartRateService (service) {
        this.heartRateService = new HeartRateService(service);
        this.rootElement.appendChild(this.heartRateService.rootElement);
    }


}

export default Sensor;

export {
    mainServiceUUID,
    optionalServicesUUIDs
};
