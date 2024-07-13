import {useEffect, useState} from "preact/hooks";
import {html} from "htm/preact";

import Toggle from "../../toggle.js";

import {FREQUENCY_MIN, FREQUENCY_MAX} from "./constants.js";


const Carrier = (props = {}) => {
    const {ctx, destination, state = {}, handlers} = props;
    const {toggle, frequency} = state;

    const [carrier, setCarrier] = useState(ctx.createOscillator());
    const [running, setRunning] = useState(false);

    useEffect(() => {
        if (toggle.value === "on") {
            carrier.connect(destination);
            carrier.frequency.value = frequency.value;
            carrier.start();
            setRunning(true);
        } else if (running) {
            carrier.stop();
            carrier.disconnect();
            setCarrier(ctx.createOscillator());
            setRunning(false);
        }
    }, [toggle.value]);

    useEffect(() => {
        if (running) {
            carrier.frequency.value = frequency.value;
        }
    }, [frequency.value]);

    return html`
        <div class="carrier">
            <h5>carrier ${toggle}</h5>
            <${Toggle} name="toggle-carrier" legend="toggle" options=${[["off"], ["on"]]} selected=${toggle.value} default="off" onChange=${handlers.toggle} />
            <label>
                <span class="label-text">frequency</span>
                <input name="carrier-frequency" type="range" min=${FREQUENCY_MIN} max=${FREQUENCY_MAX} value=${frequency.value} onInput=${handlers.frequency} />
            </label>
        </div>
    `;
};


export {
    Carrier
};
