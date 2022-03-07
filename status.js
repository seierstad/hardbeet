"use strict";
import {html} from "./preact-standalone.module.min.js";

const LOGLEVEL = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
};

const LEVEL_CLASS = {
    0: "debug",
    1: "info",
    2: "warning",
    3: "error"
};

const ACTION = {
    LOG: Symbol("LOG"),
    ERROR: Symbol("ERROR")
};

const initialState = [];

const reducer = (state, action = {}) => {
    const {type, payload: {timestamp, text} = {}} = action;

    switch (type) {
        case ACTION.LOG:
            return [
                {timestamp, text, level: LOGLEVEL.DEBUG},
                ...state
            ];

        case ACTION.ERROR:
            return [
                {timestamp, text, level: LOGLEVEL.ERROR},
                ...state
            ];

        default:
            return state;
    }
};


function LogEntry (props) {
    const {message = {}} = props;


    const millis = message.timestamp.getMilliseconds();

    return html`
        <p class=${["log-entry", LEVEL_CLASS[message.level]].join(" ")}>
            <time class="timestamp" datetime=${message.timestamp.toISOString()}>
                ${message.timestamp.toLocaleTimeString("no-NO") + "." + Array(3 - millis.toString(10).length).fill("0").join("") + millis}
            </time>
            <span>${message.text}</span>
        </p>
    `;
}

function Status ({messages = []}) {
    return html`
        <section id="status">
            <header>
                <h2>log</h2>
            </header>
            <div class="messages">
                ${messages.map((message, index) => html`<${LogEntry} key=${index} message=${message} />`)}
            </div>
        </section>
    `;
}

export default Status;

export {
    LOGLEVEL,
    ACTION,
    initialState,
    reducer
};
