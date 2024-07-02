import {useState, useEffect, useMemo} from "preact/hooks";
import {html} from "htm/preact";

import {MidiPort} from "./port.js";


const initialState = {};

const MidiInput = props => {
    const {
        port,
        state: {
            open,
            connected
        },
        handlers: {
            getInputPortHandlers
        }
    } = props;

    const handlers = useMemo(() => getInputPortHandlers(port.id), [port.id]);

    return html`<${MidiPort} port=${port} handlers=${handlers} open=${open} connected=${connected} />`;
}


export {
    MidiInput,
    initialState
};
