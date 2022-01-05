const FLAG = {
    RATE_16_BITS: 0x1,
    CONTACT_DETECTED: 0x2,
    CONTACT_SENSOR_PRESENT: 0x4,
    ENERGY_PRESENT: 0x8,
    RR_INTERVAL_PRESENT: 0x10
};

const BODY_SENSOR_LOCATIONS = {
    0x0000: "Other",
    0x0001: "Chest",
    0x0002: "Wrist",
    0x0003: "Finger",
    0x0004: "Hand",
    0x0005: "Ear lobe",
    0x0006: "Foot"
};

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
    return result;
}


class Sensor {
    constructor (requestedDevicePromise) {
        this.body_sensor_location = null;
        this.heartRateService = null;
        this.heartRateCharacteristic = null;
        this.handleBodySensorLocationCharacteristic = this.handleBodySensorLocationCharacteristic.bind(this);
        this.handleHeartRateMeasurementCharacteristic = this.handleHeartRateMeasurementCharacteristic.bind(this);
        this.heartRateChangedHandler = this.heartRateChangedHandler.bind(this);
        this.handleBatteryLevelCharacteristic = this.handleBatteryLevelCharacteristic.bind(this);
        this.connectHeartRateService = this.connectHeartRateService.bind(this);
        this.connectBatteryService = this.connectBatteryService.bind(this);
        this.connectUserDataService = this.connectUserDataService.bind(this);

        this.rootElement = document.createElement("section");
        this.rootElement.classList.add("sensor");
        this.locationElement = null;
        this.batteryLevelElement = null;

        requestedDevicePromise.then(device => {
            this.device = device;
            return device.gatt.connect();
        })
            .then(server => this.setupGATTServer(server));
    }

    setupGATTServer (server) {
        this.server = server;
        const heartRateServicePromise = server.getPrimaryService("heart_rate").then(this.connectHeartRateService);
        const batteryService = server.getPrimaryService("battery_service").then(this.connectBatteryService);
        const userDataService = server.getPrimaryService("user_data").then(this.connectUserDataService);

        return Promise.all([
            heartRateServicePromise,
            batteryService,
            userDataService
        ]);
    }

    connectUserDataService (service) {
        console.log("UserDataService!!!");
        this.userDataService = service;
        return Promise.all([
            service.getCharacteristic("first_name").then(this.handleFirstNameCharacteristic)
        ]);
    }

    handleFirstNameCharacteristic (characteristic) {
        return characteristic.readValue()
            .then(firstNameData => this.firstName = firstName.getUint8(0));
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
        return characteristic.readValue()
            .then(batteryLevelData => this.batteryLevel = batteryLevelData.getUint8(0));
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
        const characteristic = event.target;
        console.log(parseHeartRate(characteristic.value));
    }
    //parseHeartRate() would be defined using the heart_rate_measurement documentation to read the DataView stored in a BluetoothRemoteGATTCharacteristic"s value field.


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

    set firstName (name) {
        console.log({"firstName": name});
    }
}

export default Sensor;
