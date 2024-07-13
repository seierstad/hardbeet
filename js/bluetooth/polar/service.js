import {useEffect, useState, useContext, useMemo} from "preact/hooks";
import {html} from "htm/preact";

import {AppHandlersContext} from "hardbeet";

import {Characteristics} from "../characteristic/characteristics.js";
import {findByUUID} from "../functions.js";
import Service from "../service/service.js";

import {PolarFeature} from "./feature/feature.js";

import {POLAR_CHARACTERISTICS, POLAR_MEASUREMENT_DATA_SERVICE_UUID} from "./constants.js";
import {getHandlers} from "./handlers.js";
import {getState} from "./state.js";


const UUID = POLAR_MEASUREMENT_DATA_SERVICE_UUID;


const PolarService = (props = {}) => {
    const {log: {log, logError} = {}} = useContext(AppHandlersContext);
    const {state, index, getHandlers} = props;
    const {object: service, characteristics, features = []} = state;
    const handlers = useMemo(() => getHandlers(service));
    const {addCharacteristics} = handlers;

    const [controlPointCharacteristic, setControlPointCharacteristic] = useState(null);
    const [dataCharacteristic, setDataCharacteristic] = useState(null);
    const [parameterRequest, setParameterRequest] = useState(null);

    const handleDataCharacteristicError = (error) => {
        logError(`Sensor ${index} PMD Data characteristic error: ${error}`);
    };

    useEffect(() => {
        service.getCharacteristics().then(addCharacteristics)
            .catch(error => logError(`Polar characteristics initializing error: ${error.message}`));
        /*
        .then(characteristics => {
            Promise.all(characteristics.map(c => {
                console.log(c.uuid);
                switch (c.uuid) {
                    case POLAR_CHARACTERISTICS.PMD_CONTROL_POINT:
                        setControlPointCharacteristic(c);
                        break;
                    case POLAR_CHARACTERISTICS.PMD_DATA_MTU:
                        setDataCharacteristic(c);
                        break;
                    default:
                        log(`Polar service had an unknown characteristic: ${c.uuid}`);
                }
            })).then(() => setCharacteristicsInitialized(true))
                .catch(error => logError(`Polar characteristics initializing error: ${error.message}`));
                */
    }, [service]);

    useEffect(() => {
        const cs = characteristics.value;
        if (cs && cs.length > 0) {
            const controlPoint = cs.find(findByUUID(POLAR_CHARACTERISTICS.PMD_CONTROL_POINT));
            const data = cs.find(findByUUID(POLAR_CHARACTERISTICS.PMD_DATA_MTU));
            if (controlPoint) {
                setControlPointCharacteristic(controlPoint);
            } else {
                setControlPointCharacteristic(null);
            }

            if (data) {
                setDataCharacteristic(data);
            } else {
                setDataCharacteristic(null);
            }
        }
    }, [characteristics.value])

    useEffect(() => {
        if (dataCharacteristic !== null) {

        }
    }, [dataCharacteristic]);

    useEffect(() => {
        if (controlPointCharacteristic !== null) {

        }
    }, [controlPointCharacteristic]);


    return html`
        <${Service} heading="polar data">

            <div class="feature-support">
                <h3>features</h3>
                <${Characteristics} state=${characteristics} getHandlers=${handlers.getCharacteristicHandlers} />
                ${(features && features.value && features.value.length !== 0) ? Object.entries(features).map(([code, {parameters}]) => html`
                    <${PolarFeature}
                        log=${log}
                        logError=${logError}
                        controlPoint=${controlPointCharacteristic}
                        featureCode=${code}
                        key=${code}
                        parameters=${parameters}
                    />
                `) : "no features"}
            </div>
        <//>

    `;
};


export {
    UUID,
    PolarService,
    getState,
    getHandlers
};
