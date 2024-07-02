import {getState} from "./state.js";


const getHandlers = (state = getState()) => ({
    color: color => state.color.value = color,
    toggle: toggleState => state.toggle.value = toggleState
});


export {
    getHandlers
};
