"use strict";
import {html, useReducer, useEffect} from "./preact-standalone.module.min.js";

import Toggle from "./toggle.js";


class NoiseNode extends AudioWorkletNode {
    constructor (context) {
        super(context, "noise-processor");
    }

    set color (color) {
        this.port.postMessage(JSON.stringify({
            "type": "color",
            "message": color
        }));
    }

    set toggle (state) {
        this.port.postMessage(JSON.stringify({
            "type": "toggle",
            "message": state
        }));
    }
}

const ACTION = {
    TOGGLE: Symbol("NOISE_TOGGLE"),
    COLOR: Symbol("NOISE_COLOR")
};

const initialState = {
    toggle: "off",
    color: "white"
};

const reducer = (state, action = {}) => {
    const {type, payload} = action;
    switch (type) {
        case ACTION.TOGGLE:
            return {...state, toggle: payload};
        case ACTION.COLOR:
            return {...state, color: payload};
        default:
            return state;
    }
};


function Noise (props) {
    const {noise} = props;
    this.noise = noise;

    const [state, dispatch] = useReducer(reducer, initialState);

    useEffect(() => {
        this.noise.toggle = state.toggle;
    }, [state.toggle]);

    useEffect(() => {
        this.noise.color = state.color;
    }, [state.color]);

    return html`
        <div class="noise">
            <h5>noise</h5>
            <${Toggle} name="toggle" values=${[["off"], ["on"]]} value=${state.toggle} defaultValue="off" dispatch=${dispatch} action=${ACTION.TOGGLE} />
            <${Toggle} name="color" values=${[["white"], ["pink"]]} value=${state.color} defaultValue="white" dispatch=${dispatch} action=${ACTION.COLOR} />
        </div>
    `;
}

export {
    NoiseNode,
    Noise,
    reducer,
    ACTION,
    initialState
};
