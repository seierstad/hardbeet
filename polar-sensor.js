import {
    POLAR_CHARACTERISTICS,
    POLAR_MEASUREMENT_DATA_SERVICE_UUID,
    POLAR_UUID1,
    POLAR_UUID2,
    POLAR_NAMES,
    POLAR_H10_UNDOCUMENTED_SERVICE,
    POLAR_ERROR_CODES,
    MEASUREMENT_TYPE,
    MEASUREMENT_NAME,
    SETTING_TYPE_NAME,
    SETTING_TYPE,
    SETTING_LENGTH,
    CONTROL_POINT_REQUEST,
    PMD_FLAG,
    OP_CODE,
    SETTING_VALUES,
    CONTROL_POINT_RESPONSE_TYPE
} from "./polar-codes.js";

import {
    parseFeatureReadResponse,
    parseControlPointResponse
} from "./polar-parsers.js";

import Sensor from "./sensor.js";
import PolarFeature from "./polar-feature.js";





class PolarSensor extends Sensor {
    constructor (device, index, logger = console, dataCallbackFn) {
        super(device, index, logger, dataCallbackFn);

        this.features = {};
        this.accProperties = {};
        this.ecgProperties = {};
        this._featureSupport = {};
        this._streamSettings = {};
        this.dataCallback = {};

        this.connectPmdService = this.connectPmdService.bind(this);
        this.featureCommandHandler = this.featureCommandHandler.bind(this);

        this.handlePMDControlPoint = this.handlePMDControlPoint.bind(this);
        this.handlePMDControlPointChanged = this.handlePMDControlPointChanged.bind(this);
        this.handlePMDDataMTUCharacteristic = this.handlePMDDataMTUCharacteristic.bind(this);
        this.handlePMDDataMTUCharacteristicChanged = this.handlePMDDataMTUCharacteristicChanged.bind(this);

        this.featuresElement = null;

        this.serviceDescriptors.push({
            id: POLAR_MEASUREMENT_DATA_SERVICE_UUID,
            connectFn: this.connectPmdService,
            errorFn: this.pmdServiceError
        });
    }


    connectPmdService (service) {
        this.pmdService = service;
        return Promise.all([
            service.getCharacteristic(POLAR_CHARACTERISTICS.PMD_CONTROL_POINT).then(this.handlePMDControlPoint, this.handlePMDControlPointError),
            service.getCharacteristic(POLAR_CHARACTERISTICS.PMD_DATA_MTU).then(this.handlePMDDataMTUCharacteristic, this.handlePMDDataMTUCharacteristicError)
        ]);
    }

    pmdServiceError (error) {
        this.logger.log(`${this.index}: Polar measurement data service error: ${error}`);
    }


    handlePMDControlPointChanged (event) {
        console.log({event});
        switch (event.target.value.getUint8(0)) {

            case CONTROL_POINT_RESPONSE_TYPE.FEATURE_READ:
                this.featureSupport = parseFeatureReadResponse(event.target.value);
                this.getParameters();
                break;

            case CONTROL_POINT_RESPONSE_TYPE.MEASUREMENT_CONTROL:
                const {
                    operation: {
                        code: opCode,
                        name: opName
                    },
                    measurement: {
                        code: measurementCode,
                        name
                    },
                    error,
                    status,
                    parameters
                } = parseControlPointResponse(event.target.value);

                switch (opCode) {
                    case OP_CODE.GET_MEASUREMENT_SETTINGS: {
                        this.features[measurementCode] = this.features[measurementCode] || {};
                        this.features[measurementCode].parameters = parameters;
                        break;
                    }
                    case OP_CODE.START_MEASUREMENT: {
                        if (!error) {
                            this.features[measurementCode].state = {
                                status: "running"
                            }
                        } else {
                            this.features[measurementCode].error = {status, operation: opName};
                        }
                        break;
                    }

                    case OP_CODE.STOP_MEASUREMENT: {
                        if (!error) {
                            this.features[measurementCode].state = {
                                status: "stopped"
                            }
                        } else {
                            this.features[measurementCode].error = {status, operation: opName};
                        }
                        break;
                    }
                }

                break;
            default:
                console.error("unknown control point response");
        }
    }


    async handlePMDControlPoint (controlPoint) {
        this.pmdControlPoint = controlPoint;
        controlPoint.addEventListener("characteristicvaluechanged", this.handlePMDControlPointChanged);

        //if (controlPoint.properties.notify) {
            await controlPoint.startNotifications();
        //}
        return controlPoint.readValue().then(
                parseFeatureReadResponse,
                error => console.error("error when parsing control point initial response: " + error)
            );
    }


    handlePMDControlPointError (error) {
        this.logger.log(`Sensor ${this.index} control point error: ` + error);
    }

    handlePMDDataMTUCharacteristicChanged (event) {
        //this.logger.log(`Sensor ${this.index}: PMD data MTU characteristic changed ${event}`);
        //this.parsePMDData(event.target.value, 14, 1); // the values 14 and 1 are specific to ECG data from Polar H10
        const featureCode = event.target.value.getUint8(0);
        this.features[featureCode].parseData(event.target.value, this.dataCallbackFn);
    }


    handlePMDDataMTUCharacteristic (characteristic) {
        console.log("legger til datakildehåndtering");
        if (characteristic.properties.notify) {
            characteristic.startNotifications();
        }
        characteristic.addEventListener("characteristicvaluechanged", this.handlePMDDataMTUCharacteristicChanged);
    }


    handlePMDDataMTUCharacteristicError (event) {
        this.logger.log(`Sensor ${this.index} PMD Data characteristic error: ` + error);
    }


    setFeatureDataCallback (feature, func) {
        this.dataCallback[feature] = func;
    }


    async getParameters () {
        if (this.featureSupport[MEASUREMENT_TYPE.ECG]) {
            await this.pmdControlPoint.writeValue(CONTROL_POINT_REQUEST.GET_ECG_STREAM_SETTINGS);
        }
        if (this.featureSupport[MEASUREMENT_TYPE.PPG]) {
            await this.pmdControlPoint.writeValue(CONTROL_POINT_REQUEST.GET_PPG_STREAM_SETTINGS);
        }
        if (this.featureSupport[MEASUREMENT_TYPE.ACCELERATION]) {
            await this.pmdControlPoint.writeValue(CONTROL_POINT_REQUEST.GET_ACC_STREAM_SETTINGS);
        }
        if (this.featureSupport[MEASUREMENT_TYPE.PP_INTERVAL]) {
            await this.pmdControlPoint.writeValue(CONTROL_POINT_REQUEST.GET_PPI_STREAM_SETTINGS);
        }
        if (this.featureSupport[MEASUREMENT_TYPE.GYROSCOPE]) {
            await this.pmdControlPoint.writeValue(CONTROL_POINT_REQUEST.GET_GYRO_STREAM_SETTINGS);
        }
        if (this.featureSupport[MEASUREMENT_TYPE.MAGNETOMETER]) {
            await this.pmdControlPoint.writeValue(CONTROL_POINT_REQUEST.GET_MAG_STREAM_SETTINGS);
        }
    }

    getParametersForFeature (feature) {
        Object.entries(this.featureSupport).map(([a, b]) => {
            let featureElement = this.featuresElement.querySelector(`.feature-${a}`);
            if (!featureElement) {
                featureElement = document.createElement("li");
                featureElement.classList.add(`feature-${a}`);
                const featureText = document.createElement("h4");
                featureText.innerText = a;
                featureElement.appendChild(featureText);
                this.featuresElement.querySelector("ul").appendChild(featureElement);
            }

            featureElement.classList.add(b ? "supported" : "not-supported");
            featureElement.classList.remove(b ? "not-supported" : "supported");


            const featureDetails = document.createElement("div");
            featureDetails.innerText = b;
            if (b) {
                const startButton = document.createElement("button");
                startButton.innerText = "start";
                const stopButton = document.createElement("button");
                stopButton.innerText = "stop";
                featureDetails.appendChild(startButton);
                featureDetails.appendChild(stopButton);
            }
            featureElement.appendChild(featureDetails);
        });
    }

    featureCommandHandler (featureId, operationCode, parameters) {
        console.log({featureId, operationCode, parameters});

        let request;

        switch (operationCode) {
            case OP_CODE.START_MEASUREMENT:
                request = new ArrayBuffer(2 + (4 * parameters.length));
                const view = new DataView(request);
                let i = 0;
                view.setUint8(i++, operationCode);
                view.setUint8(i++, featureId);
                parameters.forEach(([parameter, value]) => {
                    view.setUint8(i++, parameter);
                    view.setUint8(i++, SETTING_LENGTH);
                    view.setUint16(i, value, true);
                    i += 2;
                });
                break;
            case OP_CODE.STOP_MEASUREMENT:
                request = Uint8Array.of(operationCode, featureId);
                break;
            default:
                console.error("unknown operation code: " + operationCode);
        }

        console.log({request});

        this.pmdControlPoint.writeValueWithoutResponse(request);

    }

    set streamSettings (streamSettings) {
        this._streamSettings = streamSettings;
        console.log({streamSettings});
    }

    get streamSettings () {
        return this._streamSettings;
    }

    set featureSupport (support) {
        if (this.featuresElement === null) {
            this.featuresElement = document.createElement("div");
            this.featuresElement.classList.add("feature-support");
            this.rootElement.appendChild(this.featuresElement);

            const heading = document.createElement("h3");
            heading.innerText = "features";
            this.featuresElement.appendChild(heading);
            const list = document.createElement("ul");
            this.featuresElement.appendChild(list);

            Object.entries(support)
                .filter(([key, supported]) => !!supported)
                .forEach(([key]) => {

                    if (!this.features[key]) {
                        this.features[key] = new PolarFeature(key, this.featureCommandHandler);
                        this.featuresElement.appendChild(this.features[key].rootElement);
                    }
                });
        }
        this._featureSupport = {
            ...support
        };
    }

    get featureSupport () {
        return this._featureSupport;
    }

}


export default PolarSensor;
