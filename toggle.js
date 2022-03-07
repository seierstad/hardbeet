"use strict";
import {html, useState} from "./preact-standalone.module.min.js";


function Toggle (props) {
    const {
        name,
        options = [],
        default: defaultValue,
        legend = name,
        dispatch,
        action
    } = props;

    const [checkedValue, setState] = useState(defaultValue);

    const clickHandler = (event) => {
        setState(event.target.value);
        dispatch({type: action, payload: event.target.value});
    };

    return html`
        <fieldset>
            <legend>${legend}</legend>
            ${options.map(([value, label = value]) => html`
                <label>
                    <span class="label-text">${label}</span>
                    <input
                        checked=${value === checkedValue}
                        type="radio"
                        name=${name}
                        value=${value}
                        onClick=${clickHandler}
                    />
                </label>
            `)}
        </fieldset>
    `;
}

export default Toggle;
