"use strict";

import {html, Component} from "./preact-standalone.module.min.js";
import Service from "./service.js";
import {GATT_SERVICE_UUID} from "./GATT_constants.js";
import {CHARACTERISTIC_UUID} from "./characteristics_and_object_types.js";

const UUID = GATT_SERVICE_UUID.DEVICE_INFORMATION;


class DeviceInformation extends Component {
    constructor ({service}) {
        super();
        this.service = service;


        this.handleSystemId = this.handleSystemId.bind(this);
        this.handleModelNumber = this.handleModelNumber.bind(this);
        this.handleManufacturerName = this.handleManufacturerName.bind(this);

        this.state = {
            manufacturerName: null,
            modelNumber: null,
            systemId: null,
            serialNumber: null,
            firmwareRevision: null,
            softwareRevision: null
        };

    }

    componentDidMount () {
        this.initCharacteristics();
    }

    render (props, {manufacturerName, systemId, modelNumber}) {

        return html`
            <${Service} heading="device information">
                ${systemId !== null ? html`<p>system id: ${systemId}</p>` : null}
                ${modelNumber !== null ? html`<p>model number: ${modelNumber}</p>` : null}
                ${manufacturerName !== null ? html`<p>manufacturer name: ${manufacturerName}</p>` : null}
            <//>
        `;
    }

    initCharacteristics () {
        return Promise.all([
            this.service.getCharacteristic(CHARACTERISTIC_UUID.MANUFACTURER_NAME_STRING).then(this.handleManufacturerNameCharacteristic),
            this.service.getCharacteristic(CHARACTERISTIC_UUID.SYSTEM_ID).then(this.handleSystemId),
            this.service.getCharacteristic(CHARACTERISTIC_UUID.MODEL_NUMBER_STRING).then(this.handleModelNumber),
/*
            this.service.getCharacteristic(CHARACTERISTIC_UUID.SERIAL_NUMBER_STRING).then(this.handleSerialNumberCharacteristic),
            this.service.getCharacteristic(CHARACTERISTIC_UUID.FIRMWARE_REVISION_STRING).then(this.handleFirmwareRevisionCharacteristic),
            this.service.getCharacteristic(CHARACTERISTIC_UUID.SOFTWARE_REVISION_STRING).then(this.handleSoftwareRevisionCharacteristic),
*/
        ]);
    }

    handleSystemId (characteristic) {
        console.log("device info systemId");
        characteristic.readValue().then(c => this.setState({systemId: c.value}));
    }

    handleModelNumber (characteristic) {
        characteristic.addEventListener("click", this.handleModelNumder);
        characteristic.readValue().then(c => this.setState({modelNumber: c.value}));
    }

    handleManufacturerName (characteristic) {
        characteristic.readValue().then(c => this.setState({manufacturerName: c.value}));
    }
}

export default DeviceInformation;

export {UUID};
