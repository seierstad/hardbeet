class Visualizer {
	constructor () {
		this.index = 0;
		this.rootElement = document.createElement("div");
		this.canvas = document.createElement("canvas");

		this.rootElement.appendChild(this.canvas);
		this.drawWaveform = this.drawWaveform.bind(this);
		this.buffer = [];
	}

	drawWaveform = (canvas, data) => {
		const ctx = canvas.getContext("2d");
		canvas.width = canvas.clientWidth;
		canvas.height = canvas.clientHeight;
		ctx.clearRect(this.index, 0, data.length, canvas.clientHeight);
		const channelCount = data[0].length;
		const width = canvas.clientWidth;
		const heightPrChannel = canvas.clientHeight / channelCount;



		for (let c = 0; c < channelCount; c += 1) {
			const channelData = buffer.getChannelData(c);
			const channelScaler = this.getChannelScaler(c * heightPrChannel, (c + 1) * heightPrChannel);
			const integers = Math.floor(this.offsetX) === this.offsetX;

			if (samplesPrPixel <= 1) {
				// draw lines
				ctx.beginPath();
				ctx.moveTo(0, channelScaler(this.transformY(channelData[Math.floor(this.offsetX)])));
	    		for (let i = 1; i < width; i += 1) {
					ctx.lineTo(i, channelScaler(this.transformY(channelData[Math.floor(this.offsetX + (i * samplesPrPixel))])));
	    		}
				ctx.stroke();          // Render the path
			} else {
				// draw boxes
	    		for (let i = 0; i < width; i += 1) {
	    			const sampleStart = Math.floor(this.offsetX + i * samplesPrPixel);
	    			const sampleEnd = Math.ceil(sampleStart + samplesPrPixel);
	    			const pixel = channelData.subarray(sampleStart, sampleEnd).reduce(this.minMaxReducer, {min: channelData[sampleStart], max: channelData[sampleStart]});

	    			ctx.fillRect(i, channelScaler(this.transformY(pixel.min)), 1, this.transformY((pixel.max - pixel.min) * heightPrChannel / 2));
	    		}
	    	}
    	}
	}

	appendData (data, parameters) {
		const {
			fruquency
		} = parameters;
		const interval = 1000 / parameters.frequency;
		data.forEach((d, index) => setInterval())
		console.log({data, parameters});
	}
}

export default Visualizer;
