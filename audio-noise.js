"use strict";
import {html, useEffect, useState} from "./preact-standalone.module.min.js";
import Toggle from "./toggle.js";

const PROCESSOR_FILENAME = "./audio-noise-processor.js";


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
    AUDIO_NOISE_TOGGLE: Symbol("AUDIO_NOISE_TOGGLE"),
    AUDIO_NOISE_COLOR: Symbol("AUDIO_NOISE_COLOR")
};

const initialState = {
    toggle: "off",
    color: "white"
};

const reducer = (state, action = {}) => {
    const {type, payload} = action;
    switch (type) {
        case ACTION.AUDIO_NOISE_TOGGLE:
            return {...state, toggle: payload};
        case ACTION.AUDIO_NOISE_COLOR:
            return {...state, color: payload};
        default:
            return state;
    }
};


function AudioNoise (props) {
    const {dispatch, ctx, destination, state = {}} = props;

    const [workletLoaded, setWorkletLoadedStatus] = useState(false);
    const [noise, setNoise] = useState(null);
    const [gainNode] = useState(new GainNode(ctx));

    useEffect(() => {
        gainNode.connect(destination);
        ctx.audioWorklet.addModule(PROCESSOR_FILENAME).then(() => setWorkletLoadedStatus(true));
    }, []);

    useEffect(() => {
        if (workletLoaded) {
            setNoise(new NoiseNode(ctx, state));
        }
    }, [workletLoaded]);

    useEffect(() => {
        if (noise !== null) {
            noise.connect(gainNode);
        }
    }, [noise]);

    useEffect(() => {
        if (noise !== null) {
            noise.toggle = state.toggle;
        }
    }, [state.toggle, noise]);

    useEffect(() => {
        if (noise !== null) {
            noise.color = state.color;
        }
    }, [state.color, noise]);

    return html`
        <div class="noise">
            <h5>noise</h5>
            <${Toggle} name="toggle" options=${[["off"], ["on"]]} selected=${state.toggle} default="off" dispatch=${dispatch} action=${ACTION.AUDIO_NOISE_TOGGLE} />
            <${Toggle} name="color" options=${[["white"], ["pink"]]} selected=${state.color} default="white" dispatch=${dispatch} action=${ACTION.AUDIO_NOISE_COLOR} />
        </div>
    `;
}

export default AudioNoise;

export {
    initialState,
    ACTION,
    reducer
};
