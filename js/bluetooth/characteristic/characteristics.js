import {html} from "htm/preact";

import {GenericCharacteristic} from "./characteristic.js";


const Characteristics = (props = {}) => {
    const {
        state: characteristics = {value: []},
        serviceHandlers = {},
        getHandlers,
        ...rest
    } = props;

    return characteristics.value.length > 0 ? html`
        <ul>
        ${characteristics.value.map(c => html`
            <li>
                <${GenericCharacteristic}
                    getHandlers=${getHandlers}
                    serviceHandlers=${serviceHandlers}
                    key=${c.uuid}
                    state=${c}
                    ...${rest}
                />
            </li>
        `)}
        </ul>
    ` : null;

};


export {
    Characteristics
};
