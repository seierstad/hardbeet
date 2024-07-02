import {signal} from "@preact/signals";

import {DEFAULT} from "./defaults.js";
import {getInitialState as getClockInitialState} from "./clock/state.js";

const getPortInitialState = (initialValues = {}) => {
    const {
        connected = DEFAULT.PORT.CONNECTED,
        open = DEFAULT.PORT.OPEN
    } = initialValues;

    return {
        connected: signal(connected),
        open: signal(open)
    };
};

const getOutputPortInitialState = (initialValues = {}) => {
    const {clock: initialClockValues = {}} = initialValues;
    const clockState = getClockInitialState(initialClockValues);

    return {
        ...getPortInitialState(initialValues),
        clock: clockState,
        transport: {
            running: signal(DEFAULT.OUTPUT.TRANSPORT.RUNNING),
            command: signal(DEFAULT.OUTPUT.TRANSPORT.COMMAND)
        }
    };
};

const getInputPortInitialState = (initialValues = {}) => getPortInitialState(initialValues);

const getState = (initialState = {}) => {
    const {
        inputs = DEFAULT.INPUTS,
        outputs = DEFAULT.OUTPUTS,
        available = DEFAULT.AVAILABLE
    } = initialState;

    return {
        inputs: [...inputs],
        outputs: [...outputs],
        inputCount: signal(0),
        outputCount: signal(0),
        available: signal(available)
    };
};


export {
    getState,
    getOutputPortInitialState,
    getInputPortInitialState
};
