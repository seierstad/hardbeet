import Status from "./status.js";
import Sensor, {mainServiceUUID, optionalServicesUUIDs} from "./sensor.js";
import PolarSensor from "./polar-sensor.js";
import Midi from "./midi.js";

let addSensorButton = null;
let sensorsSection = null;
let configurationSection = null;
let midiSection = null;
let midiAvailable = false;
let midiConnectButton = null;

let status = null;
const sensors = [];
let midi = null;

function addSensor () {
    navigator.bluetooth.requestDevice({
        filters: [
            {services: [mainServiceUUID]}
        ],
        optionalServices: optionalServicesUUIDs
    }).then(
        device => {
            let sensor;
            if (device.name.startsWith("Polar")) {
                sensor = new PolarSensor(device, sensors.length, status);
            } else {
                sensor  = new Sensor(device, sensors.length, status);
            }
            sensors.push(sensor);
            sensorsSection.appendChild(sensor.rootElement);
        },
        error => {
            console.error("device request error: " + error)
        }
    );
}

const midiConnectHandler = (event) => {
    if (midiAvailable) {
        status.log("MIDI is available. Requesting access to MIDI.");
        navigator.requestMIDIAccess({"sysex": true}).then(onMIDISuccess, onMIDIFailure);
    }
};

const btAvailable = () => {
    status.log("bluetooth is available");
    addSensorButton = document.createElement("button");
    addSensorButton.innerText = "add sensor";
    addSensorButton.addEventListener("click", addSensor);
    sensorsSection.appendChild(addSensorButton);
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
    midiSection = document.getElementById("midi");
    configurationSection = document.getElementById("configuration");

    if (!navigator.bluetooth || typeof navigator.bluetooth.getAvailability !== "function") {
        unavailableBT();
    } else {
        navigator.bluetooth.onadvertisementreceived = event => console.log({"event": "onadvertisement", event});
        navigator.bluetooth.addEventListener("advertisementreceived", event => status.log("bluetooth advertisement received: " + event));
        navigator.bluetooth.addEventListener("availabilitychanged", event => status.log("bluetooth availability changed: " + event));

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
        midiConnectButton = document.createElement("button");
        midiConnectButton.innerText = "connect midi";
        midiConnectButton.addEventListener("click", midiConnectHandler);
        midiSection.appendChild(midiConnectButton);

    }
};

window.addEventListener("load", pageLoadHandler);
