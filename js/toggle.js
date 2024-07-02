import {useState} from "preact/hooks";
import {html} from "htm/preact";


const Toggle = (props = {}) => {
    const {
        name,
        options = [],
        default: defaultValue,
        legend = name,
        onChange
    } = props;

    const [checkedValue, setState] = useState(defaultValue);

    const clickHandler = (event) => {
        setState(event.target.value);
        onChange(event.target.value);
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
};

export default Toggle;
