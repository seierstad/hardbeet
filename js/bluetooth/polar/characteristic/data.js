import {useEffect, useContext} from "preact/hooks";

import {AppHandlersContext} from "hardbeet";

import {POLAR_CHARACTERISTICS} from "../constants.js";


const getState = () => {
    return {};
};

const getHandlers = () => {
    return {};
};


const PolarDataCharacteristic = (props = {}) => {
    const {state = {}, handlers, serviceHandlers, features, dataParserFunction} = props;
    const {log: {log} = {}} = useContext(AppHandlersContext);
    const {object: characteristic} = state;

    const handleDataCharacteristicError = (error) => {
        logError(`Polar PMD Data characteristic error: ${error}`);
    };

    const handleDataChanged = (event) => {
        dataParserFunction(event.target.value);
    };

    useEffect(() => {
        if (characteristic !== null) {
            const {properties: {notify, indicate} = {}} = characteristic;

            if (notify || indicate) {
                characteristic.addEventListener("characteristicvaluechanged", handleDataChanged);
                characteristic.startNotifications();

                return () => {
                    characteristic.stopNotifications();
                    characteristic.removeEventListener("characteristicvaluechanged", handleDataChanged);
                };
            }
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
