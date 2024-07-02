import {html} from "htm/preact";

import {LEVEL_CLASS} from "./constants.js";


const constantWidthTimeText = (timestamp, locale = "no-NO") => {
    const millis = timestamp.getMilliseconds();
    return timestamp.toLocaleTimeString(locale) + "." + Array(3 - millis.toString(10).length).fill("0").join("") + millis;
};

const LogEntry = props => {
    const {
        text = "",
        timestamp,
        level
    } = props;

    return html`
        <li class=${["log-entry", LEVEL_CLASS[level]].join(" ")}>
            <time class="timestamp" datetime=${timestamp.toISOString()}>
                ${constantWidthTimeText(timestamp)}
            </time>
            <span>${text}</span>
        </li>
    `;
};

const Log = ({entries = [], title = "", }) => {
    return html`
        <section id="status">
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
    Log
};
