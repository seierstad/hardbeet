import {useContext} from "preact/hooks";
import {html} from "htm/preact";

import {AppStateContext} from "../hardbeet.js";
import {AppHandlersContext} from "../hardbeet.js";

import {MidiAccessContext} from "./context.js";
import {MidiInput} from "./input.js";
import {MidiOutput} from "./output.js";


const Midi = () => {
    const {midi: state} = useContext(AppStateContext);
    const {midi: handlers} = useContext(AppHandlersContext);
    const {access, MidiAccessButton} = useContext(MidiAccessContext);

    return html`
        <section id="midi">
            <header><h2>MIDI</h2></header>
            ${state.inputs.value.map(port => html`<span>${port.id} - ${port.name}</span>`)}
            ${access !== null ? (html`
                <fieldset>
                    <legend>inputs</legend>
                    ${state.inputs.value.length > 0 ? state.inputs.value.map((port) => html`<${MidiInput} port=${port.object} key=${port.id} handlers=${handlers} state=${port} />`) : "no inputs"}
                </fieldset>
                <fieldset>
                    <legend>outputs</legend>
                    ${state.outputs.value.length > 0 ? state.outputs.value.map((port) => html`<${MidiOutput} port=${port.object} key=${port.id} handlers=${handlers} state=${port} />`) : "no outputs"}
                </fieldset>
            `) : MidiAccessButton}
        </section>
    `;

};


export {
    Midi
};
