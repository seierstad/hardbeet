import {html} from "htm/preact";

import {Device} from "./device.js";


const Devices = (props = {}) => {
    const {
        devices = {value: []},
        handlers = {},
        log = () => null
    } = props;


    const dataFunctions = {
        registerSource: (sourceIndex, data) => log("register source " + sourceIndex + " with data " + data),
        registerDestination: (destinationIndex, data) => log("register destination " + destinationIndex + " with data " + data)
    };


    return html`
        <section>
            <header><h2>devices</h2></header>
            ${devices.value.map(device => html`<${Device} state=${device} getHandlers=${handlers.getDeviceHandlers} functions=${dataFunctions} key=${device.id} />`)}
        </section>
    `;
};


export {
    Devices
};
