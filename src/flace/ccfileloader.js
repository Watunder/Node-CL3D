//+ Nikolaus Gebhardt
// This file is part of the CopperLicht library, copyright by Nikolaus Gebhardt

/**
 * @constructor
 * @private
 */
export class CCFileLoader {
	constructor(filetoload, useArrayBufferReturn) {
		this.FileToLoad = filetoload;
		this.useArrayBufferReturn = useArrayBufferReturn;

		this.Controller = new AbortController();
	}

	load(functionCallBack, functionCallBackOnError) {
		const me = this;
		const signal = this.Controller.signal;

		try {
			fetch(this.FileToLoad, { signal })
				.then((response) => {
					if (!response.ok) {
						let reportedError = false;

						if (response.status != 200 && response.status != 0 && response.status != null) {
							if (functionCallBackOnError) {
								functionCallBackOnError('');
								reportedError = true;
							}
							else
								console.log("Could not open file " + me.FileToLoad + " (status:" + response.status + ")");
						}
					}
					if (this.useArrayBufferReturn)
						return response.arrayBuffer();
					else
						return response.text();
				})
				.then((data) => {
					if (functionCallBack)
						functionCallBack(data);
				})
		}
		catch (e) {
			if (functionCallBackOnError)
				functionCallBackOnError(e.message);
			else {
				console.log("Could not open file " + this.FileToLoad + ": " + e.message);
			}
		}
	};

	abort() {
		try {
			this.Controller.abort();
		}
		catch (e) {
			console.log("Could not abort " + me.FileToLoad);
		}
	}
};
