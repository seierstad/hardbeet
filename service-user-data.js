"use strict";

import {html, Component} from "./preact-standalone.module.min.js";
import Service from "./service.js";
import {GATT_SERVICE_UUID} from "./GATT_constants.js";

const UUID = GATT_SERVICE_UUID.USER_DATA;

class UserData extends Component {
    constructor ({service, logger = console}) {
        super();
        this.service = service;

        this.state = {
            initialized: false,
            firstName: null
        };

        this.initCharacteristics().then(() => this.setState({initialized: true}));
    }

    render (props, {initialized, firstName}) {
        return !initialized ? null : html`
            <${Service} heading="user data">
                ${firstName === null ? null : html`<p class="first-name>first name: ${firstName}</p>`}
            <//>
        `;
    }

    initCharacteristics () {
        return Promise.all([
            //service.getCharacteristic("first_name").then(this.handleFirstNameCharacteristic)
        ]);
    }

    handleFirstNameCharacteristic (characteristic) {
        return characteristic.readValue().then(firstName => this.firstName = firstName.getUint8(0));
    }

    set firstName (name) {
        this.setState({"firstName": name});
    }
}

export default UserData;

export {
    UUID
};
