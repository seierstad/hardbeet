import {GATT_RESERVED_ENDS_WITH} from "./GATT_constants.js";

const lookupUUID = uuid => (typeof uuid === "string" && uuid.endsWith(GATT_RESERVED_ENDS_WITH)) ? parseInt(uuid.substring(4, 8), 16) : uuid;
const findByUUID = uuid => object => object.uuid === uuid || lookupUUID(object.uuid) === uuid;

export {
    lookupUUID,
    findByUUID
};
