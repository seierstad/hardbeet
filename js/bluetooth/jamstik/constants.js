import {GATT_SERVICE_UUID} from "../GATT_constants.js";
import {MIDI_SERVICE_UUID} from "../service/midi/constants.js";


const CHARACTERISTIC2_UUID = "5e9bf2a8-f93f-4481-a67e-3b2f4a07891a"; // properties: read, write // write type: write request

const OPTIONAL_SERVICES = []; /*[
    GATT_SERVICE_UUID.DEVICE_INFORMATION,
    GATT_SERVICE_UUID.BATTERY
];
*/

export {
    MIDI_SERVICE_UUID as SERVICE_UUID,
    CHARACTERISTIC2_UUID,
    OPTIONAL_SERVICES
};
