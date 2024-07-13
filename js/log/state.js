import {signal} from "@preact/signals";

import {DEFAULT} from "./defaults.js";


const getState = (initialState = {}) => {
    const {
        title = DEFAULT.TITLE,
        entries = DEFAULT.ENTRIES,
        maxLength = DEFAULT.MAX_LENGTH
    } = initialState;

    return {
        title: signal(title),
        entries: signal(entries),
        maxLength: signal(maxLength)
    };
};


export {
    getState
};
