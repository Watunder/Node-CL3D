//+ Nikolaus Gebhardt
// This file is part of the CopperLicht library, copyright by Nikolaus Gebhardt

import { doFetch } from "../share/doFetch.js";
import { isNode } from '../utils/environment.js';

/**
 * @constructor
 * @public
 */
export class CCFileLoader {
	constructor(filetoload, useArrayBufferReturn) {
		this.FileToLoad = filetoload;
		this.useArrayBufferReturn = useArrayBufferReturn;
	}

	load(functionCallBack, functionCallBackOnError) {
		const me = this;

		me.Controller = new AbortController();
		const signal = me.Controller.signal;

		try {
			if (isNode) {
				let path = me.FileToLoad.replaceAll('\\', '/');
				me.FileToLoad = path.startsWith('file:') ? path : `file:///${path}`;
			}

			doFetch(me.FileToLoad, { signal })
				.then(async (response) => {
					if (!response.ok) {
						let reportedError = false;

						if (response.status != 200 && response.status != 0 && response.status != null) {
							const message = "Could not open file " + me.FileToLoad + " (status:" + response.status + ")";
							if (functionCallBackOnError) {
								functionCallBackOnError(message);
								reportedError = true;
							}
							else
								console.log(message);
						}
					}
					if (me.useArrayBufferReturn)
						return await response.arrayBuffer();
					else
						return await response.text();
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
			console.log("Could not abort " + this.FileToLoad);
		}
	}
};
