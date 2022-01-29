const MIDI_BLE_SERVICE_UUID = "03b80e5a-ede8-4b33-a751-6ce34ec4c700";
const MIDI_BLE_CHARACTERISTIC_UUID = "7772e5db-3868-4112-a1a9-f2669d106bf3";

class Midi {
    constructor (logger) {
        this.logger = logger;

        this.rootElement = document.createElement("div");
        //this.midiAccess = midiAccess;
        
        const midiConnectButton = document.createElement("button");
        midiConnectButton.innerText = "connect midi";
        midiConnectButton.addEventListener("click", this.midiConnectHandler);
        this.rootElement.appendChild(midiConnectButton);
    }

    midiConnectHandler = (event) => {
        if (midiAvailable) {
            status.log("Requesting access to MIDI.");
            navigator.requestMIDIAccess({"sysex": true}).then(this.onMIDISuccess, this.onMIDIFailure);
        }
    }

    unavailableMIDI = () => {
        this.logger.log("MIDI is not available");
    }

    onMIDIFailure = (message) => {
        this.logger.log("Failed to get MIDI access: " + message);
    }

    onMIDISuccess = (midiAccess) => {
        this.logger.log("MIDI ready!");
    }
}

export default Midi;
