import {html} from "htm/preact";

import {Characteristic} from "./characteristic.js";
import {getCharacteristicSpecificView} from "./characteristic-specific.js";


const Characteristics = (props = {}) => {
    const {
        state: characteristics = [],
        getHandlers
    } = props;

    return characteristics.length > 0 ? html`
        <ul>
        ${characteristics.map(c => {
            const View = getCharacteristicSpecificView(c.uuid);
            return html`<li><${View} getHandlers=${getHandlers} key=${c.uuid} state=${c} /></li>`;
        })}
        </ul>
    ` : null;

};


export {
    Characteristics
};
