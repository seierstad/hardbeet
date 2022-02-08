class NoiseProcessor extends AudioWorkletProcessor {
    constructor () {
        super();
        this.port.onmessage = this.messageHandler.bind(this);
    }

    messageHandler (event) {
    	console.log("TODO: implement messageHandler in NoiseProcessor");
    }

	process (inputs, outputs, parameters) {
        const signalOutput = outputs[0];

        for (let index = 0; index < signalOutput[0].length; index += 1) {
            signalOutput[0][index] = (Math.random() - 0.5) * 2;
        }
    }
}

registerProcessor("noise-processor", NoiseProcessor);
