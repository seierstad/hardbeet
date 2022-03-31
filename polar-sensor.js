"use strict";

import {
    POLAR_MEASUREMENT_DATA_SERVICE_UUID
} from "./polar-codes.js";

import Sensor from "./sensor.js";

function PolarSensor (props) {
    const additionalServices = [{
        id: POLAR_MEASUREMENT_DATA_SERVICE_UUID,
        connectFn: () => console.log("brukes denne????"),
        errorFn: () => console.log("her må det debugges...")
    }];

    return Sensor({...props, additionalServices});
}

export default PolarSensor;
