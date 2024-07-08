import {html} from "htm/preact";

import {LEVEL_CLASS, LOG_LEVEL} from "./constants.js";
import {getHandlers} from "./handlers.js";
import {getState} from "./state.js";


const constantWidthTimeText = (timestamp, locale = "no-NO") => {
    const millis = timestamp.getMilliseconds();
    return timestamp.toLocaleTimeString(locale) + "." + Array(3 - millis.toString(10).length).fill("0").join("") + millis;
};

const LogEntry = props => {
    const {
        text = "",
        timestamp,
        level,
        type = null
    } = props;

    return html`
        <li class=${["log-entry", LEVEL_CLASS[level]].join(" ")}>
            <time class="timestamp" datetime=${timestamp.toISOString()}>
                ${constantWidthTimeText(timestamp)}
            </time>
            ${(type === "code") ? html`<code>${text}</code>` : html`<span>${text}</span>`}
        </li>
    `;
};

const Log = ({entries = {value: []}, title = "", classNames = []}) => {
    return html`
        <section class=${["log", ...(typeof classNames === "string" ? [classNames] : classNames)].join(" ")}>
            <header>
                <h2>${title.value}</h2>
            </header>
            <ol class="log_entries" reversed>
                ${entries.value.map((entry, index) => html`<${LogEntry} key=${entry.timestamp} ...${entry} />`)}
            </ol>
        </section>
    `;
};


export {
    Log,
    getState,
    getHandlers,
    LOG_LEVEL
};
