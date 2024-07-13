import {getHandlers as getLogHandlers} from "hardbeet/log";

import {getState} from "./state.js";


const getHandlers = (state = getState()) => {
    const {log: logState = {}} = state;
    return {
        log: getLogHandlers(logState)
    };
};


export {
    getHandlers
};
