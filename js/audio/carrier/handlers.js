import {getValue} from "hardbeet/handlers";

import {getState} from "./state.js";


const getHandlers = (state = getState()) => ({
    frequency: frequency => state.frequency.value = parseFloat(getValue(frequency)),
    toggle: toggleState => state.toggle.value = toggleState
});


export {
    getHandlers
};
