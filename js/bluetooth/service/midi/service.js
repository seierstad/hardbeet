import {html} from "htm/preact";
import {useLayoutEffect, useEffect, useState, useContext, useMemo} from "preact/hooks";

import {AppHandlersContext} from "hardbeet";
import {Log, LOG_LEVEL} from "hardbeet/log";
import {MidiAccessContext} from "hardbeet/midi/context.js";
import {MidiSoftwareInput, MidiSoftwareOutput} from "hardbeet/midi/software-ports.js";

import {lookupUUID} from "../../functions.js";
import Service from "../service.js";

import {MIDI_SERVICE_UUID, MIDI_DATA_IO_UUID} from "./constants.js";
import {parseMidiBLE, simpleMidi2MidiBLE} from "./parser.js";
import {getHandlers} from "./handlers.js";
import {getState} from "./state.js";


const MidiService = (props = {}) => {
    const {state, getHandlers} = props;
    const {object: service = {}} = state;
    const handlers = useMemo(() => getHandlers(state));
    const {log: {log, logError} = {}} = useContext(AppHandlersContext);
    const {addMidiInput, addMidiOutput} = useContext(MidiAccessContext);

    const [midiDataIO, setMidiDataIO] = useState(null);
    const [properties, setProperties] = useState(null);
    const [readwrite, setReadWrite] = useState(null);
    const [inputPort, setInputPort] = useState(null);
    const [outputPort, setOutputPort] = useState(null);
    //const [characteristic2, setCharacteristic2] = useState(null);


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

    const handleMidiDataFromService = event => {
        const data = event.target.value;
        const parsed = parseMidiBLE(data);

        const msg = Array.from(new Uint8Array(event.target.value.buffer)).map(n => Number(n).toString(2).padStart(8, "0")).join(" ");
        handlers.log.log(msg, LOG_LEVEL.DEBUG, "code");
        parsed.forEach(message => handlers.log.log(JSON.stringify(message), LOG_LEVEL.INFO));
    };

    const handleMidiDataFromPort = event => {
        const data = event.data;
        //console.log(`BT MIDI received data: ${data}`);
        const midiBLEData = simpleMidi2MidiBLE(data);
        //console.log(midiBLEData);
        //console.log(typeof midiBLEData);
        //console.log(midiBLEData instanceof ArrayBuffer);
        const parsed = parseMidiBLE(new Uint8Array(midiBLEData));
        parsed.forEach(message => handlers.log.log(JSON.stringify(message), LOG_LEVEL.INFO));
        midiDataIO.writeValueWithoutResponse(new ArrayBuffer(midiBLEData)).then(result => console.log({result})).catch(error => console.log({error}));
    };


    useLayoutEffect(() => {
        if (midiDataIO !== null) {
            const {properties = {}} = midiDataIO;
            const {
                notify,
                read,
                write,
                writeWithoutResponse
            } = properties;

            setProperties(properties);
            setReadWrite({
                readable: read || notify,
                writeable: write || writeWithoutResponse
            });
        }
    }, [midiDataIO]);

    useLayoutEffect(() => {
        if (readwrite !== null && readwrite.readable) {
            const {read, notify} = properties;
            midiDataIO.addEventListener("characteristicvaluechanged", handleMidiDataFromService);

            midiDataIO.getDescriptors().then(descriptors => console.log(descriptors));


            if (read || notify) {
                const port = new MidiSoftwareInput({
                    id: service.device.id,
                    name: service.device.name,
                    manufacturer: service.device.manufacturer,
                    version: "0.0.1beta",
                    state: "connected",
                    connection: "closed"
                });
                setInputPort(port);
            }

            /*
            if (read) {
                midiDataIO.readValue().then(midiData => handleMidiDataFromService);
            }
            */
            if (notify) {
                midiDataIO.startNotifications();
            }

            return () => {
                midiDataIO.removeEventListener("characteristicvaluechanged", handleMidiDataFromService);
                if (notify) {
                    midiDataIO.stopNotifications();
                }
            };
        }
    }, [readwrite]);

    useLayoutEffect(() => {
        if (readwrite !== null && readwrite.writeable) {
            const port = new MidiSoftwareOutput({
                id: service.device.id,
                name: service.device.name,
                manufacturer: service.device.manufacturer,
                version: "0.0.1beta",
                state: "connected",
                connection: "closed"
            });
            port.addEventListener("midimessage", handleMidiDataFromPort);
            setOutputPort(port);

        }
    }, [readwrite]);

    useEffect(() => {
        if (inputPort !== null) {
            if (inputPort instanceof MidiSoftwareInput) {
                addMidiInput(inputPort);
            }
        }
    }, [inputPort]);


    useEffect(() => {
        if (outputPort !== null) {
            if (outputPort instanceof MidiSoftwareOutput) {
                addMidiOutput(outputPort);
            }
        }
    }, [outputPort]);


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
