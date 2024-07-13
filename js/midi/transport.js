import {useLayoutEffect} from "preact/hooks";
import {html} from "htm/preact";

import {SYSEX_TYPE} from "./constants.js";


const TRANSPORT_STATE = {
    START: "start",
    STOP: "stop",
    CONTINUE: "continue"
};

function MidiTransport (props) {
    const {port, handlers, command, running} = props;

    const {
        setCommand,
        setRunning
    } = handlers;

    useLayoutEffect(() => {
        if (command.value !== null) {

            switch (command.value) {
                case TRANSPORT_STATE.START:
                    port.send([SYSEX_TYPE.START]);
                    setRunning(true);
                    break;

                case TRANSPORT_STATE.STOP:
                    port.send([SYSEX_TYPE.STOP]);
                    setRunning(false);
                    break;

                case TRANSPORT_STATE.CONTINUE:
                    port.send([SYSEX_TYPE.CONTINUE]);
                    setRunning(false);
                    break;
            }
        }
    }, [command.value]);


    const classes = ["transport"];
    if (running.value) {
        classes.push("running");
    }

    return html`
        <div class=${classes.join(" ")}>
            <h5>transport</h5>
            <button value=${TRANSPORT_STATE.START} onClick=${setCommand}>start</button>
            <button value=${TRANSPORT_STATE.STOP} onClick=${setCommand}>stop</button>
            <button value=${TRANSPORT_STATE.CONTINUE} onClick=${setCommand}>continue</button>
        </div>
    `;
}

export default MidiTransport;
