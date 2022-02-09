"use strict";

import Service from "./service.js";

class DeviceInformation extends Service {
    constructor (service) {
        super(service, "device information");

        this.deviceInfoProperties = {};
        this.initCharacteristics();
    }

    initCharacteristics () {
        return Promise.all([
            this.service.getCharacteristic("battery_level").then(this.handleBatteryLevelCharacteristic)
        ]);
    }
}

export default DeviceInformation;
