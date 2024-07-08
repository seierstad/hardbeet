import {signal} from "@preact/signals";
import {useEffect, useMemo, useState, useContext} from "preact/hooks";
import {html} from "htm/preact";

import {AppHandlersContext} from "hardbeet";

import {GATT_SERVICE_UUID} from "../GATT_constants.js";

import Service from "./service.js";


const UUID = GATT_SERVICE_UUID.USER_DATA;

const getState = (initialValues = {}) => {
    const {
        firstName = null,
        lastName = null
    } = initialValues;

    return {
        firstName: signal(firstName),
        lastName: signal(lastName)
    };
};

const getHandlers = (state) => ({
    setFirstName: name => state.firstName.value = name,
    setLastName: name => state.lastName.value = name
});


const UserDataService = (props = {}) => {
    const {state, getHandlers} = props;
    const handlers = useMemo(() => getHandlers(state));
    const {log: {log, logError} = {}} = useContext(AppHandlersContext);

    const [firstNameCharacteristic, setFirstNameCharacteristic] = useState(null);

    useEffect(() => {
        (async function () {
            await Promise.all([
                service.getCharacteristic("first_name")
                    .then(c => setFirstNameCharacteristic(c))
                    .catch(e => logError(e.message))
            ]);
        })();
    }, []);

    useEffect(() => {
        if (firstNameCharacteristic !== null) {
            firstNameCharacteristic.readValue()
                .then(firstName => setFirstName(firstName.getUint8(0)))
                .catch(error => logError(error.message));
        }
    }, [firstNameCharacteristic]);

    return html`
        <${Service} heading="user data">
            ${firstName.value === null ? null : html`<p class="first-name>first name: ${firstName}</p>`}
        <//>
    `;
};


export {
    UserDataService,
    UUID,
    getHandlers,
    getState
};
