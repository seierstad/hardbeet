import {useEffect, useMemo, useState} from "preact/hooks";
import {signal} from "@preact/signals";
import {html} from "htm/preact";

import {Characteristic} from "../../characteristic/characteristic.js";

import {getState as getFeaturesState} from "../feature/state.js";

import {
    POLAR_CHARACTERISTICS,
    MEASUREMENT_TYPE,
    CONTROL_POINT_REQUEST,
    OP_CODE,
    SETTING_LENGTH,
    CONTROL_POINT_RESPONSE_TYPE
} from "../constants.js";


const getState = (initialValues = {}) => {
    const {features = []} = initialValues;
    return {
        features: getFeaturesState(features),
        polarControlPointSpecific: signal(null)
    };
};

const getHandlers = (state = getState()) => {
    return {};
};


const PolarControlPointCharacteristic = (props = {}) => {
    const {state = {}, getHandlers} = props;
    const {object: characteristic, features} = state;
    const handlers = useMemo(() => getHandlers(state));
    const logError = (e) => console.error(e);
    const handleControlPointError = (error) => {
        logError(`Sensor ${index} control point error: ${error}`);
    };
    const [parameterRequest, setParameterRequest] = useState(null);

    useEffect(() => {
        if (parameterRequest !== null) {
            let request = null;

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

            request !== null && characteristic.writeValue(request);
        }
    }, [parameterRequest]);


    const handleControlPointChanged = (event) => {
        switch (event.target.value.getUint8(0)) {

            case CONTROL_POINT_RESPONSE_TYPE.FEATURE_READ:
                const support = parseFeatureReadResponse(event.target.value);
                initializeParameterRequests(true);
                //dispatch({type: ACTION.POLAR_FEATURES_SUPPORTED, payload: {serviceUUID: UUID, sensorId, featureSupport: support}});
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

                switch (opCode) {
                    case OP_CODE.GET_MEASUREMENT_SETTINGS: {
                        setParameterRequest(getNextParameterRequest());
                        //dispatch({type: ACTION.POLAR_FEATURE_MEASUREMENT_PARAMETERS, payload: {serviceUUID: UUID, sensorId, measurementCode, parameters}});
                        break;
                    }

                    case OP_CODE.START_MEASUREMENT: {
                        if (!error) {
                            //dispatch({type: ACTION.POLAR_MEASUREMENT_START, payload: {serviceUUID: UUID, sensorId, measurementCode, parameters}});
                        } else {
                            //dispatch({type: ACTION.POLAR_MEASUREMENT_ERROR, payload: {serviceUUID: UUID, sensorId, measurementCode, status, operation: opName}});
                        }
                        break;
                    }

                    case OP_CODE.STOP_MEASUREMENT: {
                        if (!error) {
                            //dispatch({type: ACTION.POLAR_MEASUREMENT_STOP, payload: {sensorId, serviceUUID: UUID, measurementCode}});
                        } else {
                            //dispatch({type: ACTION.POLAR_MEASUREMENT_ERROR, payload: {serviceUUID: UUID, sensorId, measurementCode, status, operation: opName}});
                        }
                        break;
                    }
                }

                break;
            default:
                //dispatch({type: STATUS_ACTION.ERROR, payload: {text: "unknown control point response from sensor " + index, timestamp: new Date()}});

        }
    };


    useEffect(() => {
        if (characteristic !== null) {
            characteristic.startNotifications();
            characteristic.addEventListener("characteristicvaluechanged", handleControlPointChanged);
            characteristic.readValue();
            /*.then(
                response => setFeatureSupport(parseFeatureReadResponse(response)),
                error => console.log("error when parsing control point initial response: " + error)
            );*/
        }
    }, [characteristic]);


    const getNextParameterRequest = () => {
        if (features.length !== 0) {
            if (parameterRequest === null) {
                return features[0].code;
            }

            const currentIndex = features.findIndex(feature => feature.code === parameterRequest);

            if (currentIndex === features.length - 1 || currentIndex === -1) {
                return null;
            }

            return features[currentIndex + 1].code;
        }
        console.log("nullllll features?????????");
        return null;
    };


    const [parameterRequestInitialized, initializeParameterRequests] = useState(false);

    useEffect(() => {
        if (features.value.length !== 0 && parameterRequestInitialized) {
            setParameterRequest(getNextParameterRequest());
            initializeParameterRequests(false);
        }
    }, [features.value]);

    const featureCommandHandler = (featureId, operationCode, parameters) => {
        let request = null;

        switch (operationCode) {
            case OP_CODE.START_MEASUREMENT:
                request = new ArrayBuffer(2 + (4 * parameters.length));
                const view = new DataView(request);

                view.setUint8(0, operationCode);
                view.setUint8(1, featureId);

                let i = 2;
                parameters.forEach(([parameter, value]) => {
                    view.setUint8(i, parameter);
                    i += 1;
                    view.setUint8(i, SETTING_LENGTH);
                    i += 1;
                    view.setUint16(i, value, true);
                    i += 2;
                });
                break;

            case OP_CODE.STOP_MEASUREMENT:
                request = Uint8Array.of(operationCode, featureId);
                break;

            default:
                dispatch({type: STATUS_ACTION.ERROR, payload: {text: `unknown operation code: ${operationCode}`, timestamp: new Date()}});
        }

        if (request !== null) {
            characteristic.writeValueWithoutResponse(request);
        }
    };


    return html`
        <${Characteristic} state=${state} handlers=${handlers}>
            TODO: Control point view
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
