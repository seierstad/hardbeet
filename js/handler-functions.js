const getValue = param => (typeof param === "object" && param.constructor.name.endsWith("Event")) ? param.target.value : param;


export {
    getValue
};
