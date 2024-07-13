import {useEffect, useMemo, useState} from "preact/hooks";
import {signal} from "@preact/signals";
import {html} from "htm/preact";

import {Characteristic} from "./characteristic.js";

const FLAG = {
    RATE_16_BITS: 0x1,
    CONTACT_DETECTED: 0x2,
    CONTACT_SENSOR_PRESENT: 0x4,
    ENERGY_PRESENT: 0x8,
    RR_INTERVAL_PRESENT: 0x10
};


const getState = () => {};

const getHandlers = () => {};

const parseHeartRate = (data) => {
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
};


const HeartRateMeasurementCharacteristic = (props = {}) => {
    const {state = {}, handlers, serviceHandlers} = props;
    const {object: characteristic, features} = state;
    const {setHeartRate, setRRIntervals, setContactDetected, setEnergyExpended} = serviceHandlers;
    const logError = (e) => console.error(e);


    const heartRateChangeHandler = (event) => {
        const parsed = parseHeartRate(event.target.value);
        const {heartRate = null, rrIntervals = null, contactDetected = null, energyExpended = null} = parsed;
        if (heartRate !== null) {
            setHeartRate(heartRate);
        }
        if (rrIntervals !== null) {
            setRRIntervals(rrIntervals);
        }
        if (contactDetected !== null) {
            setContactDetected(contactDetected);
        }
        if (energyExpended !== null) {
            setEnergyExpended(energyExpended);
        }
    };

    useEffect(() => {
        if (characteristic !== null) {
            const {
                properties: {
                    notify
                } = {}
            } = characteristic;

            if (notify) {
                characteristic.addEventListener("characteristicvaluechanged", heartRateChangeHandler);
                characteristic.startNotifications();
            }

            return () => {
                if (notify) {
                    characteristic.stopNotifications();
                    characteristic.removeEventListener("characteristicvaluechanged", heartRateChangeHandler);
                }
            };
        }
    }, [characteristic]);

    return html`
        <${Characteristic} state=${state} handlers=${handlers}>
        <//>
    `;

};


export {
    HeartRateMeasurementCharacteristic,
    getState,
    getHandlers
};
