"use strict";

import {html, useState, useEffect} from "./preact-standalone.module.min.js";
import Service from "./service.js";
import {GATT_SERVICE_UUID} from "./GATT_constants.js";
import {ACTION as STATUS_ACTION} from "./status.js";


const UUID = GATT_SERVICE_UUID.USER_DATA;

function UserData (props) {
    const {service, dispatch} = props;

    const [firstName, setFirstName] = useState(null);
    const [firstNameCharacteristic, setFirstNameCharacteristic] = useState(null);

    useEffect(() => {
        (async function () {
            await Promise.all([
                service.getCharacteristic("first_name").then(c => setFirstNameCharacteristic(c))
            ]);
        })();
    }, []);

    useEffect(() => {
        if (firstNameCharacteristic !== null) {
            firstNameCharacteristic.readValue()
                .then(firstName => setFirstName(firstName.getUint8(0)))
                .catch(error => {
                    dispatch({type: STATUS_ACTION.ERROR, payload: {text: error.message, timestamp: new Date()}});
                });
        }
    }, [firstNameCharacteristic]);

    return html`
        <${Service} heading="user data">
            ${firstName === null ? null : html`<p class="first-name>first name: ${firstName}</p>`}
        <//>
    `;
}

export default UserData;

export {
    UUID
};
