class Visualizer {
	constructor () {
		this.index = 0;
		this.rootElement = document.createElement("div");
		this.canvas = document.createElement("canvas");
		this.canvas.classList.add("visualizer");
		this.ctx = this.canvas.getContext("2d");
		this.rootElement.appendChild(this.canvas);

		this.drawWaveform = this.drawWaveform.bind(this);
		this.addToBuffer = this.addToBuffer.bind(this);
		this.resetHandler = this.resetHandler.bind(this);

		this.buffer = [];
		this.animationFrameRequest = null;
		this.previousValue = null;
		this.pixelsPrSample = 3;

		this._max = null;
		this._min = null;
		this.maxElement = document.createElement("span");
		this.minElement = document.createElement("span");
		this.rootElement.appendChild(this.maxElement);
		this.rootElement.appendChild(this.minElement);

		this.resetButton = document.createElement("button");
		this.resetButton.innerText = "reset";
		this.resetButton.addEventListener("click", this.resetHandler);
		this.rootElement.appendChild(this.resetButton);
	}

	resetHandler (event) {
		this.max = 0;
		this.min = 0;
		this.index = 0;
		this.ctx.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
	}

	drawWaveform = () => {
		//console.log(this.canvas.height, this.canvas.width);
		if (!this.canvas.height || !this.canvas.width) {
			this.canvas.width = this.canvas.clientWidth * 4;
			this.canvas.height = this.canvas.clientHeight;
			console.log("set height and width");
		}

		const ctx = this.ctx;
		ctx.strokeStyle = "black";
		const width = this.canvas.clientWidth;
		const height = this.canvas.clientHeight;
		ctx.clearRect(this.index, 0, this.buffer.length * this.pixelsPrSample, height);
		const clearStart = this.index + this.buffer.length * this.pixelsPrSample - width;
		if (clearStart > 0) {
			ctx.clearRect(0, 0, clearStart, height);
		}
		const channelCount = this.buffer[0].length;
/*
		const heightPrChannel = this.canvas.clientHeight / channelCount;


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
*/
		ctx.beginPath();
		this.previousValue = this.previousValue || height / 2;
		ctx.moveTo(this.index, this.previousValue);

		const scale = (value) => value * height + (height / 2);

		const {min, max} = this.buffer.reduce((acc, curr) => ({
			min: Math.min(curr, acc.min),
			max: Math.max(curr, acc.max)
		}), {min: Number.MAX_VALUE, max: Number.MIN_VALUE});

		if (this.max === null || max > this.max) {
			this.max = max;
		}
		if (this.min === null || min < this.min) {
			this.min = min;
		}

		while (this.buffer.length > 0) {
			const y = this.buffer.shift();

			if (this.index + this.pixelsPrSample >= width) {
				ctx.stroke();
				this.index = 0;
				ctx.beginPath();
				ctx.moveTo(this.index, this.previousValue);
			}
			ctx.lineTo(this.index + this.pixelsPrSample, scale(y[0]));
			this.previousValue = scale(y[0]);
			this.index += this.pixelsPrSample;
		}
		ctx.stroke();

		/* zero line */
		ctx.strokeStyle = "red";
		ctx.beginPath();
		ctx.moveTo(0, height / 2);
		ctx.lineTo(width, height / 2);
		ctx.stroke();
		/* end zero line */

		this.animationFrameRequest = null;
	}

	get max () {
		return this._max;
	}
	set max (max) {
		this._max = max;
		this.maxElement.innerText = `max: ${this._max}`;
	}

	get min () {
		return this._min;
	}
	set min (min) {
		this._min = min;
		this.minElement.innerText = `min: ${this._min}`;
	}

	addToBuffer (data) {
		if (this.previousValue === null) {
			this.previousValue = data;
			this.firstSample = false;
		}
		if (this.buffer.length === 0) {
			this.animationFrameRequest = window.requestAnimationFrame(this.drawWaveform);
		}
		this.buffer.push(data);
	}

	appendData (data, parameters) {
		const {
			frequency = 100
		} = parameters;
		const interval = 1000 / frequency;

		data.forEach((d, index) => setTimeout(this.addToBuffer, interval * index, d));
	}
}

export default Visualizer;
