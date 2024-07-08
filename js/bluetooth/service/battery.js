import {signal} from "@preact/signals";
import {useEffect, useState, useContext, useMemo} from "preact/hooks";
import {html} from "htm/preact";

import {AppHandlersContext} from "hardbeet";

import {GATT_SERVICE_UUID} from "../GATT_constants.js";

import Service from "./service.js";


const UUID = GATT_SERVICE_UUID.BATTERY;

const getState = (initialValues = {}) => {
    const {
        batteryLevel = null
    } = initialValues;

    return {
        batteryLevel: signal(batteryLevel)
    };
};

const getHandlers = (state) => ({
    setBatteryLevel: level => state.batteryLevel.value = parseFloat(level)
});


const BatteryService = (props = {}) => {
    const {state, getHandlers} = props;
    const {object: service = {}, batteryLevel} = state;
    const handlers = useMemo(() => getHandlers(state));
    const {log: {log, logError} = {}} = useContext(AppHandlersContext);

    const handleBatteryLevelChanged = (event) => handlers.setBatteryLevel(event.target.value.getUint8(0));

    const handleBatteryLevelCharacteristic = (characteristic) => {
        if (characteristic === null) {
            setBatteryLevel("unknown");
            return Promise.reject("no battery level characteristic found");
        }
        const {
            properties: {
                notify,
                read
            } = {}
        } = characteristic;

        characteristic.addEventListener("characteristicvaluechanged", handleBatteryLevelChanged);

        characteristic.readValue().then(batteryLevelData => handlers.setBatteryLevel(batteryLevelData.getUint8(0)));
        if  (notify) {
            characteristic.startNotifications();
        }
    };

    useEffect(() => {
        service.getCharacteristic("battery_level").then(handleBatteryLevelCharacteristic).catch(logError);
    }, []);

    useEffect(() => {
        if (batteryLevel.value !== null) {
            console.log("send batteryLevel to wherever needed: " + batteryLevel.value);
        }
    }, [batteryLevel.value]);

    return html`
        <${Service} heading="battery">
            ${batteryLevel === null ? null : html`<p class="battery-level">battery level: ${batteryLevel}</p>`}
        <//>
    `;
}


export {
    BatteryService,
    UUID,
    getState,
    getHandlers
};
