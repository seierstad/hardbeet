"use strict";


import {html, useState, useEffect} from "./preact-standalone.module.min.js";
import Service from "./service.js";
import PolarFeature, {ACTION as FEATURE_ACTION, reducer as featureReducer} from "./polar-feature.js";

import {
    POLAR_CHARACTERISTICS,
    POLAR_MEASUREMENT_DATA_SERVICE_UUID,
    MEASUREMENT_TYPE,
    CONTROL_POINT_REQUEST,
    OP_CODE,
    SETTING_LENGTH,
    CONTROL_POINT_RESPONSE_TYPE
} from "./polar-codes.js";

import {ACTION as STATUS_ACTION} from "./status.js";
import {
    parseFeatureReadResponse,
    parseControlPointResponse
} from "./polar-parsers.js";

const UUID = POLAR_MEASUREMENT_DATA_SERVICE_UUID;

const initialState = {
    features: []
};

const ACTION = {
    ...FEATURE_ACTION,
    POLAR_FEATURES_SUPPORTED: Symbol("POLAR_FEATURES_SUPPORTED")
};

const reducer = (state = initialState, action = {}) => {
    const {type, payload = {}} = action;
    const {measurementCode} = payload;
    const {features = []} = state;
    const featureIndex = features.findIndex(feature => feature.code === measurementCode);

    switch (type) {
        case ACTION.POLAR_FEATURES_SUPPORTED:
            return {
                ...state,
                features: [
                    ...features,
                    ...payload.featureSupport.filter(feature => feature.supported)
                ]
            };
    }

    if (Object.values(FEATURE_ACTION).indexOf(type) !== -1 && featureIndex !== -1) {
        return {
            ...state,
            features: [
                ...state.features.slice(0, featureIndex),
                featureReducer(state.features[featureIndex], action),
                ...state.features.slice(featureIndex + 1)
            ]
        };
    }

    return state;
};


function PolarService (props) {
    const {dispatch, state, sensorId, index} = props;
    const {service, features = []} = state;
    const [controlPointCharacteristic, setControlPointCharacteristic] = useState(null);
    const [dataCharacteristic, setDataCharacteristic] = useState(null);
    const [parameterRequest, setParameterRequest] = useState(null);

    const handleControlPointError = (error) => {
        dispatch({type: STATUS_ACTION.ERROR, payload: {text: `Sensor ${index} control point error: ` + error, timestamp: new Date()}});
    };

    const handleDataCharacteristicError = (error) => {
        dispatch({type: STATUS_ACTION.ERROR, payload: {text: `Sensor ${index} PMD Data characteristic error: ` + error, timestamp: new Date()}});
    };

    useEffect(() => {
        (async function () {
            await Promise.all([
                service.getCharacteristic(POLAR_CHARACTERISTICS.PMD_CONTROL_POINT).then(
                    c => setControlPointCharacteristic(c),
                    error => handleControlPointError(error)
                ),
                service.getCharacteristic(POLAR_CHARACTERISTICS.PMD_DATA_MTU).then(
                    c => setDataCharacteristic(c),
                    error => handleDataCharacteristicError(error)
                )
            ]);
        })();
    }, []);

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

            request !== null && controlPointCharacteristic.writeValue(request);
        }
    }, [parameterRequest]);

    const [parameterRequestInitialized, initializeParameterRequests] = useState(false);

    useEffect(() => {
        if (features.length !== 0 && parameterRequestInitialized) {
            setParameterRequest(getNextParameterRequest());
            initializeParameterRequests(false);
        }
    }, [features]);

    const handleControlPointChanged = (event) => {
        switch (event.target.value.getUint8(0)) {

            case CONTROL_POINT_RESPONSE_TYPE.FEATURE_READ:
                const support = parseFeatureReadResponse(event.target.value);
                initializeParameterRequests(true);
                dispatch({type: ACTION.POLAR_FEATURES_SUPPORTED, payload: {serviceUUID: UUID, sensorId, featureSupport: support}});
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
                        dispatch({type: ACTION.POLAR_FEATURE_MEASUREMENT_PARAMETERS, payload: {serviceUUID: UUID, sensorId, measurementCode, parameters}});
                        break;
                    }

                    case OP_CODE.START_MEASUREMENT: {
                        if (!error) {
                            dispatch({type: ACTION.POLAR_MEASUREMENT_START, payload: {serviceUUID: UUID, sensorId, measurementCode, parameters}});
                        } else {
                            dispatch({type: ACTION.POLAR_MEASUREMENT_ERROR, payload: {serviceUUID: UUID, sensorId, measurementCode, status, operation: opName}});
                        }
                        break;
                    }

                    case OP_CODE.STOP_MEASUREMENT: {
                        if (!error) {
                            dispatch({type: ACTION.POLAR_MEASUREMENT_STOP, payload: {sensorId, serviceUUID: UUID, measurementCode}});
                        } else {
                            dispatch({type: ACTION.POLAR_MEASUREMENT_ERROR, payload: {serviceUUID: UUID, sensorId, measurementCode, status, operation: opName}});
                        }
                        break;
                    }
                }

                break;
            default:
                dispatch({type: STATUS_ACTION.ERROR, payload: {text: "unknown control point response from sensor " + index, timestamp: new Date()}});

        }
    };


    useEffect(() => {
        if (controlPointCharacteristic !== null) {
            controlPointCharacteristic.startNotifications();
            controlPointCharacteristic.addEventListener("characteristicvaluechanged", handleControlPointChanged);
            controlPointCharacteristic.readValue();
            /*.then(
                response => setFeatureSupport(parseFeatureReadResponse(response)),
                error => console.log("error when parsing control point initial response: " + error)
            );*/
        }
    }, [controlPointCharacteristic]);

    const handleDataChanged = (event) => {
        //this.logger.log(`Sensor ${this.index}: PMD data MTU characteristic changed ${event}`);
        //this.parsePMDData(event.target.value, 14, 1); // the values 14 and 1 are specific to ECG data from Polar H10
        const featureCode = event.target.value.getUint8(0);
        features[featureCode].parseData(event.target.value, dataCallbackFn);
    };

    useEffect(() => {
        if (dataCharacteristic !== null) {
            if (dataCharacteristic.properties.notify) {
                dataCharacteristic.startNotifications();
            }
            dataCharacteristic.addEventListener("characteristicvaluechanged", handleDataChanged);
        }
    }, [dataCharacteristic]);

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
            controlPointCharacteristic.writeValueWithoutResponse(request);
        }
    };


    return html`
        <${Service} heading="polar data">
            ${controlPointCharacteristic !== null ? "control point initialized" : null}
            ${dataCharacteristic !== null ? "data initialized" : null}
            <div class="feature-support">
                <h3>features</h3>
                ${Object.entries(features).map(([code, {parameters}]) => html`
                    <${PolarFeature}
                        commandFn=${featureCommandHandler}
                        controlPoint=${controlPointCharacteristic}
                        featureCode=${code}
                        key=${code}
                        parameters=${parameters}
                    />
                `)} 
            </div>
        <//>

    `;
}

export default PolarService;

export {
    UUID,
    initialState,
    ACTION,
    reducer
};
