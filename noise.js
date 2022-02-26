"use strict";
import {html, Component} from "./preact-standalone.module.min.js";

class Toggle extends Component {

    render (props) {
        const {
            name,
            values = [],
            defaultValue,
            handler,
            legend = name
        } = props;

        return html`
            <fieldset>
                <legend>${legend}</legend>
                ${values.map(([value, label = value]) => html`
                    <label>
                        <span class="label-text">${label}</span>
                        <input
                            checked=${value === defaultValue}
                            type="radio"
                            name=${name}
                            value=${value}
                            onChange=${handler}
                        />
                    </label>
                `)}
            </fieldset>
        `;
    }
}


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

class NoiseComponent extends Component {
    constructor (props) {
        super();

        const {noise} = props;
        this.noise = noise;
        this.toggleHandler = this.toggleHandler.bind(this);
        this.colorHandler = this.colorHandler.bind(this);
    }

    toggleHandler (event) {
        this.noise.toggle = event.target.value;
    }

    colorHandler (event) {
        this.noise.color = event.target.value;
    }

    render () {
        return html`
            <div class="noise">
                <h5>noise</h5>
                <${Toggle} name="toggle" values=${[["off"], ["on"]]} defaultValue="off" handler=${this.toggleHandler} />
                <${Toggle} name="color" values=${[["white"], ["pink"]]} defaultValue="white" handler=${this.colorHandler} />
            </div>
        `;
    }
}

export {
    NoiseNode,
    NoiseComponent
};
