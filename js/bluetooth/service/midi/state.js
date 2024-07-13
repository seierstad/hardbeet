import {getState as getLogState} from "hardbeet/log";


const getState = (initialValues = {}) => {
    const {
        log = getLogState({title: "BT messages"})
    } = initialValues;

    return {
        log
    };
};


export {
    getState
};
