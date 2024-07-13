import {signal} from "@preact/signals";
import {useEffect, useState, useMemo, useContext} from "preact/hooks";
import {html} from "htm/preact";

import {AppHandlersContext} from "hardbeet";

import {CHARACTERISTIC_UUID} from "../characteristics_and_object_types.js";
import {GATT_SERVICE_UUID} from "../GATT_constants.js";
import {lookupUUID} from "../functions.js";

import Service from "./service.js";


const UUID = GATT_SERVICE_UUID.DEVICE_INFORMATION;

const stringFromBuffer = buffer => {
    const arr = new Uint8Array(buffer);
    return String.fromCharCode(...(arr.subarray(0, arr.indexOf(0))));
};


const hexFromBuffer = buffer => {
    const arr = new Uint8Array(buffer);
    return arr.map(c => parseInt(c, 16)).join("");
};


const getState = (initialValues = {}) => {
    const {
        manufacturerName = null,
        systemId = null,
        pnpId = null,
        modelNumber = null,
        serialNumber = null,
        hardwareRevision = null,
        firmwareRevision = null,
        softwareRevision = null
    } = initialValues;

    return {
        manufacturerName: signal(manufacturerName),
        systemId: signal(systemId),
        pnpId: signal(pnpId),
        modelNumber: signal(modelNumber),
        serialNumber: signal(serialNumber),
        hardwareRevision: signal(hardwareRevision),
        firmwareRevision: signal(firmwareRevision),
        softwareRevision: signal(softwareRevision)
    };
};

const getHandlers = (state) => ({
    setManufacturerName: name => state.manufacturerName.value = name,
    setSystemId: systemId => state.systemId.value = systemId,
    setPnpId: pnpId => state.pnpId.value = pnpId,
    setModelNumber: number => state.modelNumber.value = number,
    setSerialNumber: number => state.serialNumber.value = number,
    setHardwareRevision: revision => state.hardwareRevision.value = revision,
    setFirmwareRevision: revision => state.firmwareRevision.value = revision,
    setSoftwareRevision: revision => state.softwareRevision.value = revision
});


const DeviceInformationService = (props = {}) => {
    const {state, getHandlers} = props;
    const handlers = useMemo(() => getHandlers(state));
    const {setManufacturerName, setSystemId, setPnpId, setModelNumber, setHardwareRevision, setFirmwareRevision, setSoftwareRevision} = handlers;
    const {
        object: service,
        manufacturerName = {value: null},
        systemId = {value: null},
        modelNumber = {value: null},
        hardwareRevision = {value: null},
        firmwareRevision = {value: null},
        softwareRevision = {value: null},
        serialNumber = {value: null},
        pnpId = {value: null}
    } = state;

    const {log: {log, logError} = {}} = useContext(AppHandlersContext);

    const [manufacturerNameCharacteristic, setManufacturerNameCharacteristic] = useState(null);
    const [systemIdCharacteristic, setSystemIdCharacteristic] = useState(null);
    const [modelNumberCharacteristic, setModelNumberCharacteristic] = useState(null);
    //const [serialNumberCharacteristic, setSerialNumberCharacteristic] = useState(null);
    const [hardwareRevisionCharacteristic, setHardwareRevisionCharacteristic] = useState(null);
    const [firmwareRevisionCharacteristic, setFirmwareRevisionCharacteristic] = useState(null);
    const [softwareRevisionCharacteristic, setSoftwareRevisionCharacteristic] = useState(null);
    const [pnpIdCharacteristic, setPnpIdCharacteristic] = useState(null);

    useEffect(() => {
        (async function () {
            service.getCharacteristics().then(characteristics => {
                characteristics.map((c) => {
                    switch (lookupUUID(c.uuid)) {

                        case CHARACTERISTIC_UUID.MANUFACTURER_NAME_STRING:
                            setManufacturerNameCharacteristic(c);
                            break;

                        case CHARACTERISTIC_UUID.SYSTEM_ID:
                            setSystemIdCharacteristic(c);
                            break;

                        case CHARACTERISTIC_UUID.PNP_ID:
                            setPnpIdCharacteristic(c);
                            break;

                        case CHARACTERISTIC_UUID.MODEL_NUMBER_STRING:
                            setModelNumberCharacteristic(c);
                            break;

                        case CHARACTERISTIC_UUID.HARDWARE_REVISION_STRING:
                            setHardwareRevisionCharacteristic(c);
                            break;

                        case CHARACTERISTIC_UUID.FIRMWARE_REVISION_STRING:
                            setFirmwareRevisionCharacteristic(c);
                            break;

                        case CHARACTERISTIC_UUID.SOFTWARE_REVISION_STRING:
                            setSoftwareRevisionCharacteristic(c);
                            break;

                            /*
                        case CHARACTERISTIC_UUID.SERIAL_NUMBER_STRING:
                            // https://webbluetoothcg.github.io/web-bluetooth/#attacks-on-devices
                            setSerialNumberCharacteristic(c);
                            break;
                        */

                        default:
                            log(`unknown characteristic: ${c.uuid}`);


                    }
                });

            });
        })();
    }, []);

    useEffect(() => {
        if (manufacturerNameCharacteristic !== null) {
            manufacturerNameCharacteristic.readValue()
                .then(response => setManufacturerName(stringFromBuffer(response.buffer)))
                .catch(error => logError(`manufacturer name error: ${error.message}`));
        }
    }, [manufacturerNameCharacteristic]);

    useEffect(() => {
        if (systemIdCharacteristic !== null) {
            systemIdCharacteristic.readValue()
                .then(response => setSystemId(hexFromBuffer(response.buffer)))
                .catch(error => logError(`system id error: ${error.message}`));
        }
    }, [systemIdCharacteristic]);

    useEffect(() => {
        if (pnpIdCharacteristic !== null) {
            pnpIdCharacteristic.readValue()
                .then(response => setPnpId(hexFromBuffer(response.buffer)))
                .catch(error => logError(`pnp id error: ${error.message}`));
        }
    }, [pnpIdCharacteristic]);


    useEffect(() => {
        if (modelNumberCharacteristic !== null) {
            modelNumberCharacteristic.readValue()
                .then(response => setModelNumber(stringFromBuffer(response.buffer)))
                .catch(error => logError(`model number error: ${error.message}`));
        }
    }, [modelNumberCharacteristic]);

    useEffect(() => {
        if (hardwareRevisionCharacteristic !== null) {
            hardwareRevisionCharacteristic.readValue()
                .then(response => setHardwareRevision(stringFromBuffer(response.buffer)))
                .catch(error => logError(`hardware revision error: ${error.message}`));
        }
    }, [hardwareRevisionCharacteristic]);

    useEffect(() => {
        if (firmwareRevisionCharacteristic !== null) {
            firmwareRevisionCharacteristic.readValue()
                .then(response => setFirmwareRevision(stringFromBuffer(response.buffer)))
                .catch(error => logError(`firmware revision error: ${error.message}`));
        }
    }, [firmwareRevisionCharacteristic]);

    useEffect(() => {
        if (softwareRevisionCharacteristic !== null) {
            softwareRevisionCharacteristic.readValue()
                .then(response => setSoftwareRevision(stringFromBuffer(response.buffer)))
                .catch(error => logError(`software revision error: ${error.message}`));
        }
    }, [softwareRevisionCharacteristic]);


    return html`
        <${Service} heading="device information">
            <dl>
                ${manufacturerName.value !== null ? html`<dt>manufacturer name</dt><dd>${manufacturerName}</dd>` : null}
                ${modelNumber.value !== null ? html`<dt>model number</dt><dd>${modelNumber}</dd>` : null}
                ${systemId.value !== null ? html`<dt>system id</dt><dd>${systemId}</dd>` : null}
                ${pnpId.value !== null ? html`<dt>pnp id</dt><dd>${pnpId}</dd>` : null}
                ${serialNumber.value !== null ? html`<dt>serial number</dt><dd>${serialNumber}</dd>` : null}
                ${hardwareRevision.value !== null ? html`<dt>hardware revision</dt><dd>${hardwareRevision}</dd>` : null}
                ${firmwareRevision.value !== null ? html`<dt>firmware revision</dt><dd>${firmwareRevision}</dd>` : null}
                ${softwareRevision.value !== null ? html`<dt>software revision</dt><dd>${softwareRevision}</dd>` : null}
            </dl>
        <//>
    `;
};


export {
    DeviceInformationService,
    getState,
    getHandlers,
    UUID
};
