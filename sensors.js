"use strict";
import {html, Component} from "./preact-standalone.module.min.js";
import Sensor, {mainServiceUUID, optionalServicesUUIDs} from "./sensor.js";
import PolarSensor from "./polar-sensor.js";


class Sensors extends Component {
    constructor (props) {
        super();

        const {
            bluetooth,
            functions
        } = props;

        this.bluetooth = bluetooth;
        this.addSensor = this.addSensor.bind(this);

        this.dataFunctions = functions;

        this.state = {
            devices: []
        };
    }


    addSensor () {
        navigator.bluetooth.requestDevice({
            filters: [
                {services: [mainServiceUUID]}
            ],
            optionalServices: optionalServicesUUIDs
        }).then(
            device => {
                const deviceIndex = this.dataFunctions.registerDevice("heart rate sensor", device.name);
                this.setState({devices: [...this.state.devices, {device, index: deviceIndex}]});
            },
            error => {
                this.error("device request error: " + error);
            }
        );
    }

    render (props, state) {
        const {bluetoothAvaliable} = props;
        const {devices = []} = state;
        return html`
            <section>
                <header><h2>sensors</h2></header>
                ${devices.map((device, index) => device.name.startsWith("Polar") ? html`<${PolarSensor} device=${device} functions=${this.dataFunctions} index=${index} />` : html`<${Sensor} device=${device} functions=${this.dataFunctions} index=${index} />`)}
                ${bluetoothAvaliable ? html`<button onClick=${this.addSensor}>add sensor</button>` : null}
            </section>
        `;
    }
}

export default Sensors;
