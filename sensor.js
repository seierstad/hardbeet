"use strict";

import {html, useState, useEffect} from "./preact-standalone.module.min.js";

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
import PolarService, {UUID as POLAR_SERVICE_UUID, ACTION as POLAR_SERVICE_ACTION, reducer as polarServiceReducer} from "./service-polar.js";

const SERVICE_ACTION = {
    ...POLAR_SERVICE_ACTION
};

const SERVICE_ACTIONS = Object.values(SERVICE_ACTION);

const initialState = {
    melding: "state er med!",
    services: []
};

const ACTION = {
    ...SERVICE_ACTION,
    SENSOR_ADD_SERVICES: Symbol("SENSOR_ADD_SERVICES"),
    SENSOR_ADD_SERVICE: Symbol("SENSOR_ADD_SERVICE")
};

const reducer = (state = initialState, action = {}) => {
    const {type, payload} = action;
    switch (type) {
        case ACTION.SENSOR_ADD_SERVICES:
            return {
                ...state,
                services: [
                    ...state.services,
                    ...payload.services.map(service => ({"uuid": service.uuid, service}))
                ]
            };

        case ACTION.SENSOR_ADD_SERVICE:
            return {
                ...state,
                services: [
                    ...state.services,
                    {"uuid": payload.service.uuid, "service": payload.service}
                ]
            };
    }
    if (SERVICE_ACTIONS.indexOf(type) !== -1) {
        let newServiceState = {};
        let serviceIndex = state.services.findIndex(service => service.uuid === payload.serviceUUID);

        if (serviceIndex !== -1) {
            switch (payload.serviceUUID) {
                case POLAR_SERVICE_UUID:
                    newServiceState = polarServiceReducer(state.services[serviceIndex], action);
                    break;
            }

            return {
                ...state,
                services: [
                    ...state.services.slice(0, serviceIndex),
                    newServiceState,
                    ...state.services.slice(serviceIndex + 1)
                ]
            };
        }
    }

    return state;
};

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

function Sensor (props) {
    const {state, index, functions = {}, dispatch, additionalServices = []} = props;
    const {device, services = []} = state;
    const [GATTServer, setGATTServer] = useState();
    //const [services, setServices] = useState([]);
    const logService = (ting) => console.log({ting});
    const serviceError = (error) => dispatch({type: STATUS_ACTION.ERROR, payload: {text: `${index}: service error: ${error}`, timestamp: new Date()}});

    const [serviceDescriptors] = useState([
        {
            id: HEART_RATE_SERVICE_UUID,
            connectFn: logService,
            errorFn: serviceError
        }, {
            id: BATTERY_SERVICE_UUID,
            connectFn: logService,
            errorFn: serviceError
        }, {
            id: USER_DATA_SERVICE_UUID,
            connectFn: logService,
            errorFn: serviceError
        }, {
            id: DEVICE_INFORMATION_SERVICE_UUID,
            connectFn: logService,
            errorFn: serviceError
        },
        /*
        */
        ...additionalServices
    ]);


    useEffect(() => {
        device.addEventListener("advertisementreceived", event => dispatch({type: STATUS_ACTION.ERROR, payload: {text: `sensor ${index}: advertisement received: ${event.type}`, timestamp: new Date()}}));

        if (typeof device.watchAdvertisements === "function") {
            device.watchAdvertisements().then(
                () => dispatch({type: STATUS_ACTION.ERROR, payload: {text: `sensor ${index}: watching advertisements`, timestamp: new Date()}}),
                error => dispatch({type: STATUS_ACTION.ERROR, payload: {text: "device watchAdvertisements error: " + error, timestamp: new Date()}})
            );
        }
        device.gatt.connect()
            .then(
                server => setGATTServer(server),
                error => dispatch({type: STATUS_ACTION.ERROR, payload: {text: "gatt connection error: " + error, timestamp: new Date()}})
            );

        return () => {
            device.removeEventListener("advertisementreceived");
            device.gatt.disconnect();
        };
    }, []);

    const addService = (service) => {
        dispatch({type: ACTION.SENSOR_ADD_SERVICE, payload: {sensorId: device.id, service}});
    };

    const addServices = (services) => {
        dispatch({type: ACTION.SENSOR_ADD_SERVICES, payload: {sensorId: device.id, services}});
        //setServices(services);
    };

    const handleGATTServerDisconnected = (event) => {
        dispatch({type: STATUS_ACTION.LOG, payload: {text: "GATT SERVER DISCONNECTED!!!!!!!!!!" + event.message, timestamp: new Date()}});
    };

    useEffect(() => {
        if (GATTServer) {
            GATTServer.device.addEventListener("gattserverdisconnected", handleGATTServerDisconnected);

            serviceDescriptors.map(s => GATTServer.getPrimaryService(s.id).then(addService).catch(serviceError));
        }
    }, [GATTServer]);


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
                                    return html`<${HeartRateService} key=${service.uuid} service=${service.service} dispatch=${dispatch} />`;

                                case BATTERY_SERVICE_UUID:
                                    return html`<${BatteryService} key=${service.uuid} service=${service.service} dispatch=${dispatch} />`;

                                case USER_DATA_SERVICE_UUID:
                                    return html`<${UserDataService} key=${service.uuid} service=${service.service} dispatch=${dispatch} />`;

                                case DEVICE_INFORMATION_SERVICE_UUID:
                                    return html`<${DeviceInformationService} key=${service.uuid} service=${service.service} dispatch=${dispatch} />`;

                            }
                        } else {
                            switch (service.uuid) {
                                case POLAR_SERVICE_UUID:
                                    return html`<${PolarService} key=${service.uuid} state=${service} dispatch=${dispatch} sensorId=${device.id} functions=${functions} />`;
                            }
                        }
                    })}
                </div>
            `) : "no services :("}
        </div>
    `;
}

export default Sensor;

export {
    mainServiceUUID,
    optionalServicesUUIDs,
    initialState,
    ACTION,
    reducer
};
