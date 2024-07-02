import {useEffect, useState} from "preact/hooks";
import {html} from "htm/preact";

import Toggle from "../../toggle.js";


const Constant = (props = {}) => {
    const {state = {}, handlers, ctx, destination} = props;
    const {toggle} = state;

    const [constant, setConstant] = useState(new ConstantSourceNode(ctx));
    const [running, setRunning] = useState(false);

    useEffect(() => {
        if (toggle.value === "on") {
            constant.connect(destination);
            constant.start();
            setRunning(true);
        } else if (running) {
            constant.stop();
            constant.disconnect();
            setConstant(new ConstantSourceNode(ctx));
            setRunning(false);
        }
    }, [toggle.value]);

    return html`
        <div class="constant">
            <h5>constant ${toggle.value}</h5>
            <${Toggle} name="toggle-constant" legend="toggle" options=${[["off"], ["on"]]} selected=${toggle} default="off" onChange=${handlers.toggle} />
        </div>
    `;

}


export {
    Constant
};
