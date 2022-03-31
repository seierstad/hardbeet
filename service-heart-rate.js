"use strict";

import {html, useState, useEffect} from "./preact-standalone.module.min.js";
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


function HeartRateService (props) {
    const {service} = props;
    const [heartRateCharacteristic, setHeartRateCharacteristic] = useState(null);
    const [heartRate, setHeartRate] = useState(null);

    const [sensorLocationCharacteristic, setSensorLocationCharacteristic] = useState(null);
    const [sensorLocation, setSensorLocation] = useState(null);

    const [rrIntervals, setRRIntervals] = useState(null);
    const [contactDetected, setContactDetected] = useState(null);
    const [energyExpended, setEnergyExpended] = useState(null);


    useEffect(() => {
        (async function () {
            await Promise.all([
                service.getCharacteristic("body_sensor_location").then(characteristic => setSensorLocationCharacteristic(characteristic)),
                service.getCharacteristic("heart_rate_measurement").then(characteristic => setHeartRateCharacteristic(characteristic))
            ]);
        })();
    }, []);

    useEffect(() => {
        if (sensorLocationCharacteristic !== null) {
            sensorLocationCharacteristic.readValue().then(sensorLocationData => setSensorLocation(sensorLocationData.getUint8(0)));
        }
    }, [sensorLocationCharacteristic]);


    const heartRateChangeHandler = (event) => {
        const parsed = parseHeartRate(event.target.value);
        if (Object.prototype.hasOwnProperty.call(parsed, "heartRate")) {
            if (heartRate !== parsed.heartRate) {
                setHeartRate(parsed.heartRate);
            }
        }
        if (Object.prototype.hasOwnProperty.call(parsed, "rrIntervals")) {
            if (rrIntervals !== parsed.rrIntervals) {
                setRRIntervals(parsed.rrIntervals);
            }
        }
        if (Object.prototype.hasOwnProperty.call(parsed, "contactDetected")) {
            if (contactDetected !== parsed.contactDetected) {
                setContactDetected(parsed.contactDetected);
            }
        }
        if (Object.prototype.hasOwnProperty.call(parsed, "energyExpended")) {
            if (energyExpended !== parsed.energyExpended) {
                setEnergyExpended(parsed.energyExpended);
            }
        }
    };

    useEffect(() => {
        if (heartRateCharacteristic !== null) {
            heartRateCharacteristic.addEventListener("characteristicvaluechanged", heartRateChangeHandler);
            heartRateCharacteristic.startNotifications();

            return () => heartRateCharacteristic.removeEventListener("characteristicvaluechanged", heartRateChangeHandler);
        }
    }, [heartRateCharacteristic]);

    useEffect(() => {
        if (heartRate !== null) {
            //console.log("TODO: send heart rate from feature: " + heartRate);
        }
    }, [heartRate]);


    return html`
        <${Service} heading="heart rate">
            ${sensorLocation !== null ? html`
                <div class="sensor-location">sensor location: ${BODY_SENSOR_LOCATIONS[sensorLocation] || "Unknown"}</div>
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

export default HeartRateService;

export {UUID};
