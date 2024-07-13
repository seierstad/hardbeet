import {html} from "htm/preact";
import {useMemo, useEffect} from "preact/hooks";

import {GATT_DESCRIPTOR_NAME} from "../../GATT_constants.js";
import {lookupUUID} from "../../functions.js";


const Descriptor = (props = {}) => {
    const {state, getHandlers} = props;
    const {object: descriptor, uuid, value} = state;
    const handlers = useMemo(() => getHandlers(state));
    const {setValue} = handlers;

    useEffect(() => {
        descriptor.readValue().then(value => setValue(value.getUint16(0, true)));
    }, [descriptor]);

    const lookup = lookupUUID(uuid);

    return html`
        <h6 title=${lookup}>
            ${GATT_DESCRIPTOR_NAME[lookup]}: ${value.value}
        </h6>
    `;

};


export {
    Descriptor
};
