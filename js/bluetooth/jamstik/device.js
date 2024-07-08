import {Device} from "../device/device.js";
import {SERVICE_UUID, OPTIONAL_SERVICES} from "./constants.js";


const Jamstik = props => {
    const serviceDescriptors = [
        {id: SERVICE_UUID},
        ...(OPTIONAL_SERVICES.map(uuid => ({id: uuid})))
    ];

    return Device({...props, serviceDescriptors});
};


export {
    Jamstik
};
