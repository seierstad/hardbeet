import {useContext, useEffect, useLayoutEffect, useRef} from "preact/hooks";
import {html} from "htm/preact";

import {AppHandlersContext} from "../hardbeet.js";


const portString = port => `${port.manufacturer} ${port.name} ${port.type}`;

function MidiPort (props) {
    const {
        port,
        children,
        open,
        connected,
        handlers: {
            setOpen,
            setConnected
        } = {}
    } = props;

    const {log: {log, logError} = {}} = useContext(AppHandlersContext);

    const firstRender = useRef(true);

    const toggleOpenHandler = () => {
        if (!open.value) {
            port.open();
        } else {
            port.close();
        }
    };

    const portStateHandler = event => {
        if (event.port.connection === "open") {
            if (!open.value) {
                setOpen(true);
            }
        } else {
            if (open.value) {
                setOpen(false);
            }
        }
    };

    useEffect(() => {
        port.addEventListener("statechange", portStateHandler);
        return () => port.removeEventListener("statechange", portStateHandler);
    }, [port.id]);

    useLayoutEffect(() => {
        if (open.value !== null) {
            if (open.value) {
                log(`${portString(port)} connection opened`);
            } else {
                log(`${portString(port)} connection closed`);
            }
        }
    }, [open.value]);

    useLayoutEffect(() => {
        log(`${portString(port)} connected`);
    }, [firstRender]);


    return html`
        <fieldset>
            <legend>${port.manufacturer} ${port.name}</legend>
            <button onClick=${toggleOpenHandler}>${!open.value ? "open" : "close"}</button>
            ${open.value ? children : null}
        </fieldset>
    `;
}

export {
    MidiPort,
    portString
};
