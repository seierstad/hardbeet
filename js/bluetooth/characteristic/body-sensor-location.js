import {useEffect} from "preact/hooks";
import {html} from "htm/preact";

import {Characteristic} from "./characteristic.js";

const BODY_SENSOR_LOCATION = {
    0x00: "Other",
    0x01: "Chest",
    0x02: "Wrist",
    0x03: "Finger",
    0x04: "Hand",
    0x05: "Ear lobe",
    0x06: "Foot"
};


const getState = () => {};

const getHandlers = () => {};

const parseSensorLocation = sensorLocationData => sensorLocationData.getUint8(0);


const BodySensorLocationCharacteristic = (props = {}) => {
    const {state = {}, handlers, serviceHandlers} = props;
    const {object: characteristic} = state;
    const {setSensorLocation} = serviceHandlers;

    const sensorLocationChangeHandler = (event) => {
        const parsed = parseSensorLocation(event.target.value);
        setSensorLocation(BODY_SENSOR_LOCATION[parsed]);
    };

    useEffect(() => {
        if (characteristic !== null) {
            const {
                properties: {
                    read,
                    notify
                } = {}
            } = characteristic;

            if (read) {
                characteristic.readValue()
                    .then(sensorLocationData => setSensorLocation(BODY_SENSOR_LOCATION[sensorLocationData.getUint8(0)]));
            }

            if (notify) {
                characteristic.addEventListener("characteristicvaluechanged", sensorLocationChangeHandler);
                characteristic.startNotifications();

                return () => {
                    characteristic.stopNotifications();
                    characteristic.removeEventListener("characteristicvaluechanged", sensorLocationChangeHandler);
                };
            }
        }
    }, [characteristic]);

    return html`
        <${Characteristic} state=${state} handlers=${handlers}>
        <//>
    `;

};


export {
    BodySensorLocationCharacteristic,
    getState,
    getHandlers
};
