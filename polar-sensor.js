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
    CONTROL_POINT_REQUEST,
    PMD_FLAG,
    OP_CODE,
    SETTING_VALUES,
    CONTROL_POINT_RESPONSE_TYPE
} from "./polar-codes.js";

import {
    parseMeasurementData,
    parseFeatureReadResponse,
    parseControlPointResponse
} from "./polar-parsers.js";

import Sensor from "./sensor.js";
import PolarFeature from "./polar-feature.js";



class PolarSensor extends Sensor {
    constructor (device, index, logger = console) {
        super(device, index, logger);

        this.features = {};
        this.accProperties = {};
        this.ecgProperties = {};
        this._featureSupport = {};
        this._streamSettings = {};

        this.connectPmdService = this.connectPmdService.bind(this);

        this.handlePMDControlPoint = this.handlePMDControlPoint.bind(this);
        this.handlePMDControlPointChanged = this.handlePMDControlPointChanged.bind(this);
        this.handlePMDDataMTUCharacteristic = this.handlePMDDataMTUCharacteristic.bind(this);
        this.handlePMDDataMTUCharacteristicChanged = this.handlePMDDataMTUCharacteristicChanged.bind(this);

        this.testRequestToControlPoint = this.testRequestToControlPoint.bind(this);
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
        switch (event.target.value.getUint8(0)) {
            case CONTROL_POINT_RESPONSE_TYPE.FEATURE_READ:
                this.featureSupport = parseFeatureReadResponse(event.target.value);
                this.getParameters();
                break;
            case CONTROL_POINT_RESPONSE_TYPE.MEASUREMENT_CONTROL:
                const {type, ...parsedResponse} = parseControlPointResponse(event.target.value);

                if (type === "parameterMap") {
                    Object.entries(parsedResponse).forEach(([key, value]) => {
                        this.features[key] = this.features[key] || {};
                        this.features[key].parameters = value;
                        this.updateFeatureUI(key);
                    });
                }
                break;
            default:
                console.error("unknown control point response");
        }
    }


    handlePMDControlPoint (controlPoint) {
        this.pmdControlPoint = controlPoint;


        this.rootElement.addEventListener("click", this.testRequestToControlPoint);
        controlPoint.addEventListener("characteristicvaluechanged", this.handlePMDControlPointChanged);

        return controlPoint.startNotifications().then(controlPoint => controlPoint.readValue()).then(parseFeatureReadResponse);
    }


    handlePMDControlPointError (error) {
        this.logger.log(`Sensor ${this.index} control point error: ` + error);
    }

    handlePMDDataMTUCharacteristicChanged (event) {
        //this.logger.log(`Sensor ${this.index}: PMD data MTU characteristic changed ${event}`);
        //this.parsePMDData(event.target.value, 14, 1); // the values 14 and 1 are specific to ECG data from Polar H10
        console.log(parseMeasurementData(event.target.value, {}));
    }


    handlePMDDataMTUCharacteristic (characteristic) {
        characteristic.addEventListener("characteristicvaluechanged", this.handlePMDDataMTUCharacteristicChanged);
    }


    handlePMDDataMTUCharacteristicError (event) {
        this.logger.log(`Sensor ${this.index} PMD Data characteristic error: ` + error);
    }


    testRequestToControlPoint () {
        const request = CONTROL_POINT_REQUEST.GET_ACC_STREAM_SETTINGS;
        console.log({request});

        /*
        this.pmdControlPoint.oncharacteristicvaluechanged = (event) => {console.log("pmd cp oncharacteristicvaluechange", event);};
        this.pmdControlPoint.addEventListener("characteristicvaluechanged", (event) => console.log("cp value changed", event.target.value))
        this.pmdControlPoint.writeValueWithoutResponse(request).then(_ => {
            console.log('Jubalong!');
        })
        .catch(error => { console.error(error); });
        */
    }

    getParameters () {

        if (this.featureSupport.ecg) {
            this.pmdControlPoint.writeValueWithoutResponse(CONTROL_POINT_REQUEST.GET_ECG_STREAM_SETTINGS);
        }
        if (this.featureSupport.ppg) {
            this.pmdControlPoint.writeValueWithoutResponse(CONTROL_POINT_REQUEST.GET_PPG_STREAM_SETTINGS);
        }
        if (this.featureSupport.acceleration) {
            this.pmdControlPoint.writeValueWithoutResponse(CONTROL_POINT_REQUEST.GET_ACC_STREAM_SETTINGS);
        }
        if (this.featureSupport.ppi) {
            this.pmdControlPoint.writeValueWithoutResponse(CONTROL_POINT_REQUEST.GET_PPI_STREAM_SETTINGS);
        }
        if (this.featureSupport.gyro) {
            this.pmdControlPoint.writeValueWithoutResponse(CONTROL_POINT_REQUEST.GET_GYRO_STREAM_SETTINGS);
        }
        if (this.featureSupport.mag) {
            this.pmdControlPoint.writeValueWithoutResponse(CONTROL_POINT_REQUEST.GET_MAG_STREAM_SETTINGS);
        }
    }

    getParametersForFeature (feature) {
        const buffer = new ArrayBuffer(2);
        const arr = new Uint8Array(buffer);
        //arr.set([0x01, 0x02]);
        //this.pmdControlPoint.writeValue(arr);

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

    updateFeatureUI (feature) {
        console.log(`TODO: update ${feature}`);
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
            Object.entries(support).filter(([key, supported]) => !!supported).forEach(([key]) => {
                this.features[key] = new PolarFeature(key);
                this.featuresElement.appendChild(this.features[key].rootElement);
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
