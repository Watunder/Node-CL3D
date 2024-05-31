//+ Nikolaus Gebhardt
// This file is part of the CopperLicht library, copyright by Nikolaus Gebhardt

/**
 * @constructor
 * @private
 */
export class CCFileLoader {
	constructor(filetoload, useArrayBufferReturn, isBrowser) {
		this.FileToLoad = filetoload;
		this.useArrayBufferReturn = useArrayBufferReturn;
		this.isBrowser = isBrowser;
	}

	load(functionCallBack, functionCallBackOnError) {
		const me = this;

		if (this.isBrowser) {
			me.Controller = new AbortController();
			const signal = me.Controller.signal;

			try {
				fetch(me.FileToLoad, { signal })
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
						if (me.useArrayBufferReturn)
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
		}
		else {
			import('file-fetch').then(async (module) => {
				let path = this.FileToLoad.replaceAll('\\', '/');
				let data = await module.default(`file:///${path}`);
				
				if (me.useArrayBufferReturn)
					data = await data.arrayBuffer();
				else
					data = await data.text();

				if (functionCallBack)
					functionCallBack(data);
			})
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
