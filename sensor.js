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
    SETTING_VALUES
} from "./polar-codes.js";

import {
    GATT_SERVICE_NAME,
    GATT_SERVICE_UUID
} from "./GATT_constants.js";

import {
    CHARACTERISTIC_UUID,
    CHARACTERISTIC_OR_OBJECT_TYPE
} from "./characteristics_and_object_types.js";

const FLAG = {
    RATE_16_BITS: 0x1,
    CONTACT_DETECTED: 0x2,
    CONTACT_SENSOR_PRESENT: 0x4,
    ENERGY_PRESENT: 0x8,
    RR_INTERVAL_PRESENT: 0x10
};

const CONTROL_POINT_FEATURE_READ_RESPONSE = 0x0F;
const CONTROL_POINT_RESPONSE = 0xF0;


const BODY_SENSOR_LOCATIONS = {
    0x0000: "Other",
    0x0001: "Chest",
    0x0002: "Wrist",
    0x0003: "Finger",
    0x0004: "Hand",
    0x0005: "Ear lobe",
    0x0006: "Foot"
};


const mainServiceUUID = GATT_SERVICE_UUID.HEART_RATE;
const optionalServicesUUIDs = [
    GATT_SERVICE_UUID.BATTERY,
    GATT_SERVICE_UUID.DEVICE_INFORMATION,
    GATT_SERVICE_UUID.USER_DATA,
    GATT_SERVICE_UUID.GENERIC_ACCESS,
    GATT_SERVICE_UUID.GENERIC_ATTRIBUTE,
    POLAR_UUID1,
    POLAR_MEASUREMENT_DATA_SERVICE_UUID,
    POLAR_H10_UNDOCUMENTED_SERVICE
];

function byteArray2Array (byteArray) {
    let result = [];
    for (let i = 0; i < byteArray.byteLength; i += 1) {
        result.push(byteArray.getUint8(i));
    }
    return result;
}

function byteArray2String (byteArray) {
    return String.fromCharCode(...byteArray2Array(byteArray));
}

function parseHeartRate (data) {
    const flags = data.getUint8(0);
    const rate16Bits = flags & FLAG.RATE_16_BITS;
    const result = {};
    let index = 1;
    if (rate16Bits) {
        result.heartRate = data.getUint16(index, /*littleEndian=*/true);
        index += 2;
    } else {
        result.heartRate = data.getUint8(index);
        index += 1;
    }

    const contactDetected = flags & FLAG.CONTACT_DETECTED;
    const contactSensorPresent = flags & FLAG.CONTACT_SENSOR_PRESENT;
    if (contactSensorPresent) {
        result.contactDetected = !!contactDetected;
    }

    if (flags & FLAG.ENERGY_PRESENT) {
        result.energyExpended = data.getUint16(index, /*littleEndian=*/true);
        index += 2;
    }

    if (flags & FLAG.RR_INTERVAL_PRESENT) {
        const rrIntervals = [];
        for (; index + 1 < data.byteLength; index += 2) {
            rrIntervals.push(data.getUint16(index, /*littleEndian=*/true));
        }
        result.rrIntervals = rrIntervals;
    }
    result.datetime = new Date();
    return result;
}

function parseFeatureReadResponse (data) {

    const result = {};
    const datatype = data.getUint8(0);
    if (datatype !== CONTROL_POINT_FEATURE_READ_RESPONSE) {
        return result;
    }
    const arr = [];
    for (let i = 0; i < data.byteLength; i += 1) {
        arr.push(data.getUint8(i));
    }
    console.log(arr);

    const flags = data.getUint8(1);
    result.ecg= !!(flags & PMD_FLAG.ECG_SUPPORTED);
    result.ppg = !!(flags & PMD_FLAG.PPG_SUPPORTED);
    result.acc = !!(flags & PMD_FLAG.ACC_SUPPORTED);
    result.ppi = !!(flags & PMD_FLAG.PPI_SUPPORTED);
    result.gyro = !!(flags & PMD_FLAG.GYRO_SUPPORTED);
    result.mag = !!(flags & PMD_FLAG.MAG_SUPPORTED);
    return result;
}

function parseControlPointResponse (data) {
    let i = 0;
    const result = {};
    const datatype = data.getUint8(i++);
    console.log("parse control point response!!!!");
    if (datatype !== CONTROL_POINT_RESPONSE) {
        console.log("not control point response?!?");
        return result;
    }

    const op_code = data.getUint8(i++);
    switch (op_code) {
        case  OP_CODE.GET_MEASUREMENT_SETTINGS:
            result.type = "parameterMap";
            break;
        case  OP_CODE.START_MEASUREMENT:
            result.type = "startStream";
            break;
        case  OP_CODE.STOP_MEASUREMENT:
            result.type = "stopStream";
            break;
    }


    const measurementType = {};
    result[MEASUREMENT_NAME[data.getUint8(i++)]] = measurementType;

    while (i < data.byteLength) {
        const setting = {
            values: []
        };
        const settingCode = data.getUint8(i++);
        switch (settingCode) {
            case SETTING_TYPE.SAMPLE_RATE:
                setting.unit = "Hz";
                break;
            case SETTING_TYPE.RESOLUTION:
                setting.unit = "bits";
                break;
            case SETTING_TYPE.RANGE:
                setting.unit = "G";
                break;
            case SETTING_TYPE.CHANNELS:
                setting.unit = "";
                break;

        }
        measurementType[SETTING_TYPE_NAME[settingCode]] = setting;
        const length = data.getUint8(i++);

        for (let j = i + length; i < j; i += 2) {
            const key = [data.getUint8(i)];

            if (i + 1 < data.byteLength) {
                // number of channels is coded with one byte only
                key.push(data.getUint8(i + 1));
            }

            const lookupValue = key.reduce((acc, curr) => acc << 8 | curr);
            const value = SETTING_VALUES[settingCode][lookupValue];
            setting.values.push({[value]: key});
        }

    }

    console.log("CONTROL POINT RESPONSE!!!!!!");
    console.log({result});
    return result;
}



function lookupNameFromUUID (uuid, dictionaries) {
    let name = null;

    dictionaries.forEach(d => {
        if (d.hasOwnProperty(uuid)) {
            name = d[uuid];
        }
    });

    if (name === null && typeof uuid === "string" && uuid.length === 36) {
        const shortID = parseInt(uuid.substring(4, 8), 16);
        dictionaries.forEach(d => {
            if (d.hasOwnProperty(shortID)) {
                name = d[shortID];
            }
        });
    }

    return name || uuid.toString();
}

function getCharacteristicName (uuid) {
    return lookupNameFromUUID(uuid, [POLAR_NAMES, CHARACTERISTIC_OR_OBJECT_TYPE]);
}

function getServiceName (uuid) {
    return lookupNameFromUUID(uuid, [POLAR_NAMES, GATT_SERVICE_NAME]);
}


class Sensor {
    constructor (requestedDevicePromise, index, logger = console) {
        this.logger = logger;
        this.index = index;
        this.featureSupport = {};
        this.heartRateHistory = [];
        this.rrHistory = [];
        this.body_sensor_location = null;
        this.heartRateService = null;
        this.heartRateCharacteristic = null;
        this.heartRateElement = null;
        this.rrIntervalsElement = null;
        this.accProperties = {};
        this.ecgProperties = {};
        this.deviceInfoProperties = {};
        this.services = {};
        this._streamSettings = {};

        this.connectHeartRateService = this.connectHeartRateService.bind(this);
        this.connectBatteryService = this.connectBatteryService.bind(this);
        this.connectUserDataService = this.connectUserDataService.bind(this);
        this.connectPmdService = this.connectPmdService.bind(this);
        this.queryService = this.queryService.bind(this);

        this.handleBodySensorLocationCharacteristic = this.handleBodySensorLocationCharacteristic.bind(this);
        this.handleHeartRateMeasurementCharacteristic = this.handleHeartRateMeasurementCharacteristic.bind(this);
        this.handleBatteryLevelCharacteristic = this.handleBatteryLevelCharacteristic.bind(this);
        this.handlePMDControlPoint = this.handlePMDControlPoint.bind(this);
        this.handlePMDControlPointChanged = this.handlePMDControlPointChanged.bind(this);
        this.handlePMDDataMTUCharacteristic = this.handlePMDDataMTUCharacteristic.bind(this);
        this.handlePMDDataMTUCharacteristicChanged = this.handlePMDDataMTUCharacteristicChanged.bind(this);
        this.handleGATTServerDisconnected = this.handleGATTServerDisconnected.bind(this);

        this.heartRateChangedHandler = this.heartRateChangedHandler.bind(this);
        this.testRequestToControlPoint = this.testRequestToControlPoint.bind(this);

        this.rootElement = document.createElement("section");
        this.rootElement.classList.add("sensor");

        this.locationElement = null;
        this.batteryLevelElement = null;
        this.featureSupportElement = null;

        requestedDevicePromise.then(device => {
            this.device = device;
            this.device.addEventListener("advertisementreceived", event => this.logger.log(`device: ${this.index}, ${event}`));
            this.device.watchAdvertisements();
            

            let header = document.createElement("header");
            this.headerElement = header;
            let heading = document.createElement("h2");
            heading.innerText = "sensor " + index;
            header.appendChild(heading);
            this.rootElement.appendChild(header);
            const nameElement = document.createElement("span");
            nameElement.innerText = device.name;
            nameElement.classList.add("sensor-device-name");
            this.headerElement.appendChild(nameElement);

            const idElement = document.createElement("span");
            idElement.innerText = device.id;
            idElement.classList.add("sensor-device-id");
            this.headerElement.appendChild(idElement);


            return device.gatt.connect();
        })
            .then(server => this.setupGATTServer(server));
    }

    handleGATTServerDisconnected (event) {
        this.logger.log("GATT SERVER DISCONNECTED!!!!!!!!!!");
        this.logger.log({event});
    }

    queryService (uuid) {
        return this.server.getPrimaryService(uuid)
            .then(service => {
                this.services[service.uuid] = {
                    service,
                    characteristics: {}
                };

                return service.getCharacteristics().then(chars => chars.forEach(char => {
                    this.services[service.uuid].characteristics[char.uuid] = {characteristic: char, descriptors: {}};
                    //console.log(getCharacteristicName(char.uuid), char.properties);

                    const promises = [
                        char.getDescriptors().then(descriptors => descriptors.forEach(descriptor => {
                            //console.log(`${char.uuid}: descriptor ${decriptor.uuid}`);
                        })).catch(error => {
                            //console.log(`no descriptors found in service ${getServiceName(service.uuid)}, characteristic ${getCharacteristicName(char.uuid)}`)
                        }),
                    ];

                    if (char.properties.read) {
                        this.logger.log(`reading characteristic ${getCharacteristicName(char.uuid)} from service ${getServiceName(service.uuid)}`);
                        promises.push(char.readValue().then(value => {
                            this.services[service.uuid].characteristics[char.uuid].value = value;
                            this.services[service.uuid].characteristics[char.uuid].valueString = byteArray2String(value);
                            this.services[service.uuid].characteristics[char.uuid].valueBytes = byteArray2Array(value);
                        }));
                    }

                    if (char.properties.notify) {
                        promises.push(char.startNotifications().then(char => console.log(`notifications started for characteristic ${getCharacteristicName(char.uuid)}`)));
                    }

                    return Promise.all(promises);
                }));
            });
    }

    setupGATTServer (server) {
        this.server = server;

        const promises = [
            mainServiceUUID,
            ...optionalServicesUUIDs
        ].map(this.queryService);

        this.server.device.addEventListener("gattserverdisconnected", this.handleGATTServerDisconnected);

        const heartRateServicePromise = server.getPrimaryService("heart_rate").then(this.connectHeartRateService);
        const batteryService = server.getPrimaryService("battery_service").then(this.connectBatteryService);
        const userDataService = server.getPrimaryService("user_data").then(this.connectUserDataService);
        const pmdService = server.getPrimaryService(POLAR_MEASUREMENT_DATA_SERVICE_UUID).then(this.connectPmdService);

        return Promise.all([
            ...promises,
            heartRateServicePromise,
            batteryService,
            userDataService,
            pmdService
        ]);
    }


    connectUserDataService (service) {
        console.log("UserDataService!!!");
        this.userDataService = service;
        return Promise.all([
            //service.getCharacteristic("first_name").then(this.handleFirstNameCharacteristic)
        ]);
    }

    handleFirstNameCharacteristic (characteristic) {
        return characteristic.readValue()
            .then(firstNameData => this.firstName = firstName.getUint8(0));
    }

    connectPmdService (service) {
        this.pmdService = service;
        return Promise.all([
            service.getCharacteristic(POLAR_CHARACTERISTICS.PMD_CONTROL_POINT).then(this.handlePMDControlPoint).catch(this.handlePMDControlPointError),
            service.getCharacteristic(POLAR_CHARACTERISTICS.PMD_DATA_MTU).then(this.handlePMDDataMTUCharacteristic).catch(this.handlePMDDataMTUCharacteristicError)
        ]);
    }

    handlePMDControlPointChanged (event) {
        switch (event.target.value.getUint8(0)) {
            case CONTROL_POINT_FEATURE_READ_RESPONSE:
                this.support = parseFeatureReadResponse(event.target.value);
                break;
            case CONTROL_POINT_RESPONSE:
                // TODO: parse responses
                this.streamSettings = parseControlPointResponse(event.target.value);
                console.log("CONTROL_POINT_RESPONSE!!!!!!!!!!!!!");
                break;
            default:
                console.log("sjekk hva som skjer her...");
        }
    }

    handlePMDControlPoint (controlPoint) {
        this.pmdControlPoint = controlPoint;


        this.rootElement.addEventListener("click", this.testRequestToControlPoint);
        controlPoint.addEventListener("characteristicvaluechanged", this.handlePMDControlPointChanged);

        return controlPoint.startNotifications().then (controlPoint => controlPoint.readValue()).then(parseFeatureReadResponse);
    }

    handlePMDControlPointError (error) {
        this.logger.log(`Sensor ${this.index} control point error: ` + error);
    }

    parsePMDData (byteArray, resolution = 14, channels = 1) {
        const result = Array(channels).fill([]);

        const referenceBytes = [];
        let i = 0;
        const referenceByteLength = Math.ceil(resolution * channels / 8);
        while (i < referenceByteLength) {
            referenceBytes.push(byteArray.getUint8(0));
            i++;
        }

        for (let p = 0; p < channels; p += 1) {

        }

        const deltaSizeInBits = byteArray.getUint8(i);
        console.log(referenceBytes, byteArray2Array(byteArray));
    }

    handlePMDDataMTUCharacteristicChanged (event) {
        this.logger.log(`Sensor ${this.index}: PMD data MTU characteristic changed ${event}`);
        this.parsePMDData(event.target.value, 14, 1); // the values 14 and 1 are specific to ECG data from Polar H10
    }

    handlePMDDataMTUCharacteristic (characteristic) {
        characteristic.addEventListener("characteristicvaluechanged", this.handlePMDDataMTUCharacteristicChanged);
    }

    handlePMDDataMTUCharacteristicError (event) {
        this.logger.log(`Sensor ${this.index} PMD Data characteristic error: ` + error);
    }



    testRequestToControlPoint () {
        const request = CONTROL_POINT_REQUEST.GET_ECG_STREAM_SETTINGS;

        this.pmdControlPoint.service.device.onadvertisementreceived = (event) => {console.log("service device advertisementreceived", event);};
        this.pmdControlPoint.oncharacteristicvaluechanged = (event) => {console.log("pmd cp oncharacteristicvaluechange", event);};
        this.pmdControlPoint.addEventListener("characteristicvaluechanged", (event) => console.log("cp value changed", event.target.value))
        this.pmdControlPoint.writeValueWithoutResponse(request).then(_ => {
            console.log('Jubalong!');
        })
        .catch(error => { console.error(error); });
    }



    connectBatteryService (service) {
        this.batteryService = service;
        return Promise.all([
            service.getCharacteristic("battery_level").then(this.handleBatteryLevelCharacteristic)
        ]);
    }

    handleBatteryLevelChanged (event) {
        this.batteryLevel = event.target.value.getUint8(0);
    }





    connectHeartRateService (service) {
        this.heartRateService = service;
        return Promise.all([
            service.getCharacteristic("body_sensor_location")
                .then(this.handleBodySensorLocationCharacteristic),
            service.getCharacteristic("heart_rate_measurement")
                .then(this.handleHeartRateMeasurementCharacteristic)
        ]);
    }

    handleBatteryLevelCharacteristic (characteristic) {
        if (characteristic === null) {
            this.batteryLevel = "unknown";
            return Promise.resolve();
        }
        characteristic.addEventListener("characteristicvaluechanged", this.handleBatteryLevelChanged);
        return Promise.all([
            characteristic.readValue()
                .then(batteryLevelData => this.batteryLevel = batteryLevelData.getUint8(0)),
            characteristic.startNotifications()
        ]);

    }

    handleBodySensorLocationCharacteristic (characteristic) {
        if (characteristic === null) {
            this.location = "Unknown sensor location.";
            return Promise.resolve();
        }
        return characteristic.readValue()
            .then(sensorLocationData => this.location = sensorLocationData.getUint8(0));
    }

    handleHeartRateMeasurementCharacteristic (characteristic) {
        this.heartRateCharacteristic = characteristic;
        characteristic.addEventListener("characteristicvaluechanged", this.heartRateChangedHandler);
        return characteristic.startNotifications();
    }

    heartRateChangedHandler (event) {
        const parsed = parseHeartRate(event.target.value);
        if (parsed.hasOwnProperty("heartRate")) {
            this.heartRate = parsed.heartRate;
            this.heartRateHistory.push([parsed.heartRate, parsed.datetime]);
        }
        if (parsed.hasOwnProperty("rrIntervals")) {
            this.rrIntervals = parsed.rrIntervals;
            this.rrHistory.push([parsed.rrIntervals, parsed.datetime]);
        }        
        if (parsed.hasOwnProperty("contactDetected")) {
            this.contactDetected = parsed.contactDetected;
        }
    }
    /*
onHeartRateChanged() might log an object like

{
  heartRate: 70,
  contactDetected: true,
  energyExpended: 750,     // Meaning 750kJ.
  rrIntervals: [890, 870]  // Meaning .87s and .85s.
}
If the heart rate sensor reports the energyExpended field, the web application can reset its value to 0 by writing to the heart_rate_control_point characteristic:
*/

    set streamSettings (streamSettings) {
        this._streamSettings = streamSettings;
        console.log({streamSettings});
    }

    get streamSettings () {
        return this._streamSettings;
    }

    set support (support) {
        if (this.featureSupportElement === null) {
            this.featureSupportElement = document.createElement("div");
            this.featureSupportElement.classList.add("feature-support");
            this.rootElement.appendChild(this.featureSupportElement);

            const heading = document.createElement("h3");
            heading.innerText = "features";
            this.featureSupportElement.appendChild(heading);
            const list = document.createElement("ul");
            this.featureSupportElement.appendChild(list);
        }
        this.featureSupport = {
            ...support
        };

        const buffer = new ArrayBuffer(2);
        const arr = new Uint8Array(buffer);
        //arr.set([0x01, 0x02]);
        //this.pmdControlPoint.writeValue(arr);

        Object.entries(this.featureSupport).map(([a, b]) => {
            let featureElement = this.featureSupportElement.querySelector(`.feature-${a}`);
            if (!featureElement) {
                featureElement = document.createElement("li");
                featureElement.classList.add(`feature-${a}`);
                const featureText = document.createElement("h4");
                featureText.innerText = a;
                featureElement.appendChild(featureText);
                this.featureSupportElement.querySelector("ul").appendChild(featureElement);
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

    set heartRate (heartRate) {
        if (this.heartRateElement === null) {
            this.heartRateElement = document.createElement("div");
            this.heartRateElement.classList.add("heartRate");
            this.rootElement.appendChild(this.heartRateElement);
        }
        this.heartRateElement.innerText = heartRate;
    }

    set rrIntervals (rrIntervals) {
        if (this.rrIntervalsElement === null) {
            this.rrIntervalsElement = document.createElement("div");
            this.rrIntervalsElement.classList.add("rr-intervals");
            this.rootElement.appendChild(this.rrIntervalsElement);
        }
        this.rrIntervalsElement.innerText = rrIntervals.join(", ");
    }

    set location (location) {
        if (this.locationElement === null) {
            this.locationElement = document.createElement("div");
            this.locationElement.classList.add("location");
            this.rootElement.appendChild(this.locationElement);
        }
        this.locationElement.innerText = BODY_SENSOR_LOCATIONS[location] || "Unknown";
    }

    set batteryLevel (batteryLevel) {
        if (this.batteryLevelElement === null) {
            this.batteryLevelElement = document.createElement("div");
            this.batteryLevelElement.classList.add("battery-level");
            this.rootElement.appendChild(this.batteryLevelElement);
        }
        this.batteryLevelElement.innerText = "battery level: " + batteryLevel;
    }

    set deviceInformation (deviceInformation) {
        console.log("setter deviceInformation", deviceInformation);
    }

    set firstName (name) {
        console.log({"firstName": name});
    }
}

export default Sensor;

export {
    mainServiceUUID,
    optionalServicesUUIDs
};
