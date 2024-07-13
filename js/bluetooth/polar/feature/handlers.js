
/* feature */
const ACTION = {
    POLAR_FEATURE_MEASUREMENT_PARAMETERS: Symbol("POLAR_FEATURE_MEASUREMENT_PARAMETERS"),
    POLAR_MEASUREMENT_START: Symbol("POLAR_MEASUREMENT_START"),
    POLAR_MEASUREMENT_STOP: Symbol("POLAR_MEASUREMENT_STOP"),
    POLAR_MEASUREMENT_ERROR: Symbol("POLAR_MEASUREMENT_ERROR")
};

const reducer = (state = initialState, action = {}) => {
    const {type, payload} = action;

    switch (type) {

        case ACTION.POLAR_FEATURE_MEASUREMENT_PARAMETERS:
            return {
                ...state,
                parameters: payload.parameters
            };

        case ACTION.POLAR_MEASUREMENT_START:
            return {
                ...state,
                status: "running"
            };

        case ACTION.POLAR_MEASUREMENT_STOP:
            return {
                ...state,
                status: "stopped"
            };

        case ACTION.POLAR_MEASUREMENT_ERROR:
            return {
                ...state,
                error: {
                    status: payload.status,
                    operation: payload.operation
                }
            };

    }

    return state;
};

