import {batch} from "@preact/signals";

import {getValue} from "../handler-functions.js";

import {getOutputPortInitialState, getInputPortInitialState} from "./state.js";
import {initialState as initialInputState} from "./input.js";
import {getHandlers as getOutputClockHandlers} from "./clock/handlers.js";
import {getHandlers as getInputClockHandlers} from "./clock/input-handlers.js";


const getTransportHandlers = state => ({
    setCommand: value => state.command.value = getValue(value),
    setRunning: value => state.running.value = !!value
});

const addInputPort = (state, port = {}, initialValues = {}) => {
    const index = state.inputs.findIndex(ps => ps.id === port.id);

    if (index !== -1) {
        return state.inputs;
    }
    const portState = getInputPortInitialState(initialValues);
    portState.id = port.id;
    portState.name = port.name;
    return [...state.inputs, portState];
};

const removePort = (ports, port) => {
    const index = ports.findIndex(ps => ps.id === port.id);

    if (index === -1) {
        return ports;
    }

    return [...ports.slice(0, index), ...ports.slice(index + 1)];
};

const addOutputPort = (state, port = {}, initialValues = {}) => {
    const index = state.outputs.findIndex(ps => ps.id === port.id);

    if (index !== -1) {
        return state.outputs;
    }
    const portState = getOutputPortInitialState(initialValues);
    portState.id = port.id;
    portState.name = port.name;
    return [...state.outputs, portState];
};

const portHandlers = port => ({
    setOpen: state => port.open.value = !!state,
    setConnected: state => port.connected.value = !!state
});

const outputPortHandlers = (outputs, portId) => {
    const index = outputs.findIndex(ps => ps.id === portId);
    if (index === -1) {
        throw new Error(`midi output port with id ${portId} does not exist`);
    }

    const port = outputs[index];

    return {
        ...portHandlers(port),
        clock: getOutputClockHandlers(port.clock),
        transport: getTransportHandlers(port.transport)
    };
};

const inputPortHandlers = (inputs, portId) => {
    const index = inputs.findIndex(ps => ps.id === portId);
    if (index === -1) {
        throw new Error(`midi input port with id ${portId} does not exist`);
    }

    const port = inputs[index];

    return {
        ...portHandlers(port),
        clock: getInputClockHandlers(port.clock)
    };
};


const getHandlers = (state) => {
    return {
        setAvailable: available => state.available.value = available,
        addInputPort: port => {
            state.inputs = addInputPort(state, port);
            state.inputCount.value = state.inputs.length;
        },
        addInputPorts: ports => batch(() => {
            ports.forEach(port => state.inputs = addInputPort(state, port));
            state.inputCount.value = state.inputs.length;
        }),
        removeInputPort: port => {
            state.inputs = removePort(state.inputs, port);
            state.inputCount.value = state.inputs.length;
        },
        addOutputPort: port => {
            state.outputs = addOutputPort(state, port);
            state.outputCount.value = state.outputs.length;
        },
        addOutputPorts: ports => batch(() => {
            ports.forEach(port => state.outputs = addOutputPort(state, port));
            state.outputCount.value = state.outputs.length;
        }),
        removeOutputPort: port => {
            state.outputs = removePort(state.outputs, port);
            state.outputCount.value = state.outputs.length;
        },
        // these are to be called (and the result stored) at clock component initialisation:
        getOutputPortHandlers: portId => outputPortHandlers(state.outputs, portId),
        getInputPortHandlers: portId => inputPortHandlers(state.inputs, portId)
    };
};


export {
    getHandlers
};

/*

import MidiInput, {
    initialState as inputInitialState,
    ACTION as MIDI_INPUT_ACTION,
    reducer as midiInputReducer
} from "./input.js";

import MidiOutput, {
    initialState as outputInitialState,
    ACTION as MIDI_OUTPUT_ACTION,
    reducer as midiOutputReducer
} from "./output.js";

const initialState = {
    inputs: [],
    outputs: []
};

const ACTION = {
    MIDI_OUTPUTS_ADD_PORT: Symbol("MIDI_OUTPUTS_ADD_PORT"),
    MIDI_INPUTS_ADD_PORT: Symbol("MIDI_INPUTS_ADD_PORT"),
    ...MIDI_INPUT_ACTION,
    ...MIDI_OUTPUT_ACTION
};

const reducer = (state, action = {}) => {
    const {type, payload = {}} = action;
    const {id = null} = payload;

    if (Object.values(ACTION).indexOf(action.type) === -1) {
        return state;
    }

    switch (type) {
        case ACTION.MIDI_INPUTS_ADD_PORT:
            return {
                ...state,
                inputs: [
                    ...state.inputs,
                    payload
                ]
            };

        case ACTION.MIDI_OUTPUTS_ADD_PORT:
            return {
                ...state,
                outputs: [
                    ...state.outputs,
                    payload
                ]
            };
    }

    if (Object.values(MIDI_INPUT_ACTION).indexOf(action.type) !== -1) {
        const index = state.inputs.findIndex(port => port.id === id);
        if (index === -1) {
            return state;
        }

        return {
            ...state,
            inputs: [
                ...state.inputs.slice(0, index),
                midiInputReducer(state.inputs[index], action),
                ...state.inputs.slice(index + 1)
            ]
        };
    }

    if (Object.values(MIDI_OUTPUT_ACTION).indexOf(action.type) === -1) {
        const index = state.outputs.findIndex(port => port.id === id);
        if (index === -1) {
            return state;
        }

        return {
            ...state,
            outputs: [
                ...state.outputs.slice(0, index),
                midiOutputReducer(state.outputs[index], action),
                ...state.outputs.slice(index + 1)
            ]
        };
    }


    return state;
};
*/
