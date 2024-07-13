class MidiSoftwarePort extends EventTarget {

    constructor (properties = {}) {
        super();
        const {
            id, manufacturer, name, type, version, state, connection,
            onstatechange
        } = properties;

        this.id = id;
        this.manufacturer = manufacturer;
        this.name = name;
        this.type = type;
        this.version = version;
        this.state = state;
        this.connection = connection;
        this.onstatechange = onstatechange;
    }

    connect () {
        this.state = "connected";
    }

    disconnect () {
        this.state = "disconnected";
    }

    open () {
        this.connection = "open";
        this.dispatchEvent(new MidiSoftwareConnectionEvent(this));
        return new Promise(resolve => console.log("port open resolved"), reject => console.log("port open rejected"));
    }

    close () {
        this.connection = "closed";
        this.dispatchEvent(new MidiSoftwareConnectionEvent(this));
        return new Promise(resolve => console.log("port close resolved"), reject => console.log("port close rejected"));
    }
}


class MidiSoftwareInput extends MidiSoftwarePort {
    #onmidimessage = null;

    constructor (properties = {}) {
        super({...properties, type: "input"});
    }

    get onmidimessage () {
        return this.#onmidimessage;
    }

    set onmidimessage (fn) {
        if (this.#onmidimessage === null) {
            this.#onmidimessage = fn;
        }
    }

    emit (data) {
        this.dispatchEvent(new MIDIMessageEvent("midimessage", {data}));
    }
}


class MidiSoftwareOutput extends MidiSoftwarePort {
    constructor (properties = {}) {
        super({...properties, type: "output"});
    }

    send (message) {
        const data = (message instanceof Uint8Array) ? message : (Array.isArray(message) ? new Uint8Array(message) : null);
        if (data === null) {
            throw new Error(`malformed midi data: ${message}`);
        }
        this.dispatchEvent(new MIDIMessageEvent("midimessage", {data}));
    }

    clear () {
        this.dispatchEvent(new CustomEvent("midiclear"));
    }
}

class MidiSoftwareConnectionEvent extends CustomEvent {
    constructor (port) {
        super("hardbeet_custom_statechange", {detail: {port}});
    }
}


export {
    MidiSoftwareInput,
    MidiSoftwareOutput,
    MidiSoftwareConnectionEvent
}
