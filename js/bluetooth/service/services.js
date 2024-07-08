import {html} from "htm/preact";
import {useLayoutEffect, useState, useContext, useMemo} from "preact/hooks";

import {AppHandlersContext} from "hardbeet";
import {getServiceSpecificView} from "./service-specific.js";


const Services = (props = {}) => {
    const {serviceDescriptors = [], services, GATTServer, getHandlers, addService} = props;
    const {log: {log, logError} = {}} = useContext(AppHandlersContext);

    const serviceError = error => {
        logError(`${GATTServer.device.name}: service error: ${error}`);
    };

    useLayoutEffect(() => {
        //serviceDescriptors.map(s =>
            GATTServer.getPrimaryServices()
                .then(services => services.forEach(service => addService(service)))
                .catch(serviceError)
        //);
    }, [GATTServer]);



    return services.value.length > 0 ?
        (html`
            <div class="services">
                ${services.value.map(service => {
                    const View = getServiceSpecificView(service.uuid);
                    return html`<${View} key=${service.uuid} state=${service} getHandlers=${getHandlers} />`;
                })}
            </div>
        `)
    :
        "no services :(";
};


export {
    Services
};
