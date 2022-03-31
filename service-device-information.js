"use strict";

import {html, useState, useEffect} from "./preact-standalone.module.min.js";
import Service from "./service.js";
import {GATT_SERVICE_UUID} from "./GATT_constants.js";
import {CHARACTERISTIC_UUID} from "./characteristics_and_object_types.js";
import {ACTION as STATUS_ACTION} from "./status.js";

const UUID = GATT_SERVICE_UUID.DEVICE_INFORMATION;

const stringFromBuffer = buffer => {
    const arr = new Uint8Array(buffer);
    return String.fromCharCode(...(arr.subarray(0, arr.indexOf(0))));
};

const hexFromBuffer = buffer => {
    const arr = new Uint8Array(buffer);
    return arr.map(c => parseInt(c, 16)).join("");
};

function DeviceInformation (props) {
    const {service, dispatch} = props;

    const [manufacturerName, setManufacturerName] = useState(null);
    const [manufacturerNameCharacteristic, setManufacturerNameCharacteristic] = useState(null);

    const [systemId, setSystemId] = useState(null);
    const [systemIdCharacteristic, setSystemIdCharacteristic] = useState(null);

    const [modelNumber, setModelNumber] = useState(null);
    const [modelNumberCharacteristic, setModelNumberCharacteristic] = useState(null);

    /*
    serial number UUID is blocked in Chrome for Ubuntu (2022-03-20)
    const [serialNumber, setSerialNumber] = useState(null);
    const [serialNumberCharacteristic, setSerialNumberCharacteristic] = useState(null);
    */

    const [firmwareRevision, setFirmwareRevision] = useState(null);
    const [firmwareRevisionCharacteristic, setFirmwareRevisionCharacteristic] = useState(null);

    /*
    const [softwareRevision, setSoftwareRevision] = useState(null);
    const [softwareRevisionCharacteristic, setSoftwareRevisionCharacteristic] = useState(null);
    */

    useEffect(() => {
        (async function () {
            await Promise.all([
                service.getCharacteristic(CHARACTERISTIC_UUID.MANUFACTURER_NAME_STRING).then(c => setManufacturerNameCharacteristic(c)),
                service.getCharacteristic(CHARACTERISTIC_UUID.SYSTEM_ID).then(c => setSystemIdCharacteristic(c)),
                service.getCharacteristic(CHARACTERISTIC_UUID.MODEL_NUMBER_STRING).then(c => setModelNumberCharacteristic(c)),
                service.getCharacteristic(CHARACTERISTIC_UUID.FIRMWARE_REVISION_STRING).then(c => setFirmwareRevisionCharacteristic(c)),
                /*
                service.getCharacteristic(CHARACTERISTIC_UUID.SOFTWARE_REVISION_STRING).then(c => setSoftwareRevisionCharacteristic(c))
                service.getCharacteristic(CHARACTERISTIC_UUID.SERIAL_NUMBER_STRING).then(c => setSerialNumberCharacteristic(c)),
                */
            ]);
        })();
    }, []);

    useEffect(() => {
        if (manufacturerNameCharacteristic !== null) {
            manufacturerNameCharacteristic.readValue()
                .then(response => setManufacturerName(stringFromBuffer(response.buffer)))
                .catch(error => dispatch({type: STATUS_ACTION.ERROR, payload: {text: "manufacturer name error: " + error.message, timestamp: new Date()}}));
        }
    }, [manufacturerNameCharacteristic]);

    useEffect(() => {
        if (systemIdCharacteristic !== null) {
            systemIdCharacteristic.readValue()
                .then(response => setSystemId(hexFromBuffer(response.buffer)))
                .catch(error => dispatch({type: STATUS_ACTION.ERROR, payload: {text: "system id error: " + error.message, timestamp: new Date()}}));
        }
    }, [systemIdCharacteristic]);

    useEffect(() => {
        if (modelNumberCharacteristic !== null) {
            modelNumberCharacteristic.readValue()
                .then(response => setModelNumber(stringFromBuffer(response.buffer)))
                .catch(error => dispatch({type: STATUS_ACTION.ERROR, payload: {text: "model number error: " + error.message, timestamp: new Date()}}));
        }
    }, [modelNumberCharacteristic]);

    useEffect(() => {
        if (firmwareRevisionCharacteristic !== null) {
            firmwareRevisionCharacteristic.readValue()
                .then(response => setFirmwareRevision(stringFromBuffer(response.buffer)))
                .catch(error => dispatch({type: STATUS_ACTION.ERROR, payload: {text: "firmware revision error: " + error.message, timestamp: new Date()}}));
        }
    }, [firmwareRevisionCharacteristic]);

    /*
    useEffect(() => {
        if (softwareRevisionCharacteristic !== null) {
            softwareRevisionCharacteristic.readValue()
                .then(response => setSoftwareRevision(stringFromBuffer(response.buffer)))
                .catch(error => dispatch({type: STATUS_ACTION.ERROR, payload: {text: "software revision error: " + error.message, timestamp: new Date()}}));
        }
    }, [softwareRevisionCharacteristic]);
    */

    return html`
        <${Service} heading="device information">
            ${systemId !== null ? html`<p>system id: ${systemId}</p>` : null}
            ${modelNumber !== null ? html`<p>model number: ${modelNumber}</p>` : null}
            ${manufacturerName !== null ? html`<p>manufacturer name: ${manufacturerName}</p>` : null}
            ${firmwareRevision !== null ? html`<p>firmware revision: ${firmwareRevision}</p>` : null}
        <//>
    `;
}

export default DeviceInformation;

export {UUID};
