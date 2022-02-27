"use strict";

import {html, Component} from "./preact-standalone.module.min.js";
import Service from "./service.js";

import {
    POLAR_MEASUREMENT_DATA_SERVICE_UUID,
    POLAR_UUID1,
    POLAR_H10_UNDOCUMENTED_SERVICE
} from "./polar-codes.js";

import UserDataService, {UUID as USER_DATA_SERVICE_UUID} from "./user-data.js";
import BatteryService, {UUID as BATTERY_SERVICE_UUID} from "./battery-service.js";
import HeartRateService, {UUID as HEART_RATE_SERVICE_UUID} from "./heart-rate-service.js";
import DeviceInformationService, {UUID as DEVICE_INFORMATION_SERVICE_UUID} from "./device-information.js";
import PolarService, {UUID as POLAR_SERVICE_UUID} from "./polar-service.js";


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

/*
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
*/

class Sensor extends Component {
    constructor ({device: {device, deviceIndex}, index, dataCallbackFn, functions = {}}) {
        super();
        this.index = index;

        this.device = device;
        this.deviceIndex = deviceIndex;

        const {
            registerSource,
            registerDestination
        } = functions;

        this.functions = {
            registerSource: registerSource.bind(this.deviceIndex),
            registerDestination: registerDestination.bind(this.deviceIndex)
        };

        this.dataCallbackFn = dataCallbackFn;

        this.addServices = this.addServices.bind(this);
        this.serviceError = this.serviceError.bind(this);
        this.logService = this.logService.bind(this);

        this.handleGATTServerDisconnected = this.handleGATTServerDisconnected.bind(this);

        this.serviceDescriptors = [{
            id: HEART_RATE_SERVICE_UUID,
            connectFn: this.logService,
            errorFn: this.heartRateServiceError
        }, {
            id: BATTERY_SERVICE_UUID,
            connectFn: this.logService,
            errorFn: this.batteryServiceError
        }, {
            id: USER_DATA_SERVICE_UUID,
            connectFn: this.logService,
            errorFn: this.userDataServiceError
        }, {
            id: DEVICE_INFORMATION_SERVICE_UUID,
            connectFn: this.logService,
            errorFn: this.serviceError
        }];


        this.functions = 

        this.device.addEventListener("advertisementreceived", event => console.log(`sensor ${this.index}: advertisement received: ${event}`));
        if (typeof this.device.watchAdvertisements === "function") {
            this.device.watchAdvertisements().then(
                function () {
                    console.log(`sensor ${index}: watching advertisements`);
                },
                error => this.logger.log("device watchAdvertisements error: " + error)
            );
        }

        this.state = {
            services: []
        };
    }

    render () {
        const {index, device} = this.props;
        const {services = []} = this.state;

        return html`
            <div class="sensor">
                <header>
                    <h3>sensor ${index}</h3>
                    <span class="sensor-device-name">${device.name}</span>
                    <span class="sensor-device-id">${device.id}</span>
                </header>
                ${services.length > 0 ? (html`
                    <div class="services">
                        ${services.map(service => {
                            if (typeof service.uuid === "string" && service.uuid.endsWith("-0000-1000-8000-00805f9b34fb")) {
                                switch (parseInt(service.uuid.substring(4, 8), 16)) {
                                    case HEART_RATE_SERVICE_UUID:
                                        return html`<${HeartRateService} key=${service.uuid} service=${service} dataCallbackFn=${this.dataCallbackFn} />`;

                                    case BATTERY_SERVICE_UUID:
                                        return html`<${BatteryService} key=${service.uuid} service=${service} dataCallbackFn=${this.dataCallbackFn} />`;

                                    case USER_DATA_SERVICE_UUID:
                                        return html`<${UserDataService} key=${service.uuid} service=${service} dataCallbackFn=${this.dataCallbackFn} />`;

                                    case DEVICE_INFORMATION_SERVICE_UUID:
                                        return html`<${DeviceInformationService} key=${service.uuid} service=${service} dataCallbackFn=${this.dataCallbackFn} />`;

                                }
                            } else {
                                switch (service.uuid) {
                                    case POLAR_SERVICE_UUID:
                                        return html`<${PolarService} key=${service.uuid} service=${service} functions=${this.functions} dataCallbackFn=${this.dataCallbackFn} />`;
                                }
                            }
                        })}
                    </div>
                `) : "no services :("}
            </div>
        `;
    }

    componentDidMount () {
        this.device.gatt.connect()
            .then(
                server => this.setupGATTServer(server),
                error => console.log("gatt connection error: " + error)
            );
    }

    handleGATTServerDisconnected (event) {
        this.logger.log("GATT SERVER DISCONNECTED!!!!!!!!!!");
        this.logger.log({event});
    }


    setupGATTServer (server) {
        this.server = server;
        this.server.device.addEventListener("gattserverdisconnected", this.handleGATTServerDisconnected);

        const servicePromises = this.serviceDescriptors.map(s => server.getPrimaryService(s.id));

        return Promise.all(servicePromises).then(this.addServices);
    }

    addServices (services) {
        this.setState({services});
    }

    serviceError (error) {
        this.logger.log(`${this.index}: user data service error: ${error}`);
    }

    logService (service) {
        console.log("logging " + service.uuid);
        return service;
    }
}

export default Sensor;

export {
    mainServiceUUID,
    optionalServicesUUIDs
};
