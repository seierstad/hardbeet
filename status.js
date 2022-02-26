"use strict";
import {html, Component} from "./preact-standalone.module.min.js";

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

class LogEntry extends Component {
    constructor (props) {
        super();
        const {
            message: {
                time
            } = {}
        } = props;

        this.millis = time.getMilliseconds();
    }

    render ({message = {}}) {
        return html`
            <p class=${["log-entry", LEVEL_CLASS[message.level]].join(" ")}>
                <time class="timestamp" datetime=${message.time.toISOString()}>
                    ${message.time.toLocaleTimeString("no-NO") + "." + Array(3 - this.millis.toString(10).length).fill("0").join("") + this.millis}
                </time>
                <span>${message.text}</span>
            </p>
        `;
    }
}

class Status extends Component {

    render ({messages = []}) {
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
}

export default Status;

export {
    LOGLEVEL
};
