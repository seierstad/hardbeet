import {useState, useEffect, useMemo} from "preact/hooks";
import {html} from "htm/preact";

import {MidiPort} from "./port.js";
import Transport from "./transport.js";
import {ClockView} from "./clock/view.js";


const MidiOutput = props => {
    const {
        port,
        state: {
            clock: clockState,
            transport: transportState,
            open,
            connected
        },
        handlers: {
            getOutputPortHandlers
        }
    } = props;

    const handlers = useMemo(() => getOutputPortHandlers(port.id), [port.id]);

    return html`
        <${MidiPort} port=${port} handlers=${handlers} open=${open} connected=${connected}>
            <${Transport} port=${port} handlers=${handlers.transport} ...${transportState} />
            <${ClockView} port=${port} state=${clockState} handlers=${handlers.clock} />
        <//>
    `;
};


export {
    MidiOutput
};

/*
    playBuffer () {
        if (this.buffer.length > 0) {
            this.sendPitch(this.buffer.shift());
        }
        if (this.samplerateChanged) {
            clearInterval(this.interval);
            this.interval = setInterval(this.playBuffer, 1000 / this.samplerate);
            this.samplerateChanged = false;
        }
    }

    set samplerate (samplerate) {
        if (samplerate !== this._samplerate) {
            this._samplerate = samplerate;
            this.samplerateChanged = true;

        }
        if (this.interval === null) {
            this.interval = setInterval(this.playBuffer, 1000 / samplerate);
        }
    }

    get samplerate () {
        return this._samplerate;
    }

    sendPitch (value) {
        const pitchValue = Math.floor(0x2000 + value * 0x1fff);
        const mvb = pitchValue >> 7;
        const lvb = pitchValue & 0x7f;
        this.outputs.forEach(port => {
            port.port.send([MESSAGE_TYPE.PITCH_BEND, lvb, mvb]);
        });
    }

    addModulationData (data, parameters = {}) {
        this.buffer.push(...data.map(([value]) => value));
        const {
            samplerate = 130
        } = parameters;

        if (this.samplerate !== samplerate) {
            this.samplerate = samplerate;
        }
    }

    checkboxHandler (event) {
        const {
            target: {
                value,
                checked
            } = {}
        } = event;
        const port = this.outputs.find(p => p.port.id === value);
        const velocity = 127;
        const note = 65;
        if (port) {
            if (checked) {
                port.port.open().then(p => p.send([MESSAGE_TYPE.NOTE_ON, note, velocity]));
            } else {
                port.port.send([MESSAGE_TYPE.NOTE_OFF, note, velocity]);
            }
        }
    }
}
*/
