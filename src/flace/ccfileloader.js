//+ Nikolaus Gebhardt
// This file is part of the CopperLicht library, copyright by Nikolaus Gebhardt

/**
 * @constructor
 * @private
 */
export class CCFileLoader {
	constructor (filetoload, useArrayBufferReturn) {
		this.FileToLoad = filetoload;
		this.xmlhttp = false;
		this.useArrayBufferReturn = useArrayBufferReturn;
		// init xmlhttp

		if (!this.xmlhttp && typeof XMLHttpRequest != 'undefined') 
		{
			try 
			{
				this.xmlhttp = new XMLHttpRequest();
			}
			catch (e) 
			{
				this.xmlhttp = false;
			}
		}

		if (!this.xmlhttp && window.createRequest) 
		{
			try 
			{
				this.xmlhttp = window.createRequest();
			}
			catch (e) 
			{
				this.xmlhttp = false;
			}
		}
	}
	
	// functions
	
	load(functionCallBack, functionCallBackOnError)
	{
		if (this.xmlhttp == false)
		{
			CL3D.gCCDebugOutput.printError("Your browser doesn't support AJAX");
			return;
		}
		
		var me = this;
		
		try
		{
			this.xmlhttp.open("GET", this.FileToLoad, true);
			
			// XMLHttpRequest.responseType is an enumerated value that defines the response type. 
			// It can have the following values:
			// "arraybuffer", "blob", "text, "document"
			if (this.useArrayBufferReturn)
				this.xmlhttp.responseType = "arraybuffer";
		}
		catch(e)
		{
			if (functionCallBackOnError)
				functionCallBackOnError(e.message);
			else
			{
				CL3D.gCCDebugOutput.printError("Could not open file " + this.FileToLoad + ": " + e.message);
				
				// chrome doesn't allow loading local files anymore, check if this was the case
				var browserVersion = navigator.appVersion; 
				if (browserVersion != null && browserVersion.indexOf('Trident') != -1)
					CL3D.gCCDebugOutput.printError("<i>Use a web server to run files in IE. Or start them from CopperCube.</i>", true);
			}
			
			return;
		}
		
		//this.xmlhttp.overrideMimeType("text/plain; charset=x-user-defined");
		
		this.xmlhttp.onreadystatechange = function() 
		{ 
			if (me.xmlhttp.readyState == 4) 
			{
				var reportedError = false;
				
				if (me.xmlhttp.status != 200 && me.xmlhttp.status != 0 && me.xmlhttp.status != null)
				{
					if (functionCallBackOnError)
					{
						functionCallBackOnError('');
						reportedError = true;
					}
					else
						CL3D.gCCDebugOutput.printError("Could not open file " + me.FileToLoad + " (status:" + me.xmlhttp.status + ")" );
				}
				
				if (!reportedError && functionCallBack)
					functionCallBack(me.xmlhttp.response); 
			}
		}
		
		try
		{
			this.xmlhttp.send(null);
		}
		catch(e)
		{
			if (functionCallBackOnError)
				functionCallBackOnError('');
			else
				CL3D.gCCDebugOutput.printError("Could not open file " + me.FileToLoad); // + ": " + e.message);
			return;
		}
	};
	
	// abort function
	abort()
	{
		try
		{
			this.xmlhttp.abort();
		}
		catch(e)
		{
			//console.log("Could not abort " + me.FileToLoad); 
		}
	}
};
