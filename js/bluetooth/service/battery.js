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


    useLayoutEffect(() => {
        service.getCharacteristics().then(handlers.addCharacteristics).catch(logError);
    }, []);

    useLayoutEffect(() => {
        if (batteryLevel.value !== null) {
            console.log("send batteryLevel to wherever needed: " + batteryLevel.value);
        }
    }, [batteryLevel.value]);

    return html`
        <${Service} heading="battery">
            <${Characteristics} state=${characteristics} serviceHandlers=${handlers} getHandlers=${handlers.getCharacteristicHandlers} />
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
