"use strict";

import {html, Component} from "./preact-standalone.module.min.js";
import Service from "./service.js";
import {GATT_SERVICE_UUID} from "./GATT_constants.js";

const UUID = GATT_SERVICE_UUID.BATTERY;


class BatteryService extends Component {
    constructor ({service}) {
        super();

        this.service = service;
        this.handleBatteryLevelCharacteristic = this.handleBatteryLevelCharacteristic.bind(this);

        this.state = {
            batteryLevel: null
        };
    }

    render () {
        return html`
            <${Service} heading="battery">
                ${this.state.batteryLevel === null ? null : html`<p class="battery-level">battery level: ${this.state.batteryLevel}</p>`}
            <//>
        `;
    }

    componentDidMount () {
        this.initCharacteristics();
    }

    initCharacteristics () {
        return Promise.all([
            this.service.getCharacteristic("battery_level").then(this.handleBatteryLevelCharacteristic)
        ]);
    }

    handleBatteryLevelCharacteristic (characteristic) {
        if (characteristic === null) {
            this.batteryLevel = "unknown";
            return Promise.resolve();
        }
        characteristic.addEventListener("characteristicvaluechanged", this.handleBatteryLevelChanged);
        return Promise.all([
            characteristic.readValue().then(batteryLevelData => this.batteryLevel = batteryLevelData.getUint8(0)),
            characteristic.startNotifications()
        ]);
    }

    handleBatteryLevelChanged (event) {
        this.batteryLevel = event.target.value.getUint8(0);
    }

    set batteryLevel (batteryLevel) {
        this.setState({batteryLevel});
    }
}

export default BatteryService;

export {
    UUID
};
