import {getState} from "./state.js";


const getHandlers = (state = getState()) => ({
    frequency: frequency => state.frequency.value = parseFloat(frequency),
    toggle: toggleState => state.toggle.value = toggleState
});


export {
    getHandlers
};
