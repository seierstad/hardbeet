"use strict";
import {html} from "./preact-standalone.module.min.js";
import Sensor, {
    mainServiceUUID,
    optionalServicesUUIDs,
    ACTION as SENSOR_ACTION,
    reducer as sensorReducer,
    initialState as initialSensorState
} from "./sensor.js";
import PolarSensor from "./polar-sensor.js";
import {ACTION as STATUS_ACTION} from "./status.js";

const SENSOR_ACTIONS = Object.values(SENSOR_ACTION);

let deviceCounter = -1;

const ACTION = {
    ADD_SENSOR: Symbol("ADD_SENSOR")
};

const initialState = [];

const reducer = (state, action = {}) => {
    const {type, payload} = action;

    switch (type) {
        case ACTION.ADD_SENSOR:
            return [
                ...state,
                {
                    ...initialSensorState,
                    device: payload.device,
                    index: payload.index
                }
            ];
    }
    if (SENSOR_ACTIONS.indexOf(type) !== -1) {
        const sensorIndex = state.findIndex(sensor => sensor.device.id === payload.sensorId);
        if (sensorIndex !== -1) {
            return [
                ...state.slice(0, sensorIndex),
                sensorReducer(state[sensorIndex], action),
                ...state.slice(sensorIndex + 1)
            ];
        }
    }

    return state;
};

function Sensors (props) {
    const {
        bluetoothAvailable,
        devices = [],
        dispatch
    } = props;


    const dataFunctions = {
        registerSource: (sourceIndex, data) => console.log("register source " + sourceIndex + " with data " + data),
        registerDestination: (destinationIndex, data) => console.log("register destination " + destinationIndex + " with data " + data)
    };

    const addSensor = () => {
        navigator.bluetooth.requestDevice({
            filters: [
                {services: [mainServiceUUID]}
            ],
            optionalServices: optionalServicesUUIDs
        }).then(
            device => {
                deviceCounter += 1;
                dispatch({type: ACTION.ADD_SENSOR, payload: {device, index: deviceCounter}});
            },
            error => {
                dispatch({type: STATUS_ACTION.ERROR, payload: {text: "device request error: " + error, timestamp: new Date()}});
            }
        );
    };

    return html`
        <section>
            <header><h2>sensors</h2></header>
            ${devices.map(device => device.device.name.startsWith("Polar") ?
                html`<${PolarSensor} state=${device} dispatch=${dispatch} functions=${dataFunctions} index=${device.index} key=${device.device.id} />`
            :
                html`<${Sensor} state=${device} dispatch=${dispatch} functions=${dataFunctions} index=${device.index.index} key=${device.device.id} />`
            )}
            ${bluetoothAvailable ? html`<button onClick=${addSensor}>add sensor</button>` : null}
        </section>
    `;
}

export default Sensors;

export {
    reducer,
    ACTION,
    initialState
};
