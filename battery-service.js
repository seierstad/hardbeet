"use strict";

import Service from "./service.js";

class BatteryService extends Service {
    constructor (service) {
        super(service, "battery");

        this.handleBatteryLevelCharacteristic = this.handleBatteryLevelCharacteristic.bind(this);
        this.batteryLevelElement = null;
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
        if (this.batteryLevelElement === null) {
            this.batteryLevelElement = document.createElement("p");
            this.batteryLevelElement.classList.add("battery-level");
            this.rootElement.appendChild(this.batteryLevelElement);
        }
        this.batteryLevelElement.innerText = "battery level: " + batteryLevel;
    }
}

export default BatteryService;
