import {useEffect, useState} from "preact/hooks";
import {html} from "htm/preact";

import Toggle from "../../toggle.js";


const PROCESSOR_FILENAME = "./js/audio/noise/noise-processor.js";


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

const Noise = (props = {}) => {
    const {ctx, destination, state = {}, handlers = {}} = props;

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
            noise.toggle = state.toggle.value;
        }
    }, [state.toggle.value, noise]);

    useEffect(() => {
        if (noise !== null) {
            noise.color = state.color.value;
        }
    }, [state.color.value, noise]);

    return html`
        <div class="noise">
            <h5>noise</h5>
            <${Toggle} name="toggle" options=${[["off"], ["on"]]} selected=${state.toggle} default="off" onChange=${handlers.toggle} />
            <${Toggle} name="color" options=${[["white"], ["pink"]]} selected=${state.color} default="white" onChange=${handlers.color} />
        </div>
    `;
};


export {
    Noise
};
