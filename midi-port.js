"use strict";
import {html, useState} from "./preact-standalone.module.min.js";

function MidiPort (props) {
    const {port, children, dispatch} = props;

    const [open, setOpen] = useState(false);

    const toggleOpenHandler = () => {
        if (!open) {
            port.open().then(() => {
                setOpen(true);
            });
        } else {
            port.close().then(() => {
                setOpen(false);
            });
        }
    };

    return html`
        <fieldset>
            <legend>${port.manufacturer} ${port.name}</legend>
            <button onClick=${toggleOpenHandler}>${!open ? "open" : "close"}</button>
            ${open ? children : null}
        </fieldset>
    `;
}

export default MidiPort;
