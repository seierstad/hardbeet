const getValue = param => (typeof param === "object" && param.constructor.name.endsWith("Event")) ? param.target.value : param;
const indexById = (arr, id) => arr.findIndex(element => element.id === id);

export {
    getValue,
    indexById
};
