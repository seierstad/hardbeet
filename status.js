"use strict";

const LOGLEVEL = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
};

class Status {
    constructor (rootElement) {
        this.rootElement = rootElement;
        this.messageContainer = document.createElement("div");
        this.messageContainer.classList.add("messages");
        this.rootElement.appendChild(this.messageContainer);
    }

    log (message, level = LOGLEVEL.DEBUG) {
        const logEntryElement = document.createElement("p");
        logEntryElement.classList.add("log-entry");

        const timestamp = new Date();
        const timestampElement = document.createElement("time");
        timestampElement.classList.add("timestamp");
        timestampElement.setAttribute("datetime", timestamp.toISOString());
        const millis = timestamp.getMilliseconds();
        const milliString = Array(3 - millis.toString(10).length).fill("0").join("") + millis;
        timestampElement.innerText = timestamp.toLocaleTimeString("no-NO") + "." + milliString;
        logEntryElement.appendChild(timestampElement);

        const messageElement = document.createElement("span");
        messageElement.innerText = message;
        logEntryElement.appendChild(messageElement);

        this.messageContainer.appendChild(logEntryElement);
    }
}

export default Status;
