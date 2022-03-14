import {html, useEffect, useState} from "./preact-standalone.module.min.js";
import Toggle from "./toggle.js";


const initialState = {
    toggle: "off",
    frequency: 440
};

const ACTION = {
    AUDIO_CARRIER_TOGGLE: Symbol("AUDIO_CARRIER_TOGGLE")
};

const reducer = (state, action = {}) => {
    const {type, payload} = action;

    switch (type) {
        case ACTION.AUDIO_CARRIER_TOGGLE:
            return {
                ...state,
                toggle: payload
            };

        default:
            return state;
    }
};

function AudioCarrier (props) {
    const {dispatch, ctx, destination, state = {}} = props;
    const {toggle} = state;

    const [carrier, setCarrier] = useState(ctx.createOscillator());
    const [running, setRunning] = useState(false);

    useEffect(() => {
        if (toggle === "on") {
            carrier.connect(destination);
            carrier.frequency.value = state.frequency;
            carrier.start();
            setRunning(true);
        } else if (running) {
            carrier.stop();
            carrier.disconnect();
            setCarrier(ctx.createOscillator());
            setRunning(false);
        }
    }, [toggle]);

    return html`
        <div class="carrier">
            <h5>carrier ${toggle}</h5>
            <${Toggle} name="toggle-carrier" legend="toggle" options=${[["off"], ["on"]]} selected=${toggle} default="off" dispatch=${dispatch} action=${ACTION.AUDIO_CARRIER_TOGGLE} />
        </div>
    `;
}

export default AudioCarrier;

export {
    initialState,
    reducer,
    ACTION
};
