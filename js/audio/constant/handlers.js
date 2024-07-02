import {getState} from "./state.js";


const getHandlers = (state = getState()) => ({
    toggle: toggleState => state.toggle.value = toggleState
});


export {
    getHandlers
};
