"use strict";

import {
    POLAR_MEASUREMENT_DATA_SERVICE_UUID
} from "./polar-codes.js";

import Sensor from "./sensor.js";


class PolarSensor extends Sensor {
    constructor (props) {
        super(props);

        this.connectPmdService = this.connectPmdService.bind(this);

        this.serviceDescriptors.push({
            id: POLAR_MEASUREMENT_DATA_SERVICE_UUID,
            connectFn: this.connectPmdService,
            errorFn: this.pmdServiceError
        });
    }

    connectPmdService (service) {
        this.pmdService = service;
    }

    pmdServiceError (error) {
        this.logger.log(`${this.index}: Polar measurement data service error: ${error}`);
    }
}


export default PolarSensor;
