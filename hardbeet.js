import Status from "./status.js";
import Sensor, {POLAR_MEASUREMENT_DATA_SERVICE_UUID, POLAR_UUID1, POLAR_UUID2} from "./sensor.js";
import Midi from "./midi.js";

let sensorsSection = null;
let configurationSection = null;
let midiAvailable = false;

let status = null;
const sensors = [];
let midi = null;

function getDevice () {
    const promise = navigator.bluetooth.requestDevice({
        filters: [
            {services: ["heart_rate"]},
            {services: [0x1802, 0x1803]},
            {namePrefix: "Polar H9"},
            {namePrefix: "Polar H10"}
        ],
        optionalServices: ["battery_service", "device_information", "user_data", POLAR_UUID1, POLAR_MEASUREMENT_DATA_SERVICE_UUID.toLowerCase()]
    });

    let sensor = new Sensor(promise);
    sensors.push(sensor);
    sensorsSection.appendChild(sensor.rootElement);
}

const clickHandler = () => {
    let clickHere = document.getElementById("click-here");
    clickHere.parentElement.removeChild(clickHere);
    document.removeEventListener("click", clickHandler);
    getDevice();

    if (midiAvailable) {
        status.log("MIDI is available. Requesting access to MIDI.");
        navigator.requestMIDIAccess({"sysex": true}).then(onMIDISuccess, onMIDIFailure);
    }
};

const btAvailable = () => {
    status.log("bluetooth is available");
    document.addEventListener("click", clickHandler);
};
const unavailableBT = (reason = null) => {
    status.log("bluetooth is not available" + (reason ? (": " + reason) : ""));
};

const unavailableMIDI = () => {
    status.log("MIDI is not available");
};

const onMIDIFailure = (message) => {
    status.log("Failed to get MIDI access: " + message);
};

const onMIDISuccess = (midiAccess) => {
    status.log("MIDI ready!");
    midi = new Midi(midiAccess);
};

const pageLoadHandler = () => {
    status = new Status(document.getElementById("status"));
    status.log("testing if bluetooth is available");
    sensorsSection = document.getElementById("sensors");
    configurationSection = document.getElementById("configuration");

    if (!navigator.bluetooth || typeof navigator.bluetooth.getAvailability !== "function") {
        unavailableBT();
    } else {

        navigator.bluetooth.getAvailability().then(
            isAvailable => {isAvailable ? btAvailable() : unavailableBT();},
            rejection => {
                unavailableBT(rejection);
            });
    }

    status.log("testing if MIDI is available");
    if (!navigator.requestMIDIAccess) {
        unavailableMIDI();
    } else {
        status.log("MIDI is available.")
        midiAvailable = true;
    }
};

window.addEventListener("load", pageLoadHandler);
