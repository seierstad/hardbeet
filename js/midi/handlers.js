import {batch} from "@preact/signals";

import {getValue} from "../handler-functions.js";

import {getOutputPortInitialState, getInputPortInitialState} from "./state.js";
import {getHandlers as getOutputClockHandlers} from "./clock/handlers.js";
import {getHandlers as getInputClockHandlers} from "./clock/input-handlers.js";


const getTransportHandlers = state => ({
    setCommand: value => state.command.value = getValue(value),
    setRunning: value => state.running.value = !!value
});

const addInputPort = (state, port = {}, initialValues = {}) => {
    const index = state.findIndex(ps => ps.id === port.id);

    if (index !== -1) {
        return state;
    }
    const portState = getInputPortInitialState(initialValues);
    portState.object = port;
    portState.id = port.id;
    portState.name = port.name;
    return [...state, portState];
};

const removePort = (ports, port) => {
    const index = ports.findIndex(ps => ps.id === port.id);

    if (index === -1) {
        return ports;
    }

    return [...ports.slice(0, index), ...ports.slice(index + 1)];
};

const addOutputPort = (state, port = {}, initialValues = {}) => {
    const index = state.findIndex(ps => ps.id === port.id);

    if (index !== -1) {
        return state;
    }
    const portState = getOutputPortInitialState(initialValues);
    portState.object = port;
    portState.id = port.id;
    portState.name = port.name;
    return [...state, portState];
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
            state.inputs.value = addInputPort(state.inputs.value, port);
        },
        addInputPorts: ports => batch(() => {
            ports.forEach(port => state.inputs.value = addInputPort(state.inputs.value, port));
        }),
        removeInputPort: port => {
            state.inputs.value = removePort(state.inputs.value, port);
        },
        addOutputPort: port => {
            state.outputs.value = addOutputPort(state.outputs.value, port);
        },
        addOutputPorts: ports => batch(() => {
            ports.forEach(port => state.outputs.value = addOutputPort(state.outputs.value, port));
        }),
        removeOutputPort: port => {
            state.outputs = removePort(state.outputs, port);
        },
        // these are to be called (and the result stored) at clock component initialisation:
        getOutputPortHandlers: portId => outputPortHandlers(state.outputs.value, portId),
        getInputPortHandlers: portId => inputPortHandlers(state.inputs.value, portId)
    };
};


export {
    getHandlers
};
