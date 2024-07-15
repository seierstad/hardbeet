import {useEffect} from "preact/hooks";
import {html} from "htm/preact";

import {Characteristic} from "./characteristic.js";


const getState = () => {};

const getHandlers = () => {};


const BatteryLevelCharacteristic = (props = {}) => {
    const {state = {}, handlers, serviceHandlers} = props;
    const {object: characteristic} = state;
    const {setBatteryLevel} = serviceHandlers;

    const handleBatteryLevelChanged = (event) => setBatteryLevel(event.target.value.getUint8(0));

    useEffect(() => {
        const {
            properties: {
                notify,
                read
            } = {}
        } = characteristic;

        if (read) {
            characteristic.readValue().then(batteryLevelData => setBatteryLevel(batteryLevelData.getUint8(0)));
        }

        if (notify) {
            characteristic.addEventListener("characteristicvaluechanged", handleBatteryLevelChanged);
            characteristic.startNotifications();
        }
    }, []);

    return html`
        <${Characteristic} state=${state} handlers=${handlers}>
        <//>
    `;

};


export {
    BatteryLevelCharacteristic,
    getState,
    getHandlers
};
