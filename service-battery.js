"use strict";

import {html, useState, useEffect} from "./preact-standalone.module.min.js";
import Service from "./service.js";
import {GATT_SERVICE_UUID} from "./GATT_constants.js";

const UUID = GATT_SERVICE_UUID.BATTERY;


function BatteryService (props) {
    const {service} = props;

    const [batteryLevel, setBatteryLevel] = useState(null);

    const handleBatteryLevelChanged = (event) => setBatteryLevel(event.target.value.getUint8(0));

    const handleBatteryLevelCharacteristic = (characteristic) => {
        if (characteristic === null) {
            setBatteryLevel("unknown");
            return Promise.resolve();
        }
        characteristic.addEventListener("characteristicvaluechanged", handleBatteryLevelChanged);
        return Promise.all([
            characteristic.readValue().then(batteryLevelData => setBatteryLevel(batteryLevelData.getUint8(0))),
            characteristic.startNotifications()
        ]);
    };

    useEffect(() => {
        service.getCharacteristic("battery_level").then(handleBatteryLevelCharacteristic)
    }, []);

    useEffect(() => {
        console.log("send batteryLevel to wherever needed: " + batteryLevel);
    }, [batteryLevel]);

    return html`
        <${Service} heading="battery">
            ${batteryLevel === null ? null : html`<p class="battery-level">battery level: ${batteryLevel}</p>`}
        <//>
    `;
}

export default BatteryService;

export {
    UUID
};
