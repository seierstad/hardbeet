import {html} from "htm/preact";
import {useCallback} from "preact/hooks";

import {getCharacteristicSpecificView} from "./characteristic-specific.js";


const Characteristic = (props = {}) => {
    const {state, handlers, children = null} = props;
    const {descriptors, uuid} = state;

    return html`
        <div class="characteristic">
            <h5>${uuid}</h5>
            ${descriptors.value}
            ${children}
        </div>`;
};


export {
    Characteristic
};
