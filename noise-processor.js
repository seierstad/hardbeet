const trailingZeros = (size) => {

    const MASK = (1 << size + 1) - 1;

    return (number) => {
        if ((number & MASK) === 0) {
            return size;
        }

        let zeros = 1;

        while ((MASK & number) === ((MASK << zeros) & number)) {
            zeros += 1;
        }

        return zeros - 1;
    };
};

const noise = {

    "white": () => (buffer) => {
        buffer.forEach((val, index, arr) => arr[index] = Math.random() * 2 - 1);
    },

    "pink": (resolution = 8) => {
        const factor = 2 / resolution;
        const values = new Float32Array(Math.floor(resolution));
        values.forEach((v, index, arr) => arr[index] = Math.random() * factor);

        const getIndex = trailingZeros(resolution);

        let sum = values.reduce((acc, current) => acc + current);
        const maxPosition = (1 << resolution) - 1;
        let position = 1;

        const pinkSum = (v, i, output) => {
            const index = getIndex(position);
            const prev = values[index];
            const curr = Math.random() * factor;
            values[index] = curr;
            sum += (curr - prev);

            if (position < maxPosition) {
                position += 1;
            } else {
                position = 1;
            }

            output[i] = sum - 1;
        };

        return (buffer) => {
            buffer.forEach(pinkSum);
        };
    }
};



class NoiseProcessor extends AudioWorkletProcessor {
    constructor () {
        super();
        this.active = false;
        this.port.onmessage = this.messageHandler.bind(this);
        this.generators = Object.entries(noise).map(([key, fn]) => ([key, fn()]));
        this.selectedGenerator = this.generators[0][1];
    }

    messageHandler (event) {
        const {
            type,
            message
        } = JSON.parse(event.data);


        switch (type) {
            case "toggle":
                this.active = (message === "on");
                break;

            case "color":
                const generator = this.generators.find(([name, fn]) => name === message);
                if (generator) {
                    this.selectedGenerator = generator[1];
                } else {
                    console.log("finner ikke " + message)
                }
                break;
        }
    }

    process (inputs, outputs, parameters) {
        const signalOutput = outputs[0][0];

        if (this.active) {
            this.selectedGenerator(signalOutput);
        } else {
            signalOutput.fill(0);
        }

        return true;
    }
}

registerProcessor("noise-processor", NoiseProcessor);
