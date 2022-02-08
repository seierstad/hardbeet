class Noise extends AudioWorkletNode {
    constructor (context) {
    	super(context, "noise-processor");
        this.port.onmessage = this.messageHandler.bind(this);
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
