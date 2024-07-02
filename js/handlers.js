import {getState} from "./state.js";

import {getHandlers as getAudioHandlers} from "./audio/handlers.js";
import {getHandlers as getLogHandlers} from "./log/handlers.js";
import {getHandlers as getBluetoothHandlers} from "./bluetooth/handlers.js";
import {getHandlers as getMidiHandlers} from "./midi/handlers.js";


const getHandlers = (state = getState()) => {
    const {
        audio: audioState = {},
        log: logState = {},
        bluetooth: bluetoothState = {},
        midi: midiState = {}
    } = state;

    return {
        setInteractive: interactive => state.interactive.value = !!interactive,
        audio: getAudioHandlers(audioState),
        log: getLogHandlers(logState),
        bluetooth: getBluetoothHandlers(bluetoothState),
        midi: getMidiHandlers(midiState)
    };
};


export {
    getHandlers
};
