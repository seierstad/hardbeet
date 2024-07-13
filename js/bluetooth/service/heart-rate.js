import {signal} from "@preact/signals";
import {useEffect, useState, useMemo, useContext} from "preact/hooks";
import {html} from "htm/preact";

import {AppHandlersContext} from "hardbeet";
import {GATT_SERVICE_UUID} from "../GATT_constants.js";
import {CHARACTERISTIC_UUID} from "../characteristics_and_object_types.js";
import {findByUUID} from "../functions.js";

import {DATA_FLAG as FLAG} from "../polar/constants.js";

import Service from "./service.js";


const UUID = GATT_SERVICE_UUID.HEART_RATE;

const BODY_SENSOR_LOCATIONS = {
    0x0000: "Other",
    0x0001: "Chest",
    0x0002: "Wrist",
    0x0003: "Finger",
    0x0004: "Hand",
    0x0005: "Ear lobe",
    0x0006: "Foot"
};

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

const getState = (initialValues = {}) => {
    const {
        heartRate = null,
        rrIntervals = [],
        contactDetected = null,
        energyExpended = null,
        sensorLocation = null
    } = initialValues;

    return {
        heartRate: signal(heartRate),
        rrIntervals: signal(rrIntervals),
        contactDetected: signal(contactDetected),
        energyExpended: signal(energyExpended),
        sensorLocation: signal(sensorLocation)
    };
};

const getHandlers = state => ({
    setHeartRate: heartRate => state.heartRate.value = heartRate,
    setRRIntervals: rrIntervals => state.rrIntervals.value = rrIntervals,
    setContactDetected: contactDetected => state.contactDetected.value = contactDetected,
    setEnergyExpended: energyExpended => state.energyExpended.value = energyExpended,
    setSensorLocation: sensorLocation => state.sensorLocation.value = sensorLocation
});


const HeartRateService = (props = {}) => {
    const {state = {}, getHandlers} = props;
    const handlers = useMemo(() => getHandlers(state));
    const {object: service, characteristics = {value: []}, heartRate, rrIntervals, contactDetected, energyExpended, sensorLocation} = state;
    const {addCharacteristics, setHeartRate, setRRIntervals, setContactDetected, setEnergyExpended, setSensorLocation} = handlers;

    const {log: {logError}} = useContext(AppHandlersContext);
    const [heartRateCharacteristic, setHeartRateCharacteristic] = useState(null);
    const [sensorLocationCharacteristic, setSensorLocationCharacteristic] = useState(null);

    useEffect(() => {
        service.getCharacteristics()
            .then(addCharacteristics);
    }, []);


    useEffect(() => {
        const cs = characteristics.value;
        if (cs && cs.length > 0) {
            const heartRate = cs.find(findByUUID(CHARACTERISTIC_UUID.HEART_RATE));
            const sensorLocation = cs.find(findByUUID(CHARACTERISTIC_UUID.BODY_SENSOR_LOCATION));
            if (heartRate) {
                setHeartRateCharacteristic(heartRate);
            } else {
                setHeartRateCharacteristic(null);
            }

            if (sensorLocation) {
                setSensorLocationCharacteristic(data);
            } else {
                setSensorLocationCharacteristic(null);
            }
        }
    }, [characteristics.value]);

    const parseSensorLocation = sensorLocationData => {
        return sensorLocationData.getUint8(0);
    };

    const sensorLocationChangeHandler = (event) => {
        const parsed = parseSensorLocation(event.target.value);
        setSensorLocation(parsed);
    };

    useEffect(() => {
        if (sensorLocationCharacteristic !== null) {
            const {
                properties: {
                    read,
                    notify
                } = {}
            } = sensorLocationCharacteristic;

            if (read) {
                sensorLocationCharacteristic.readValue()
                    .then(sensorLocationData => setSensorLocation(sensorLocationData.getUint8(0)));
            }

            if (notify) {
                sensorLocationCharacteristic.addEventListener("characteristicvaluechanged", sensorLocationChangeHandler);
                sensorLocationCharacteristic.startNotifications();

                return () => {
                    sensorLocationCharacteristic.stopNotifications();
                    sensorLocationCharacteristic.removeEventListener("characteristicvaluechanged", sensorLocationChangeHandler);
                };
            }
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
            const {
                properties: {
                    notify = false
                } = {}
            } = heartRateCharacteristic;

            heartRateCharacteristic.getDescriptors().then(descriptors => descriptors.forEach(d => {
                d.readValue().then(value => console.log({descriptor: d.uuid, value}));
            })).catch(error => logError(error.message));

            if (notify) {
                heartRateCharacteristic.addEventListener("characteristicvaluechanged", heartRateChangeHandler);
                heartRateCharacteristic.startNotifications();
            }

            return () => {
                if (notify) {
                    heartRateCharacteristic.stopNotifications();
                    heartRateCharacteristic.removeEventListener("characteristicvaluechanged", heartRateChangeHandler);
                }
            };
        }
    }, [heartRateCharacteristic]);

    useEffect(() => {
        if (heartRate !== null) {
            //console.log("TODO: send heart rate from feature: " + heartRate);
        }
    }, [heartRate]);


    return html`
        <${Service} heading="heart rate">
            <dl>
                ${sensorLocation !== null ? html`<dt>sensor location</dt><dd>${BODY_SENSOR_LOCATIONS[sensorLocation] || "Unknown"}</dd>` : null}
                ${heartRate !== null ? html`<dt>heart rate</dt><dd>${heartRate}</dd>` : null}
                ${rrIntervals !== null ? html`<dt>rr intevals</dt><dd>${rrIntervals}</dd>` : null}
                ${contactDetected !== null ? html`<dt>contact detected</dt><dd>${contactDetected}</dd>` : null}
                ${energyExpended !== null ? html`<dt>energy expended</dt><dd>${energyExpended}</dd>` : null}
            </dl>
        <//>
    `;
};


export {
    HeartRateService,
    UUID,
    getState,
    getHandlers
};
