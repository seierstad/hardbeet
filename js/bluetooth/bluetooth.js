import {useContext, useEffect, useLayoutEffect} from "preact/hooks";
import {html} from "htm/preact";

import {AppHandlersContext, AppStateContext} from "hardbeet";

import {mainServiceUUID, optionalServicesUUIDs} from "./constants.js";

import {SERVICE_UUID as JAMSTIK_SERVICE_UUID, OPTIONAL_SERVICES as JAMSTIK_OPTIONAL_SERVICES} from "./jamstik/constants.js";

import {Devices} from "./device/devices.js";
import {UUID as BATTERY_SERVICE_UUID} from "./service/battery.js";


const Bluetooth = (props = {}) => {
    const {bluetooth: handlers, log: {log, logError}} = useContext(AppHandlersContext);
    const {bluetooth: state} = useContext(AppStateContext);

    const {
        setAvailable
    } = handlers;

    useEffect(() => {
        log("testing if bluetooth is available");

        if (!navigator.bluetooth || typeof navigator.bluetooth.getAvailability !== "function") {
            setAvailable(false);
        } else {
            navigator.bluetooth.addEventListener("advertisementreceived", event => {
                log("bluetooth advertisement received: " + event);
            });
            navigator.bluetooth.addEventListener("availabilitychanged", event => {
                log("bluetooth availability changed: " + event);
            });

            navigator.bluetooth.getAvailability().then(
                isAvailable => setAvailable(isAvailable),
                rejection => log("bluetooth is not available" + (rejection ? (": " + rejection) : ""))
            );
        }

        return () => {
            navigator.bluetooth.removeEventListener("advertisementreceived");
            navigator.bluetooth.removeEventListener("availabilitychanged");
        };
    }, []);

    useEffect(() => {
        if (state.available.value !== null) {
            log(`bluetooth is ${state.available.value ? "" : "not "}available`);

        }
    }, [state.available.value]);

    const addSensor = () => {
        navigator.bluetooth.requestDevice({
            filters: [
                {services: [mainServiceUUID]}
            ],
            optionalServices: optionalServicesUUIDs
        }).then(
            device => {
                deviceCounter += 1;
                log(`got bt device ${device.id}`);
                handlers.devices.addDevice(device);
                //dispatch({type: ACTION.ADD_SENSOR, payload: {device, index: deviceCounter}});
            },
            error => {
                logError("device request error: " + error);
            }
        );
    };

    const addJamStik = () => {
        navigator.bluetooth.requestDevice({
            filters: [
                {services: [JAMSTIK_SERVICE_UUID]}
            ],
            optionalServices: JAMSTIK_OPTIONAL_SERVICES
        }).then(
            device => {
                log(`got bt device ${device.name} (id: ${device.id})`);
                handlers.devices.addDevice(device);
            },
            error => {
                logError("device request error: " + error);
            }
        );
    };


    const addAnything = () => {
        navigator.bluetooth.requestDevice({
            //filters: [BATTERY_SERVICE_UUID],
            acceptAllDevices: true,
            optionalServices: [...optionalServicesUUIDs, mainServiceUUID]
        }).then(
            device => {
                //deviceCounter += 1;
                log(`got bt device ${device.id}${device.name ? " " + device.name : ""}`);
                handlers.devices.addDevice(device);
                //dispatch({type: ACTION.ADD_SENSOR, payload: {device, index: deviceCounter}});
            },
            error => {
                logError("device request error: " + error);
            }
        );
    }

    return state.available.value ?
        html`
            <section class="bluetooth">
                <h2>bluetooth</h2>
                <button onClick=${addSensor}>add heart rate sensor</button>
                <button onClick=${addJamStik}>add JamStik</button>
                <button onClick=${addAnything}>add any bluetooth device</button>
                ${state.devices.value.length > 0 ? html`<${Devices} log=${log} devices=${state.devices} handlers=${handlers.devices} />`: null}
            </section>
        `
    : null;
};


export {
    Bluetooth
};
