import {useEffect} from "preact/hooks";

import {POLAR_CHARACTERISTICS} from "../constants.js";


const getState = (initialValues = {}) => {
    return {};
};

const getHandlers = (state = getState()) => {
    return {};
};


const PolarDataCharacteristic = (props = {}) => {
    const {state = {}, handlers, serviceHandlers} = props;
    const {object: characteristic, features} = state;
    const logError = (e) => console.error(e);
    const handleControlPointError = (error) => {
        logError(`Sensor ${index} control point error: ${error}`);
    };

    const handleDataChanged = (event) => {
        //this.logger.log(`Sensor ${this.index}: PMD data MTU characteristic changed ${event}`);
        //this.parsePMDData(event.target.value, 14, 1); // the values 14 and 1 are specific to ECG data from Polar H10
        const featureCode = event.target.value.getUint8(0);
        features[featureCode].parseData(event.target.value, dataCallbackFn);
    };

    useEffect(() => {
        if (characteristic !== null) {
            if (characteristic.properties.notify) {
                characteristic.startNotifications();
            }
            characteristic.addEventListener("characteristicvaluechanged", handleDataChanged);
        }
    }, [characteristic]);

    return "TODO: Polar Data Characteristic view";

};

const UUID = POLAR_CHARACTERISTICS.PMD_DATA_MTU;


export {
    PolarDataCharacteristic,
    UUID,
    getState,
    getHandlers
};
