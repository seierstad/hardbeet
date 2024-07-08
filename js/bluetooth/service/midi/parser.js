import {MESSAGE_TYPE, MESSAGE_TYPE_LOOKUP, SYSEX_TYPE, SYSEX_TYPE_LOOKUP, CONTROL, CONTROL_LOOKUP, DATA_LENGTH} from "hardbeet/midi/constants.js";

const bitmask = bits => (1 << bits) - 1;
const BIT_8 = 1 << 7;
const BITMASK_4 = bitmask(4);
const BITMASK_6 = bitmask(6);
const BITMASK_7 = bitmask(7);
const BITMASK_14 = bitmask(14);
const BITMASK_UPPER_4 = BITMASK_4 << 4;


/*
1) dytt inn data
2) ta vare på timestampMSB
3) ta vare på timestampLSB
4) les meldingstypen
5a) hvis ikke sysex
   5a-1) ta vare på typen i runningStatus
   5a-2) slå opp meldingslengden i tabell
   5a-3) finn index for neste byte med MSB === 1
   5a-4) kopiér buffer frem til neste timestampLSB (funnet i forrige) / slutten
   5a-5) lag en sub-iterator som leverer tolkning av data fra 5a-4
5b) hvis sysex
   5b-1) finn index for sysex-slutt

*/
const dataParserFunctions = {
    [MESSAGE_TYPE.NOTE_ON]: (key, velocity) => ({
        key,
        velocity,
        messageType: (velocity === 0) ? MESSAGE_TYPE_LOOKUP[MESSAGE_TYPE.NOTE_OFF] : MESSAGE_TYPE_LOOKUP[MESSAGE_TYPE.NOTE_ON]
    }),
    [MESSAGE_TYPE.NOTE_OFF]: (key, velocity) => ({key, velocity}),
    [MESSAGE_TYPE.POLY_PRESSURE]: (key, pressure) => ({key, pressure}),
    [MESSAGE_TYPE.CONTROL_CHANGE]: (control, value) => {
        //if (control < 120) {
            return {
                control,
                controlName: CONTROL[control],
                value
            };
        //}
//        TODOOOOOOOOOOOOOOO!!!!
    },
    [MESSAGE_TYPE.PROGRAM_CHANGE]: (program) => ({program}),
    [MESSAGE_TYPE.CHANNEL_PRESSURE]: (pressure) => ({pressure}),
    [MESSAGE_TYPE.PITCH_BEND]: (pitchLSB, pitchMSB) => {
        const pitch = ((0 + pitchMSB) << 7) | pitchLSB;
        const normalized = ((pitch << 1) / BITMASK_14) - 1;
        return {
            pitch,
            normalized
        };
    }

};

const isStatus = byte => (byte & BIT_8) === BIT_8;
const isSysex = byte => (byte & BITMASK_UPPER_4) === BITMASK_UPPER_4;
const removeChannel = byte => byte & BITMASK_UPPER_4;

class ChunkView {
    constructor (view, timestampMSB = 0, runningStatus = null) {
        this.view = view;
        this.length = view.buffer.byteLength;
        this.timestampMSB = timestampMSB;

        this.runningStatus = runningStatus;

        this._dataPointer = 0;
        this._startsWithStatusByte = null;
        this._messageByte = null;
        this._parseFunction = null;
        this._dataLength = null;
    }

    incrementDataPointer () {
        this._dataPointer += this.dataLength;
    }

    get dataPointer () {
        if (this._dataPointer === 0) {
            this._dataPointer = this.startsWithStatusByte ? 2 : 1;
        }
        return this._dataPointer;
    }

    get timestamp () {
        const timestampLSB = this.view[0] & BITMASK_7;
        return this.timestampMSB | timestampLSB;
    }

    get startsWithStatusByte () {
        if (this._startsWithStatusByte === null) {
            this._startsWithStatusByte = isStatus(this.view[1]);
        }

        return this._startsWithStatusByte;
    }

    get messageByte () {
        if (this._messageByte === null) {
            const byte = this.startsWithStatusByte ? (0 + this.view[1]) : this.runningStatus;
            this._messageByte = byte;

            if (!isSysex(byte)) {
                this.runningStatus = byte;
            }
            this._messageByte = byte;
        }

        return this._messageByte;
    }

    get messageType () {
        const msg = this.messageByte;

        if ((msg & BITMASK_UPPER_4) === BITMASK_UPPER_4) {
            return SYSEX_TYPE_LOOKUP[msg];
        }

        return MESSAGE_TYPE_LOOKUP[(msg & BITMASK_UPPER_4)];
    }

    get channel () {
        const byte = this.messageByte;
        if (isSysex(byte)) {
            return "all";
        }
        return byte & BITMASK_4;
    }

    get parseFunction () {
        if (this._parseFunction === null) {
            const msg = isSysex(this.messageByte) ? this.messageByte : removeChannel(this.messageByte);
            const {[msg]: parseFunction = () => ({})} = dataParserFunctions;

            this._parseFunction = parseFunction;
        }

        return this._parseFunction;
    }

    get dataLength () {
        if (this._dataLength !== null) {
            return this._dataLength;
        }
        const length = this.parseFunction.length;
        this._dataLength = length;
        return length;
    }

    *messages () {
        const data = Array.from(new Uint8Array(this.view.buffer, this.view.byteOffset + this.dataPointer, this.dataLength));

        if (this.dataPointer < this.length) {
            yield ({
                messageByte: this.messageByte,
                messageType: this.messageType,
                channel: this.channel,
                timestamp: this.timestamp,
                ...this.parseFunction(...data)
            });
        }
        this.incrementDataPointer();
    }

}

function* midiParser (data) {
    const view = new Uint8Array(data.buffer);
    const {byteOffset, byteLength} = data;
    if (byteLength < 3) {
        return undefined;
    }
    const timestampMSB = (0 + (view[0] & BITMASK_6)) << 7;

    const chunkStartPositions = view.reduce((acc, curr, index, arr) => {
        if (index > 1 && (curr & BIT_8) === BIT_8 && acc.indexOf(index - 1) === -1) {
            return [...acc, index];
        }
        return acc;
    }, [1]);
    const chunkCount = chunkStartPositions.length;

    let runningStatus = null;

    for (let i = 0; i < chunkCount; i += 1) {
        const position = chunkStartPositions[i];
        const nextPosition = (i === chunkCount - 1) ? view.length : chunkStartPositions[i + 1];
        const length = nextPosition - position;
        const chunkData = new Uint8Array(data.buffer, byteOffset + position, length);

        const chunkParser = new ChunkView(chunkData, timestampMSB, runningStatus).messages();

        for (let message of chunkParser) {
            if (!isSysex(message.messageByte)) {
                runningStatus = message.messageByte;
            }
            yield message;
        }
    }
}


const parseMIDI = (data) => {
    const parser = midiParser(data);
    return [...parser];
};


export {
    parseMIDI
};
