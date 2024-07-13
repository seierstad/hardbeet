import {html} from "htm/preact";
import {useMemo, useEffect} from "preact/hooks";

import {lookupUUID} from "../functions.js";
import {CHARACTERISTIC_OR_OBJECT_TYPE} from "../characteristics_and_object_types.js";

import {Descriptors} from "./descriptor/descriptors.js";
import {getCharacteristicSpecificView} from "./characteristic-specific.js";


const GenericCharacteristic = (props = {}) => {
    const {state, getHandlers, serviceHandlers} = props;
    const {object: characteristic, descriptors, uuid} = state;
    const handlers = useMemo(() => getHandlers(state));
    const {addDescriptors} = handlers;

    useEffect(() => {
        characteristic.getDescriptors()
            .then(addDescriptors)
            .catch(e => null); // catch error thrown when characteristic has no descriptors
    }, [characteristic]);

    const View = getCharacteristicSpecificView(uuid);

    return html`<${View} state=${state} handlers=${handlers} serviceHandlers=${serviceHandlers} />`;
};


const Characteristic = (props = {}) => {
    const {state, handlers, children = null} = props;
    const {descriptors, uuid} = state;

    const lookup = lookupUUID(uuid);

    return html`
        <div class="characteristic">
            <h5 title=${lookup}>${CHARACTERISTIC_OR_OBJECT_TYPE[lookup]}</h5>
            <${Descriptors} state=${descriptors} getHandlers=${handlers.getDescriptorHandlers} />
            ${children}
        </div>`;
};


export {
    GenericCharacteristic,
    Characteristic
};
