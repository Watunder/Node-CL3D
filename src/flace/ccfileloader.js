//+ Nikolaus Gebhardt
// This file is part of the CopperLicht library, copyright by Nikolaus Gebhardt

import { doFetch } from "../share/doFetch.js";

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

		me.Controller = new AbortController();
		const signal = me.Controller.signal;

		try {
			if (!me.isBrowser) {
				let path = me.FileToLoad.replaceAll('\\', '/');
				me.FileToLoad = `file:///${path}`;
			}
			
			doFetch(me.FileToLoad, { signal })
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
