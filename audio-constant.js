import {html, useEffect, useState} from "./preact-standalone.module.min.js";
import Toggle from "./toggle.js";


const initialState = {
    toggle: "off"
};

const ACTION = {
    AUDIO_CONSTANT_TOGGLE: Symbol("AUDIO_CONSTANT_TOGGLE")
};

const reducer = (state, action = {}) => {
    const {type, payload} = action;

    switch (type) {
        case ACTION.AUDIO_CONSTANT_TOGGLE:
            return {
                ...state,
                toggle: payload
            };

        default:
            return state;
    }
};


function AudioConstant (props) {
    const {dispatch, ctx, destination, state = {}} = props;
    const {toggle} = state;

    const [constant, setConstant] = useState(new ConstantSourceNode(ctx));
    const [running, setRunning] = useState(false);

    useEffect(() => {
        if (toggle === "on") {
            constant.connect(destination);
            constant.start();
            setRunning(true);
        } else if (running) {
            constant.stop();
            constant.disconnect();
            setConstant(new ConstantSourceNode(ctx));
            setRunning(false);
        }
    }, [toggle]);

    return html`
        <div class="constant">
            <h5>constant ${toggle}</h5>
            <${Toggle} name="toggle-constant" legend="toggle" options=${[["off"], ["on"]]} selected=${toggle} default="off" dispatch=${dispatch} action=${ACTION.AUDIO_CONSTANT_TOGGLE} />
        </div>
    `;

}

export default AudioConstant;

export {
    ACTION,
    initialState,
    reducer
};
