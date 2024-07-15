import {useEffect, useState, useContext, useMemo} from "preact/hooks";
import {html} from "htm/preact";

import {AppHandlersContext} from "hardbeet";

import {Characteristics} from "../characteristic/characteristics.js";
import {findByUUID} from "../functions.js";
import Service from "../service/service.js";

import {PolarFeature} from "./feature/feature.js";
import {parseMeasurementData} from "./parsers.js";

import {POLAR_CHARACTERISTICS, POLAR_MEASUREMENT_DATA_SERVICE_UUID, OP_CODE, SETTING_LENGTH} from "./constants.js";
import {getHandlers} from "./handlers.js";
import {getState} from "./state.js";


const UUID = POLAR_MEASUREMENT_DATA_SERVICE_UUID;


const PolarService = (props = {}) => {
    const {log: {logError} = {}} = useContext(AppHandlersContext);
    const {state, getHandlers} = props;
    const {object: service, characteristics, features} = state;
    const handlers = useMemo(() => getHandlers(service));
    const {addCharacteristics, setFeatureData} = handlers;

    const [controlPointCharacteristic, setControlPointCharacteristic] = useState(null);
    const [dataCharacteristic, setDataCharacteristic] = useState(null);

    useEffect(() => {
        service.getCharacteristics().then(addCharacteristics)
            .catch(error => logError(`Polar characteristics initializing error: ${error.message}`));
    }, [service]);

    useEffect(() => {
        const cs = characteristics.value;
        if (cs && cs.length > 0) {
            const controlPoint = cs.find(findByUUID(POLAR_CHARACTERISTICS.PMD_CONTROL_POINT));
            const data = cs.find(findByUUID(POLAR_CHARACTERISTICS.PMD_DATA_MTU));
            if (controlPoint) {
                setControlPointCharacteristic(controlPoint.object);
            } else {
                setControlPointCharacteristic(null);
            }

            if (data) {
                setDataCharacteristic(data.object);
            } else {
                setDataCharacteristic(null);
            }
        }
    }, [characteristics.value]);

    const parseData = (data) => {
        const typeCode = data.getUint8(0);
        const settings = features.value[typeCode].activeStreamProperties.value;
        //console.log({typeCode, settings, data});
        const parsed = parseMeasurementData(data, settings);
        setFeatureData(typeCode, parsed);
    };

    /*
    useEffect(() => {
        if (dataCharacteristic !== null) {

        }
    }, [dataCharacteristic]);

    useEffect(() => {
        if (controlPointCharacteristic !== null) {

        }
    }, [controlPointCharacteristic]);
    */

    const featuresArray = [...Object.values(features.value)];

    return html`
        <${Service} heading="polar data">
            <${Characteristics}
                state=${characteristics}
                features=${features}
                getHandlers=${handlers.getCharacteristicHandlers}
                dataParserFunction=${parseData}
                serviceHandlers=${handlers}
            />

            <div class="feature-support">
                ${(featuresArray.length > 0) ? html`
                    <h3>features (${featuresArray.length}):</h3>
                     ${featuresArray.map(feature => html`
                        <${PolarFeature}
                            state=${feature}
                            getHandlers=${handlers.getFeatureHandlers}
                            controlPoint=${controlPointCharacteristic}
                            key=${feature.code}
                        />
                    `)}
                ` : "no features"}
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
