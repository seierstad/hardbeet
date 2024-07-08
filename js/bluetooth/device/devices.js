import {html} from "htm/preact";

import {PolarSensor} from "../polar/sensor.js";
import {Jamstik} from "../jamstik/device.js";
import {Device} from "./device.js";

import {
    mainServiceUUID,
    optionalServicesUUIDs
} from "../constants.js";


const reducer = (state, action = {}) => {
    const {type, payload} = action;
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

function Devices (props) {
    const {
        devices = {value: []},
        handlers = {},
        log = console.log
    } = props;


    const dataFunctions = {
        registerSource: (sourceIndex, data) => log("register source " + sourceIndex + " with data " + data),
        registerDestination: (destinationIndex, data) => log("register destination " + destinationIndex + " with data " + data)
    };

    return html`
        <section>
            <header><h2>devices</h2></header>
            ${devices.value.map(device => {
                if (device.object.name) {
                    if (device.object.name.startsWith("Polar")) {
                        return html`<${PolarSensor} state=${device} getHandlers=${handlers.getDeviceHandlers} functions=${dataFunctions} key=${device.id} />`
                    } else if (device.object.name.startsWith("Zivix") || device.object.name.startsWith("Rola")) {
                        return html`<${Jamstik} state=${device} getHandlers=${handlers.getDeviceHandlers} functions=${dataFunctions} key=${device.id} />`
                    }
                }
                return html`<${Device} state=${device} getHandlers=${handlers.getDeviceHandlers} functions=${dataFunctions} key=${device.id} />`;
            })}
        </section>
    `;
}


export {
    Devices
};
