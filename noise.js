

class Toggle {
    constructor (name, values = [], defaultValue, handler, legend = name) {
        const fieldset = document.createElement("fieldset");
        const legendElement = document.createElement("legend");
        legendElement.innerText = legend;
        fieldset.appendChild(legendElement);

        values.forEach(([value, label = value]) => {
            const labelElement = document.createElement("label");
            const labelText = document.createElement("span");
            labelText.classList.add("label-text");
            labelText.innerText = label;
            labelElement.appendChild(labelText);
            const radioButton = document.createElement("input");
            radioButton.setAttribute("type", "radio");
            radioButton.setAttribute("name", name);
            radioButton.setAttribute("value", value);
            radioButton.addEventListener("change", handler);
            if (value === defaultValue) {
                radioButton.setAttribute("checked", true);
            }
            labelElement.appendChild(radioButton);
            fieldset.appendChild(labelElement);
        });

        this.rootElement = fieldset;
    }
}



class Noise extends AudioWorkletNode {
    constructor (context) {
        super(context, "noise-processor");

        this.rootElement = null;

        this.port.onmessage = this.messageHandler.bind(this);
        this.toggleHandler = this.toggleHandler.bind(this);
        this.colorHandler = this.colorHandler.bind(this);

        this.renderUI();
    }

    toggleHandler (event) {
        this.port.postMessage(JSON.stringify({
            "type": "toggle",
            "message": event.target.value
        }));
    }

    colorHandler (event) {
        this.port.postMessage(JSON.stringify({
            "type": "color",
            "message": event.target.value
        }));
    }

    renderUI () {
        if (this.rootElement === null) {
            this.rootElement = document.createElement("div");
            this.rootElement.classList.add("noise");
            const heading = document.createElement("h5");
            heading.innerText = "noise";
            this.rootElement.appendChild(heading);
            this.rootElement.appendChild(new Toggle("toggle", [["off"], ["on"]], "off", this.toggleHandler).rootElement);
            this.rootElement.appendChild(new Toggle("color", [["white"], ["pink"]], "white", this.colorHandler).rootElement);
        }
    }

    messageHandler (event) {
        const {
            type,
            message,
            data
        } = JSON.parse(event.data)
    }


}

export default Noise;
