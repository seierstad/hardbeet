"use strict";
import {html, useState, useEffect} from "./preact-standalone.module.min.js";
import {SYSEX_TYPE} from "./midi-constants.js";

const TRANSPORT_STATE = {
    START: "start",
    STOP: "stop",
    CONTINUE: "continue"
};

function MidiTransport (props) {
    const {port} = props;

    const [state, setState] = useState(null);

    useEffect(() => {
        if (state !== null) {
            switch (state) {
                case TRANSPORT_STATE.START:
                    port.send([SYSEX_TYPE.START]);
                    break;

                case TRANSPORT_STATE.STOP:
                    port.send([SYSEX_TYPE.STOP]);
                    break;

                case TRANSPORT_STATE.CONTINUE:
                    port.send([SYSEX_TYPE.CONTINUE]);
                    break;
            }
        }
    }, [state]);

    const buttonHandler = (event) => setState(event.target.value);

    return html`
        <div>
            <h5>transport</h5>
            <button value=${TRANSPORT_STATE.START} onClick=${buttonHandler}>start</button>
            <button value=${TRANSPORT_STATE.STOP} onClick=${buttonHandler}>stop</button>
            <button value=${TRANSPORT_STATE.CONTINUE} onClick=${buttonHandler}>continue</button>
        </div>
    `;
}

export default MidiTransport;
