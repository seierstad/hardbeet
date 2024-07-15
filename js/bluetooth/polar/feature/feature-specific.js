const SPECIFICS = {};

const getFeatureSpecificHandlers = (state = {}) => {
    const {code} = state;
    const {[code]: handlers = {}} = SPECIFICS;
    return handlers;
};


export {
    getFeatureSpecificHandlers
};
