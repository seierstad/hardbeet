import {signal} from "@preact/signals";

import {DEFAULT} from "./defaults.js";
import {LOG_LEVEL} from "./constants.js";


const getEntry = (text, level) => ({text, level, timestamp: new Date()});

const addEntry = (state, text, level) => {

    const entries = [getEntry(text, level), ...state.entries.value];
    if (state.maxLength.value === 0) {
        return entries;
    }
    return entries.slice(0, state.maxLength.value);
};

const getHandlers = state => ({
    setTitle: title => state.title.value = title,
    logError: text => state.entries.value = addEntry(state, text, LOG_LEVEL.ERROR),
    log: (text, level = DEFAULT.LOG_LEVEL) => state.entries.value = addEntry(state, text, level),
    setMaxLength: maxLength => state.maxLength.value = parseInt(maxLength, 10)
});


export {
    getHandlers
};
