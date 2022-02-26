"use strict";


import {html, Component} from "./preact-standalone.module.min.js";
import Service from "./service.js";
import PolarFeature from "./polar-feature.js";

import {
    POLAR_CHARACTERISTICS,
    POLAR_MEASUREMENT_DATA_SERVICE_UUID,
    MEASUREMENT_TYPE,
    CONTROL_POINT_REQUEST,
    OP_CODE,
    SETTING_LENGTH,
    CONTROL_POINT_RESPONSE_TYPE
} from "./polar-codes.js";

import {
    parseFeatureReadResponse,
    parseControlPointResponse
} from "./polar-parsers.js";

const UUID = POLAR_MEASUREMENT_DATA_SERVICE_UUID;


class PolarService extends Component {
    constructor ({service}) {
        super();
        this.service = service;

        this.handleControlPointCharacteristic = this.handleControlPointCharacteristic.bind(this);
        this.handleControlPointError = this.handleControlPointError.bind(this);
        this.handleControlPointChanged = this.handleControlPointChanged.bind(this);

        this.handleDataCharacteristic = this.handleDataCharacteristic.bind(this);
        this.handleDataChanged = this.handleDataChanged.bind(this);
        this.handleDataError = this.handleDataError.bind(this);

        this.featureCommandHandler = this.featureCommandHandler.bind(this);

        this.parameterRequest = 0;

        this.state = {
            features: {},
            controlPointInitialized: false,
            dataInitialized: false
        };

    }

    setFeatureDataCallback (feature, func) {
        this.dataCallback[feature] = func;
    }


    componentDidMount () {
        this.initCharacteristics();
    }

    render (props, {features, controlPointInitialized, dataInitialized}) {

        return html`
            <${Service} heading="polar data">
                ${controlPointInitialized ? "control point initialized" : null}
                ${dataInitialized ? "data initialized" : null}
                <div class="feature-support">
                    <h3>features</h3>
                    <ul>
                        ${Object.entries(features).map(([code, {parameters}]) => html`
                            <${PolarFeature}
                                commandFn=${this.featureCommandHandler}
                                controlPoint=${this.controlPoint}
                                dataCallbackFn=${this.dataCallbackFn}
                                featureCode=${code}
                                key=${code}
                                parameters=${parameters}
                            />
                        `)} 
                    </ul>
                </div>
            <//>
        `;
    }

    initCharacteristics () {
        return Promise.all([
            this.service.getCharacteristic(POLAR_CHARACTERISTICS.PMD_CONTROL_POINT).then(this.handleControlPointCharacteristic, this.handleControlPointError),
            this.service.getCharacteristic(POLAR_CHARACTERISTICS.PMD_DATA_MTU).then(this.handleDataCharacteristic, this.handleDataCharacteristicError)
        ]);
    }

    async handleControlPointCharacteristic (characteristic) {
        this.controlPoint = characteristic;
        characteristic.addEventListener("characteristicvaluechanged", this.handleControlPointChanged);

        //if (characteristic.properties.notify) {
        await characteristic.startNotifications();
        //}

        this.setState({controlPointInitialized: true});
        return characteristic.readValue().then(
            parseFeatureReadResponse,
            error => console.log("error when parsing control point initial response: " + error)
        );
    }

    handleControlPointError (error) {
        console.log(`Sensor ${this.index} control point error: ` + error);
    }


    handleDataCharacteristic (characteristic) {
        console.log("legger til datakildehåndtering");
        if (characteristic.properties.notify) {
            characteristic.startNotifications();
        }
        characteristic.addEventListener("characteristicvaluechanged", this.handleDataChanged);
    }

    handleDataChanged (event) {
        //this.logger.log(`Sensor ${this.index}: PMD data MTU characteristic changed ${event}`);
        //this.parsePMDData(event.target.value, 14, 1); // the values 14 and 1 are specific to ECG data from Polar H10
        const featureCode = event.target.value.getUint8(0);
        this.features[featureCode].parseData(event.target.value, this.dataCallbackFn);
    }

    handleDataError (error) {
        this.logger.log(`Sensor ${this.index} PMD Data characteristic error: ` + error);
    }

    handleControlPointChanged (event) {
        switch (event.target.value.getUint8(0)) {

            case CONTROL_POINT_RESPONSE_TYPE.FEATURE_READ:
                const newState = {
                    ...this.state.features
                };

                const features = parseFeatureReadResponse(event.target.value);
                for (const code in features) {
                    if (features[code].supported) {
                        newState[code] = features[code];
                    }
                }

                this.state.features = newState;
                this.getParameters();
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
                        this.parameterRequest += 1;
                        this.setState({
                            features: {
                                ...this.state.features,
                                [measurementCode]: {
                                    ...this.state.features[measurementCode],
                                    parameters
                                }
                            }
                        });
                        this.getParameters();
                        break;
                    }

                    case OP_CODE.START_MEASUREMENT: {
                        if (!error) {
                            this.setState({
                                features: {
                                    ...this.state.features,
                                    [measurementCode]: {
                                        ...this.state.features[measurementCode],
                                        status: "running"
                                    }
                                }
                            });
                        } else {
                            this.setState({
                                features: {
                                    ...this.state.features,
                                    [measurementCode]: {
                                        ...this.state.features[measurementCode],
                                        error: {
                                            status,
                                            operation: opName
                                        }
                                    }
                                }
                            });
                        }
                        break;
                    }

                    case OP_CODE.STOP_MEASUREMENT: {
                        if (!error) {
                            this.setState({
                                features: {
                                    ...this.state.features,
                                    [measurementCode]: {
                                        ...this.state.features[measurementCode],
                                        status: "stopped"
                                    }
                                }
                            });
                        } else {
                            this.setState({
                                features: {
                                    ...this.state.features,
                                    [measurementCode]: {
                                        ...this.state.features[measurementCode],
                                        error: {
                                            status,
                                            operation: opName
                                        }
                                    }
                                }
                            });
                        }
                        break;
                    }
                }

                break;
            default:
                this.logger.log("unknown control point response");
        }
    }

    featureCommandHandler (featureId, operationCode, parameters) {
        let request;

        switch (operationCode) {
            case OP_CODE.START_MEASUREMENT:
                request = new ArrayBuffer(2 + (4 * parameters.length));
                const view = new DataView(request);
                let i = 0;
                view.setUint8(i, operationCode);
                i += 1;
                view.setUint8(i, featureId);
                i += 1;
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
                this.logger.error("unknown operation code: " + operationCode);
        }

        this.controlPoint.writeValueWithoutResponse(request);
    }

    getParameters () {
        if (this.parameterRequest === 0) {
            if (this.state.features[MEASUREMENT_TYPE.ECG]) {
                this.controlPoint.writeValue(CONTROL_POINT_REQUEST.GET_ECG_STREAM_SETTINGS);
            } else {
                this.parameterRequest += 1;
            }
        }

        if (this.parameterRequest === 1) {
            if (this.state.features[MEASUREMENT_TYPE.PPG]) {
                this.controlPoint.writeValue(CONTROL_POINT_REQUEST.GET_PPG_STREAM_SETTINGS);
            } else {
                this.parameterRequest += 1;
            }
        }

        if (this.parameterRequest === 2) {
            if (this.state.features[MEASUREMENT_TYPE.ACCELERATION]) {
                this.controlPoint.writeValue(CONTROL_POINT_REQUEST.GET_ACC_STREAM_SETTINGS);
            } else {
                this.parameterRequest += 1;
            }
        }

        if (this.parameterRequest === 3) {
            if (this.state.features[MEASUREMENT_TYPE.PP_INTERVAL]) {
                this.controlPoint.writeValue(CONTROL_POINT_REQUEST.GET_PPI_STREAM_SETTINGS);
            } else {
                this.parameterRequest += 1;
            }
        }

        if (this.parameterRequest === 4) {
            if (this.state.features[MEASUREMENT_TYPE.GYROSCOPE]) {
                this.controlPoint.writeValue(CONTROL_POINT_REQUEST.GET_GYRO_STREAM_SETTINGS);
            } else {
                this.parameterRequest += 1;
            }
        }

        if (this.parameterRequest === 5) {
            if (this.state.features[MEASUREMENT_TYPE.MAGNETOMETER]) {
                this.controlPoint.writeValue(CONTROL_POINT_REQUEST.GET_MAG_STREAM_SETTINGS);
            }
        }
    }

}

export default PolarService;

export {UUID};
