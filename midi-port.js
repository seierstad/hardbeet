"use strict";
import {html, Component} from "./preact-standalone.module.min.js";

class MidiPort extends Component {
    constructor (props) {
        super();
        const {
            port
        } = props;
        this.port = port;

        this.state = {
            open: false
        };

        this.toggleOpenHandler = this.toggleOpenHandler.bind(this);
    }

    render ({port}, {open}) {
        return html`
            <fieldset>
                <legend>${port.manufacturer} ${port.name}</legend>
                <button onClick=${this.toggleOpenHandler}>${!open ? "open" : "close"}</button>
                ${this.props.children}
            </fieldset>
        `;
    }

    toggleOpenHandler () {
        if (!this.state.open) {
            this.port.open().then((status) => {
                this.setState({open: true});
            });
        } else {
            this.port.close().then((status) => {
                this.setState({open: false});
            });
        }
    }
}

export default MidiPort;
