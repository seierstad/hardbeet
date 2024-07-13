import {Device} from "../device/device.js";

import {POLAR_MEASUREMENT_DATA_SERVICE_UUID} from "./constants.js";


const PolarSensor = props => {
    const additionalServices = [{
        id: POLAR_MEASUREMENT_DATA_SERVICE_UUID,
        connectFn: () => console.log("brukes denne????"),
        errorFn: () => console.log("her må det debugges...")
    }];

    return Device({...props, additionalServices});
};


export {
    PolarSensor
};
