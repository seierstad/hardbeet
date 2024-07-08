import {createContext} from "preact";
import {useState, useContext} from "preact/hooks";
import {html} from "htm/preact";

import {AppHandlersContext} from "../hardbeet.js";


const MidiAccessContext = createContext();

const MidiAccessProvider = (props = {}) => {
    const {children = null} = props;
    const {access, setAccess} = useState();

    const {midi: handler, log: {log, logError}} = useContext(AppHandlersContext);

    return html`
        <MidiAccessContext.provider value=${{access, setAccess}}>
            ${children}
        <//>
    `;
};


export {
    MidiAccessContext,
    MidiAccessProvider
};
