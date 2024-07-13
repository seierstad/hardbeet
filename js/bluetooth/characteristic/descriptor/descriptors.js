import {html} from "htm/preact";

import {Descriptor} from "./descriptor.js";


const Descriptors = (props = {}) => {
    const {
        state: descriptors = {value: []},
        getHandlers
    } = props;

    return descriptors.value.length > 0 ? html`
        <ul>
        ${descriptors.value.map(d => html`
            <li><${Descriptor} getHandlers=${getHandlers} key=${d.uuid} state=${d} /></li>
        `)}
        </ul>
    ` : null;

};


export {
    Descriptors
};
