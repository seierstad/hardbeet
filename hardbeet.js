import Status from "./status.js";
import Sensor, {mainServiceUUID, optionalServicesUUIDs} from "./sensor.js";
import PolarSensor from "./polar-sensor.js";
import Midi from "./midi.js";
import AudioOutput from "./audio-output.js";

let addSensorButton = null;
let sensorsSection = null;
let configurationSection = null;
let midiSection = null;
let midiAvailable = false;
let midiConnectButton = null;
let audioOutput = null;

let status = null;
const sensors = [];
let midi = null;

const callbackFunctions = {
    ecg: [],
    accelerometer: [],
    heartRate: []
};

function dataCallbackFn (dataType, data, parameters) {
    const {
      [dataType]: typeFunctions = []
    } = callbackFunctions;

    typeFunctions.forEach(fn => fn(data, parameters));
}

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
                sensor = new PolarSensor(device, sensors.length, status, dataCallbackFn);
            } else {
                sensor  = new Sensor(device, sensors.length, status, dataCallbackFn);
            }
            sensor.connect();
            sensors.push(sensor);
            sensorsSection.appendChild(sensor.rootElement);
        },
        error => {
            console.error("device request error: " + error)
        }
    );
}

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
    this.logger.log("MIDI is not available");
};

const pageLoadHandler = () => {
    status = new Status(document.getElementById("status"));
    midi = new Midi();
    audioOutput = new AudioOutput();
    callbackFunctions.ecg.push(audioOutput.addModulationData);
    document.body.appendChild(audioOutput.rootElement);

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
        status.log("MIDI is available.");
        midiAvailable = true;
        midiSection.appendChild(midi.rootElement);
    }
};

window.addEventListener("load", pageLoadHandler);
