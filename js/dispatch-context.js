import {useContext, createContext, useReducer} from "preact/hooks";
import {html} from "htm/preact";

import {reducer, initialState} from "./hardbeet.js";


const DispatchContext = createContext(null);
const StateContext = createContext(null);

function useDispatch () {
    return useContext(DispatchContext);
}

function useStateContext () {
    return useContext(StateContext);
}

function DispatchProvider ({children}) {
    const [state, dispatch] = useReducer(reducer, initialState);


    return html`
        <StateContext.Provider value=${state}>
            <DispatchContext.Provider value=${dispatch}>
                ${children}
            </StateContext.Provider>
        </DispatchContext.Provider>
    `;
}


export {
    DispatchProvider,
    useDispatch,
    useStateContext
};
