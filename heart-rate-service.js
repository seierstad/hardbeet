"use strict";

import {html, Component} from "./preact-standalone.module.min.js";
import Service from "./service.js";
import {GATT_SERVICE_UUID} from "./GATT_constants.js";

const UUID = GATT_SERVICE_UUID.HEART_RATE;

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


class HeartRateService extends Component {
    constructor ({service, dataCallbackFn = () => null}) {
        super();

        this.service = service;
        this.dataCallbackFn = dataCallbackFn;

        this.heartRateCharacteristic = null;
        this.handleBodySensorLocationCharacteristic = this.handleBodySensorLocationCharacteristic.bind(this);
        this.handleHeartRateMeasurementCharacteristic = this.handleHeartRateMeasurementCharacteristic.bind(this);
        this.heartRateChangedHandler = this.heartRateChangedHandler.bind(this);

        this.state = {
            bodySensorLocationInitialized: false,
            heartRateMeasurementInitialized: false,
            heartRate: null,
            location: null,
            rrIntervals: null,
            contactDetected: null,
            energyExpended: null
        };

    }

    componentDidMount () {
        this.initCharacteristics();
    }

    render () {
        const {
            bodySensorLocationInitialized,
            heartRateMeasurementInitialized,
            location,
            rrIntervals,
            heartRate,
            contactDetected,
            energyExpended
        } = this.state;

        return html`
            <${Service} heading="heart rate">
                <div>${bodySensorLocationInitialized ? null : "sensor location initializing"}</div>
                <div>${heartRateMeasurementInitialized ? null : "heart rate initializing"}</div>
                ${location !== null ? html`
                    <div class="sensor-location">sensor location: ${BODY_SENSOR_LOCATIONS[location] || "Unknown"}</div>
                ` : null}
                ${heartRate !== null ? html`
                    <div class="heart-rate">heart rate: ${heartRate}</div>
                ` : null}
                ${rrIntervals !== null ? html`
                    <div class="rr-intervals">rr intevals: ${rrIntervals.join(", ")}</div>
                ` : null}
                ${contactDetected !== null ? html`
                    <div class="contact-detected">contact detected: ${contactDetected}</div>
                ` : null}
                ${energyExpended !== null ? html`
                    <div class="energy-expended">energy expended: ${energyExpended}</div>
                ` : null}
            <//>
        `;
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
        this.setState({bodySensorLocationInitialized: true});
        return characteristic.readValue().then(sensorLocationData => this.setState({location: sensorLocationData.getUint8(0)}));
    }

    handleHeartRateMeasurementCharacteristic (characteristic) {
        this.heartRateCharacteristic = characteristic;
        characteristic.addEventListener("characteristicvaluechanged", this.heartRateChangedHandler);

        this.setState({heartRateMeasurementInitialized: true});
        return characteristic.startNotifications();
    }


    heartRateChangedHandler (event) {
        const parsed = parseHeartRate(event.target.value);
        const newState = {};
        let changed = false;
        if (Object.prototype.hasOwnProperty.call(parsed, "heartRate")) {
            if (this.state.heartRate !== parsed.heartRate) {
                changed = true;
                newState.heartRate = parsed.heartRate;
            }
            this.dataCallbackFn("heartRate", [parsed.heartRate]);
        }
        if (Object.prototype.hasOwnProperty.call(parsed, "rrIntervals")) {
            if (this.state.rrIntervals !== parsed.rrIntervals) {
                changed = true;
                newState.rrIntervals = parsed.rrIntervals;
            }
            //this.rrHistory.push([parsed.rrIntervals, parsed.datetime]);
        }
        if (Object.prototype.hasOwnProperty.call(parsed, "contactDetected")) {
            if (this.state.contactDetected !== parsed.contactDetected) {
                changed = true;
                newState.contactDetected = parsed.contactDetected;
            }
        }
        if (changed) {
            this.setState(newState);
        }
    }

}

export default HeartRateService;

export {UUID};
