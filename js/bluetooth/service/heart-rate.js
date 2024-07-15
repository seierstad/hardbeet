import {signal} from "@preact/signals";
import {useEffect, useMemo} from "preact/hooks";
import {html} from "htm/preact";

import {GATT_SERVICE_UUID} from "../GATT_constants.js";

import {Characteristics} from "../characteristic/characteristics.js";

import Service from "./service.js";


const UUID = GATT_SERVICE_UUID.HEART_RATE;


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
    const {addCharacteristics} = handlers;

    useEffect(() => {
        /*  characteristics:
                required:
                    heart_rate_measurement
                optional:
                    heart_rate_control_point
                    body_sensor_location
        */
        service.getCharacteristics()
            .then(addCharacteristics);
    }, []);

    useEffect(() => {
        if (heartRate !== null) {
            //console.log("TODO: send heart rate from feature: " + heartRate);
        }
    }, [heartRate]);


    return html`
        <${Service} heading="heart rate">
            <${Characteristics} state=${characteristics} serviceHandlers=${handlers} getHandlers=${handlers.getCharacteristicHandlers} />
            <dl>
                ${sensorLocation.value !== null ? html`<dt>sensor location</dt><dd>${sensorLocation.value || "Unknown"}</dd>` : null}
                ${heartRate.value !== null ? html`<dt>heart rate</dt><dd>${heartRate.value}</dd>` : null}
                ${rrIntervals.value !== null ? html`<dt>rr intevals</dt><dd>[${rrIntervals.value.join(", ")}]</dd>` : null}
                ${contactDetected.value !== null ? html`<dt>contact detected</dt><dd>${contactDetected.value}</dd>` : null}
                ${energyExpended.value !== null ? html`<dt>energy expended</dt><dd>${energyExpended.value}</dd>` : null}
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
