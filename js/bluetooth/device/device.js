import {useLayoutEffect, useState, useContext, useMemo} from "preact/hooks";
import {html} from "htm/preact";

import {AppHandlersContext} from "hardbeet";

import {Services} from "../service/services.js";


const Device = (props = {}) => {
    const {log: {log, logError} = {}} = useContext(AppHandlersContext);
    const {state, functions = {}, getHandlers, serviceDescriptors = []} = props;
    const {object: device, services = {value: []}} = state;

    const [GATTServer, setGATTServer] = useState(null);
    const handlers = useMemo(() => getHandlers(device.id));


    const advertisementHandler = event => log(`device ${device.name}: advertisement received: ${event.type}`);

    useLayoutEffect(() => {
        device.addEventListener("advertisementreceived", advertisementHandler);

        if (typeof device.watchAdvertisements === "function") {
            device.watchAdvertisements().then(
                () => log(`device ${device.name}: watching advertisements`),
                error => logError(`device watchAdvertisements error: ${error}`)
            );
        }
        device.gatt.connect()
            .then(
                server => setGATTServer(server),
                error => logError(`gatt connection error: ${error.message}`)
            );

        return () => {
            device.removeEventListener("advertisementreceived", advertisementHandler);
            device.gatt.disconnect();
        };
    }, []);

    const handleGATTServerDisconnected = (event) => {
        log(`GATT SERVER DISCONNECTED!!!!!!!!!! ${event.message}`);
    };

    useLayoutEffect(() => {
        if (GATTServer) {
            GATTServer.device.addEventListener("gattserverdisconnected", handleGATTServerDisconnected);

            return () => {
                GATTServer.device.removeEventListener("gattserverdisconnected", handleGATTServerDisconnected);
            };
        }
    }, [GATTServer]);


    return html`
        <div class="device">
            <header>
                <h3>device ${device.name}</h3>
                <span class="device-name">${device.name}</span>
                <span class="device-id">${device.id}</span>
            </header>
            ${(GATTServer !== null) ? html`<${Services} services=${services} serviceDescriptors=${serviceDescriptors} addService=${handlers.addService} getHandlers=${handlers.getServiceHandlers} GATTServer=${GATTServer} />` : null}
        </div>
    `;
};


export {
    Device
};
