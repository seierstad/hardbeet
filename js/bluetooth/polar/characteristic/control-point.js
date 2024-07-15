import {useEffect, useState, useContext} from "preact/hooks";
import {signal} from "@preact/signals";
import {html} from "htm/preact";

import {AppHandlersContext} from "hardbeet";

import {Characteristic} from "../../characteristic/characteristic.js";

import {parseFeatureReadResponse, parseControlPointResponse} from "../parsers.js";

import {
    POLAR_CHARACTERISTICS,
    MEASUREMENT_TYPE,
    MEASUREMENT_NAME,
    CONTROL_POINT_REQUEST,
    OP_CODE,
    SETTING_LENGTH,
    CONTROL_POINT_RESPONSE_TYPE
} from "../constants.js";


const getState = (initialValues = {}) => {
    return {
        polarControlPointSpecific: signal(null)
    };
};

const getHandlers = (state = getState()) => {
    return {};
};


const PolarControlPointCharacteristic = (props = {}) => {
    const {state = {}, handlers, serviceHandlers, features} = props;
    const {object: characteristic} = state;
    const {addFeature, startMeasurement, stopMeasurement} = serviceHandlers;
    const {log: {log, logError} = {}} = useContext(AppHandlersContext);

    const [featureSupport, setFeatureSupport] = useState(null);
    const [parameterRequest, setParameterRequest] = useState(null);


    const handleControlPointError = (error) => {
        logError(`Polar control point error: ${error}`);
    };

    const getNextFeatureCode = () => {
        if (featureSupport !== null) {
            const nextIndex = (parameterRequest === null) ? 0 : featureSupport.indexOf(parameterRequest) + 1;
            return (nextIndex < featureSupport.length) ? featureSupport[nextIndex] : null;
        }
        return null;
    };

    const controlPointChangeHandler = (event) => {
        const messageType = event.target.value.getUint8(0);

        switch (messageType) {

            case CONTROL_POINT_RESPONSE_TYPE.FEATURE_READ:
                const support = parseFeatureReadResponse(event.target.value);
                setFeatureSupport(support.filter(f => f.supported).map(f => f.code));
                break;

            case CONTROL_POINT_RESPONSE_TYPE.MEASUREMENT_CONTROL:
                const {
                    operation: {
                        code: opCode,
                        name: opName
                    },
                    measurement: {
                        code: measurementCode
                    },
                    error,
                    status,
                    parameters
                } = parseControlPointResponse(event.target.value);

                if (!error) {
                    switch (opCode) {
                        case OP_CODE.GET_MEASUREMENT_SETTINGS:
                            addFeature({code: measurementCode, parameters});
                            break;

                        case OP_CODE.START_MEASUREMENT:
                            startMeasurement(measurementCode, parameters);
                            break;

                        case OP_CODE.STOP_MEASUREMENT:
                            stopMeasurement(measurementCode);
                            break;

                        default:
                            logError(`unknown measurement operation code: ${opCode}`);


                    }
                } else {
                    logError(`measurement ${measurementCode}: error during operation ${opName}: ${status}`);
                }
                break;

            default:
                logError(`unknown control point response from Polar sensor ${messageType}`);

        }
    };


    useEffect(() => {
        if (characteristic !== null) {
            const {
                properties: {
                    read,
                    write,
                    notify,
                    indicate
                } = {}
            } = characteristic;

            characteristic.addEventListener("characteristicvaluechanged", controlPointChangeHandler);

            if (read) {
                characteristic.readValue();
            }
            if (notify || indicate) {
                characteristic.startNotifications();
            }
        }
    }, [characteristic]);


    useEffect(() => {
        if (parameterRequest !== null) {
            let request = null;
            log(`initializing measurement: ${MEASUREMENT_NAME[parameterRequest]}`);

            switch (parameterRequest) {

                case MEASUREMENT_TYPE.ECG:
                    request = CONTROL_POINT_REQUEST.GET_ECG_STREAM_SETTINGS;
                    break;
                case MEASUREMENT_TYPE.PPG:
                    request = CONTROL_POINT_REQUEST.GET_PPG_STREAM_SETTINGS;
                    break;
                case MEASUREMENT_TYPE.ACCELERATION:
                    request = CONTROL_POINT_REQUEST.GET_ACC_STREAM_SETTINGS;
                    break;
                case MEASUREMENT_TYPE.PP_INTERVAL:
                    request = CONTROL_POINT_REQUEST.GET_PPI_STREAM_SETTINGS;
                    break;
                case MEASUREMENT_TYPE.GYROSCOPE:
                    request = CONTROL_POINT_REQUEST.GET_GYRO_STREAM_SETTINGS;
                    break;
                case MEASUREMENT_TYPE.MAGNETOMETER:
                    request = CONTROL_POINT_REQUEST.GET_MAG_STREAM_SETTINGS;
                    break;
            }

            if (request !== null) {
                characteristic.writeValue(request)
                    .then(() => setParameterRequest(getNextFeatureCode()));
            }
        }
    }, [parameterRequest]);


    useEffect(() => {
        if (featureSupport !== null) {
            setParameterRequest(getNextFeatureCode());
        }
    }, [featureSupport]);

    return html`
        <h6>Control point view</h6>
            <${Characteristic} state=${state} handlers=${handlers}>
        <//>
    `;

};


const UUID = POLAR_CHARACTERISTICS.PMD_CONTROL_POINT;

export {
    PolarControlPointCharacteristic,
    UUID,
    getState,
    getHandlers
};
