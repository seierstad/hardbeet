import {html} from "htm/preact";
import {signal} from "@preact/signals";
import {useLayoutEffect, useState, useContext, useMemo} from "preact/hooks";

import {AppHandlersContext} from "hardbeet";
import {Log, LOG_LEVEL, getState as getLogState, getHandlers as getLogHandlers} from "hardbeet/log";

import {lookupUUID} from "../functions.js";
import Service from "../service.js";

import {MIDI_SERVICE_UUID, MIDI_DATA_IO_UUID} from "./constants.js";
import {parseMIDI} from "./parser.js";


const getState = (initialValues = {}) => {
    const {
        log = getLogState({title: "Jamstik BT messages"})
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


const MidiService = (props = {}) => {
    const {state, getHandlers} = props;
    const {object: service = {}} = state;
    const handlers = useMemo(() => getHandlers(state));
    const {log: {log, logError} = {}} = useContext(AppHandlersContext);

    const [midiDataIO, setMidiDataIO] = useState(null);
    //const [characteristic2, setCharacteristic2] = useState(null);


    useLayoutEffect(() => {
        service.getCharacteristic(MIDI_DATA_IO_UUID)
            .then(setMidiDataIO)
            .catch(e => logError(e.message));
    }, []);

    useLayoutEffect(() => {
        service.getCharacteristics()
            .then(characteristics => Promise.all(characteristics.map(c => {

                const uuid = lookupUUID(c.uuid);
                switch (uuid) {

                    case MIDI_DATA_IO_UUID:
                        setMidiDataIO(c);
                        c.getDescriptors().then(descs => console.log(descs));
                        break;

                    default:
                        log(`unknown characteristic: ${uuid}`);
                }

            })))
            .catch(e => logError(e.message));
    }, []);

    const handleMidiData = event => {
        const data = event.target.value;
        const parsed = parseMIDI(data);

        const u8data = new Uint8Array(data);
        const msg = Array.from(new Uint8Array(event.target.value.buffer)).map(n => Number(n).toString(2).padStart(8, "0")).join(" ");
        handlers.log.log(msg, LOG_LEVEL.DEBUG, "code");
        parsed.forEach(message => handlers.log.log(JSON.stringify(message), LOG_LEVEL.INFO));
    };

    useLayoutEffect(() => {
        if (midiDataIO !== null) {
            const {
                properties: {
                    broadcast,
                    indicate,
                    notify,
                    read,
                    write,
                    writeWithoutResponse
                } = {}
            } = midiDataIO;

            console.log(midiDataIO.properties);
            midiDataIO.addEventListener("characteristicvaluechanged", handleMidiData);

            midiDataIO.getDescriptors().then(descriptors => console.log(descriptors));
            if (read) {
                midiDataIO.readValue().then(midiData => handleMidiData);
            }
            if  (notify) {
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
    MidiService,
    MIDI_SERVICE_UUID as UUID,
    getState,
    getHandlers
};
