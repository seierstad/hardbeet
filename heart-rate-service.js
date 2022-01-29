import Service from "./service.js";

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
        result.heartRate = data.getUint16(index, true);
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
        result.energyExpended = data.getUint16(index, true);
        index += 2;
    }

    if (flags & FLAG.RR_INTERVAL_PRESENT) {
        const rrIntervals = [];
        for (; index + 1 < data.byteLength; index += 2) {
            rrIntervals.push(data.getUint16(index, true));
        }
        result.rrIntervals = rrIntervals;
    }
    result.datetime = new Date();
    return result;
}


class HeartRateService extends Service {
    constructor (service, dataCallbackFn) {
        super(service, "heart rate");
        this.dataCallbackFn = dataCallbackFn;
        this.heartRateCharacteristic = null;
        this.heartRateHistory = [];
        this.rrHistory = [];
        this.heartRateElement = null;
        this.rrIntervalsElement = null;
        this.locationElement = null;
        this.body_sensor_location = null;
        this.handleBodySensorLocationCharacteristic = this.handleBodySensorLocationCharacteristic.bind(this);
        this.handleHeartRateMeasurementCharacteristic = this.handleHeartRateMeasurementCharacteristic.bind(this);
        this.heartRateChangedHandler = this.heartRateChangedHandler.bind(this);

        this.initCharacteristics();
    }

    initCharacteristics () {
        return Promise.all([
            this.service.getCharacteristic("body_sensor_location").then(this.handleBodySensorLocationCharacteristic),
            this.service.getCharacteristic("heart_rate_measurement").then(this.handleHeartRateMeasurementCharacteristic)
        ]);
    }

    handleBodySensorLocationCharacteristic (characteristic) {
        if (characteristic === null) {
            this.location = "Unknown sensor location.";
            return Promise.resolve();
        }

        return characteristic.readValue().then(sensorLocationData => this.location = sensorLocationData.getUint8(0));
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
            this.dataCallbackFn("heartRate", [parsed.heartRate]);
        }
        if (parsed.hasOwnProperty("rrIntervals")) {
            this.dataCallbackFn("rrIntervals", parsed.rrIntervals.map(d => [d]));
            this.rrIntervals = parsed.rrIntervals;
            this.rrHistory.push([parsed.rrIntervals, parsed.datetime]);
        }
        if (parsed.hasOwnProperty("contactDetected")) {
            this.contactDetected = parsed.contactDetected;
        }
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

}

export default HeartRateService;
