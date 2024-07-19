import {DEFAULT} from "./defaults.js";
import {LOG_LEVEL} from "./constants.js";


const getEntry = (text, level, type, data) => ({text, level, type, data, timestamp: new Date()});

const addEntry = (state, text, level, type = null, data = null) => {

    const entries = [getEntry(text, level, type, data), ...state.entries.value];
    if (state.maxLength.value === 0) {
        return entries;
    }
    return entries.slice(0, state.maxLength.value);
};

const getHandlers = state => ({
    setTitle: title => state.title.value = title,
    logError: text => state.entries.value = addEntry(state, text, LOG_LEVEL.ERROR),
    log: (text, level = DEFAULT.LOG_LEVEL, type = null, data = null) => state.entries.value = addEntry(state, text, level, type, data),
    setMaxLength: maxLength => state.maxLength.value = parseInt(maxLength, 10)
});


export {
    getHandlers
};
