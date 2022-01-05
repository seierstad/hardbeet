class Status {
    constructor (rootElement) {
        this.rootElement = rootElement;
    }

    log (message) {
        const messageElement = document.createElement("p");
        messageElement.innerText = message;
        this.rootElement.appendChild(messageElement);
    }
}

export default Status;
