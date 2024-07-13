import {signal} from "@preact/signals";
import {useLayoutEffect, useContext, useMemo} from "preact/hooks";
import {html} from "htm/preact";

import {AppHandlersContext} from "hardbeet";

import {GATT_SERVICE_UUID} from "../GATT_constants.js";
import {Characteristics} from "../characteristic/characteristics.js";

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
    const {object: service = {}, batteryLevel, characteristics = {value: []}} = state;
    const handlers = useMemo(() => getHandlers(state));
    const {log: {logError} = {}} = useContext(AppHandlersContext);

    const handleBatteryLevelChanged = (event) => handlers.setBatteryLevel(event.target.value.getUint8(0));

    const handleBatteryLevelCharacteristic = (characteristic) => {
        const {
            properties: {
                notify,
                read
            } = {}
        } = characteristic;

        if (read) {
            characteristic.readValue().then(batteryLevelData => handlers.setBatteryLevel(batteryLevelData.getUint8(0)));
        }

        if (notify) {
            characteristic.addEventListener("characteristicvaluechanged", handleBatteryLevelChanged);
            characteristic.startNotifications();
        }
    };

    useLayoutEffect(() => {
        service.getCharacteristic("battery_level").then(handlers.addCharacteristic).catch(logError);
    }, []);

    useLayoutEffect(() => {
        if (characteristics.value.length > 0) {
            handleBatteryLevelCharacteristic(characteristics.value[0].object);
        }
    }, [characteristics.value]);

    useLayoutEffect(() => {
        if (batteryLevel.value !== null) {
            console.log("send batteryLevel to wherever needed: " + batteryLevel.value);
        }
    }, [batteryLevel.value]);

    return html`
        <${Service} heading="battery">
            ${batteryLevel === null ? null : html`<p class="battery-level">battery level: ${batteryLevel}</p>`}
        <//>
    `;
};


export {
    BatteryService,
    UUID,
    getState,
    getHandlers
};
