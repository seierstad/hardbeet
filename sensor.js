"use strict";

import {html, Component} from "./preact-standalone.module.min.js";

import {
    POLAR_MEASUREMENT_DATA_SERVICE_UUID,
    POLAR_UUID1,
    POLAR_H10_UNDOCUMENTED_SERVICE
} from "./polar-codes.js";
import {ACTION as STATUS_ACTION} from "./status.js";

import UserDataService, {UUID as USER_DATA_SERVICE_UUID} from "./service-user-data.js";
import BatteryService, {UUID as BATTERY_SERVICE_UUID} from "./service-battery.js";
import HeartRateService, {UUID as HEART_RATE_SERVICE_UUID} from "./service-heart-rate.js";
import DeviceInformationService, {UUID as DEVICE_INFORMATION_SERVICE_UUID} from "./service-device-information.js";
import PolarService, {UUID as POLAR_SERVICE_UUID} from "./service-polar.js";


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
    constructor ({device, index, functions = {}, dispatch}) {
        super();
        this.index = index;

        this.dispatch = dispatch;
        this.device = device;

        const {
            registerSource,
            registerDestination
        } = functions;

        this.functions = {
            registerSource: registerSource.bind(index),
            registerDestination: registerDestination.bind(index)
        };

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


        this.device.addEventListener("advertisementreceived", event => console.log(`sensor ${this.index}: advertisement received: ${event}`));
        if (typeof this.device.watchAdvertisements === "function") {
            this.device.watchAdvertisements().then(
                () => console.log(`sensor ${index}: watching advertisements`),
                error => this.dispatch({type: STATUS_ACTION.ERROR, payload: {text: "device watchAdvertisements error: " + error, timestamp: new Date()}})
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
                                        return html`<${HeartRateService} key=${service.uuid} service=${service} dispatch=${this.dispatch} dataCallbackFn=${this.dataCallbackFn} />`;

                                    case BATTERY_SERVICE_UUID:
                                        return html`<${BatteryService} key=${service.uuid} service=${service} dispatch=${this.dispatch} dataCallbackFn=${this.dataCallbackFn} />`;

                                    case USER_DATA_SERVICE_UUID:
                                        return html`<${UserDataService} key=${service.uuid} service=${service} dispatch=${this.dispatch} dataCallbackFn=${this.dataCallbackFn} />`;

                                    case DEVICE_INFORMATION_SERVICE_UUID:
                                        return html`<${DeviceInformationService} key=${service.uuid} service=${service} dispatch=${this.dispatch} dataCallbackFn=${this.dataCallbackFn} />`;

                                }
                            } else {
                                switch (service.uuid) {
                                    case POLAR_SERVICE_UUID:
                                        return html`<${PolarService} key=${service.uuid} service=${service} dispatch=${this.dispatch} functions=${this.functions} dataCallbackFn=${this.dataCallbackFn} />`;
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
        this.dispatch({type: STATUS_ACTION.LOG, payload: {text: "GATT SERVER DISCONNECTED!!!!!!!!!!" + event, timestamp: new Date()}});
        console.log({event});
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
        this.dispatch({type: STATUS_ACTION.ERROR, payload: {text: `${this.index}: user data service error: ${error}`, timestamp: new Date()}});
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
