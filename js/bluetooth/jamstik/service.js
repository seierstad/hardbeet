import {html} from "htm/preact";
import {useLayoutEffect, useState, useContext, useMemo} from "preact/hooks";

import {AppHandlersContext} from "hardbeet";
import {Log, LOG_LEVEL, getState as getLogState, getHandlers as getLogHandlers} from "hardbeet/log";

import Service from "../service/service.js";

import {SERVICE_UUID, MIDI_DATA_IO_UUID, CHARACTERISTIC2_UUID} from "./constants.js";
import {parseMIDI} from "./midi-parser.js";


const getState = (initialValues = {}) => {
    const {
        log = getLogState({title: "BT messages"})
    } = initialValues;

    return {
        log
    };
};

const getHandlers = (state = getState()) => {
    const {log: logState} = state;
    return {
        log: getLogHandlers(logState)
    };
};


const MIDIService = (props = {}) => {
    const {state, getHandlers} = props;
    const {object: service = {}} = state;
    const handlers = useMemo(() => getHandlers(state));
    const {log: {logError} = {}} = useContext(AppHandlersContext);

    const [midiDataIO, setMidiDataIO] = useState(null);
    //const [characteristic2, setCharacteristic2] = useState(null);


    useLayoutEffect(() => {
        service.getCharacteristic(MIDI_DATA_IO_UUID)
            .then(setMidiDataIO)
            .catch(e => logError(e.message));
    }, []);

    useLayoutEffect(() => {
        service.getCharacteristic(CHARACTERISTIC2_UUID)
            .then(setCharacteristic2)
            .catch(e => logError(e.message));
    }, []);


    const handleMidiData = event => {
        const data = event.target.value;
        const parsed = parseMIDI(data);

        const msg = Array.from(new Uint8Array(event.target.value.buffer)).map(n => Number(n).toString(2).padStart(8, "0")).join(" ");
        handlers.log.log(msg, LOG_LEVEL.DEBUG, "code");
        parsed.forEach(message => handlers.log.log(JSON.stringify(message), LOG_LEVEL.INFO));
    };

    useLayoutEffect(() => {
        if (midiDataIO !== null) {
            const {
                properties: {
                    notify
                } = {}
            } = midiDataIO;
            // console.log(midiDataIO.properties);
            midiDataIO.addEventListener("characteristicvaluechanged", handleMidiData);

            //midiDataIO.readValue().then(midiData => );
            if (notify) {
                midiDataIO.startNotifications();
            }

            return () => {
                midiDataIO.removeEventListener("characteristicvaluechanged", handleMidiData);
                if (notify) {
                    midiDataIO.stopNotifications();
                }
            };
        }
    }, [midiDataIO]);


    return html`
        <${Service} heading="MIDI BLE" classNames=${["bluetooth-midi"]}>
            <${Log} ...${state.log} />
        <//>
    `;
};


export {
    MIDIService as JamstikService,
    SERVICE_UUID as UUID,
    getState,
    getHandlers
};
