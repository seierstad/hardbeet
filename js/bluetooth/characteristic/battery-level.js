import {useEffect, useMemo, useState} from "preact/hooks";
import {signal} from "@preact/signals";
import {html} from "htm/preact";

import {Characteristic} from "./characteristic.js";


const getState = () => {};

const getHandlers = () => {};


const BatteryLevelCharacteristic = (props = {}) => {
    const {state = {}, handlers, serviceHandlers} = props;
    const {object: characteristic, features} = state;
    const {setBatteryLevel} = serviceHandlers;
    const logError = (e) => console.error(e);

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
