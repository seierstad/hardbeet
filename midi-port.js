"use strict";

class MidiPort {
    constructor (port) {
        this.port = port;
        this.rootElement = document.createElement("fieldset");
        const legend = document.createElement("legend");
        legend.innerText = `${port.manufacturer} ${port.name}`;
        this.rootElement.appendChild(legend);
        this.clockElement = null;

        this.openHandler = this.openHandler.bind(this);
        this.closeHandler = this.closeHandler.bind(this);

        this.openButton = document.createElement("button");
        this.openButton.innerText = "open";
        this.openButton.addEventListener("click", this.openHandler);
        this.rootElement.appendChild(this.openButton);

    }

    openHandler () {
        this.port.open().then(() => {
            this.open = true;
            this.openButton.removeEventListener("click", this.openHandler);
            this.openButton.innerText = "close";
            this.openButton.addEventListener("click", this.closeHandler);
            this.openUI();
        });
    }

    openUI () {
        console.log("TODO: implement function openUI() in class " + this.super.name);
    }

    closeHandler () {
        this.port.close().then(() => {
            this.open = false;
            this.openButton.removeEventListener("click", this.closeHandler);
            this.openButton.innerText = "open";
            this.openButton.addEventListener("click", this.openHandler);
            this.closeUI();
        });
    }

    closeUI () {
        console.log("TODO: implement function closeUI() in class " + this.constructor.name);
    }
}

export default MidiPort;
