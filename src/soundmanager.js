//+ Nikolaus Gebhardt
// This file is part of the CopperLicht library, copyright by Nikolaus Gebhardt

//import * as CL3D from "../main.js";

import * as CL3D from "./main.js";

/**
 * @constructor
 * @private
 */
export class SoundManager {
	constructor() {
		this.Sounds = new Array();
		this.PlayingSounds = new Array();
		this.GlobalVolume = 1.0;
	}

	/**
	 * @private
	 */
	getSoundFromName(name) {
		for (var i = 0; i < this.Sounds.length; ++i) {
			var t = this.Sounds[i];
			if (t.Name == name)
				return t;
		}

		return null;
	}

	/**
	 * @private
	 */
	addSound(t) {
		if (t != null) {
			if (this.getSoundFromName(t.Name) != null && CL3D.gCCDebugInfoEnabled)
				console.log("ERROR! Cannot add the sound multiple times: " + t.Name);

			this.Sounds.push(t);
		}
	}

	/**
	 * @private
	 * name is the url
	 */
	getSoundFromSoundName(name, createIfNotFound) {
		if (name == null || name == "")
			return null;

		var t = this.getSoundFromName(name);

		if (t != null)
			return t;

		if (createIfNotFound) {
			t = new CL3D.SoundSource(name);
			this.addSound(t);
			return t;
		}

		return null;
	}
	
	/**
	 * @private
	 * s can either be the URL or the SoundSource object
	 */
	play2D(s, looped, volume) {
		if (s == null)
			return null;

		// s can be the url or the sound source	
		var soundSrc = null;
		if (typeof (s) == 'string')
			soundSrc = this.getSoundFromSoundName(s, true);

		else
			soundSrc = s;

		if (soundSrc == null ||
			soundSrc.audioElem == null)
			return null;

		// if there is already an audio source playing with this file, stop that one.
		// a limitation by the HTML 5 audio api
		this.clearFinishedPlayingSounds();

		for (var i = 0; i < this.PlayingSounds.length;)
			if (this.PlayingSounds[i].src === soundSrc) {
				this.PlayingSounds[i].src.audioElem.pause();
				this.PlayingSounds.splice(i, 1);
			}

			else
				++i;

		// the HTML 5 audio tag doesn't support volume or other fance stuff unfortunately.
		try {
			soundSrc.audioElem.currentTime = 0;
		}
		catch (err) { }

		// play
		if (typeof volume === 'undefined')
			volume = 1.0;

		soundSrc.audioElem.volume = volume * this.GlobalVolume;
		soundSrc.audioElem.play();

		// create playing sound
		var pl = new CL3D.PlayingSound(soundSrc);
		pl.ownVolume = volume;
		this.PlayingSounds.push(pl);

		// a.audioElem.loop = looped; // this is only supported in chrome, firefox 
		// happily this, so we do this on our own with the next lines of code
		if (soundSrc.lastListener)
			soundSrc.audioElem.removeEventListener('ended', soundSrc.lastListener, false);
		soundSrc.audioElem.lastListener = null;

		if (looped) {
			pl.looping = true;

			var endFunction = () => {
				if (!pl.hasStopped) {
					try { this.currentTime = 0; }
					catch (err) { }
					this.play();
					//CL3D.Debug.print('foobar');
				}
			};

			soundSrc.audioElem.addEventListener('ended', endFunction, false);
			soundSrc.audioElem.lastListener = endFunction;
		}

		// return playing sound
		return pl;
	}

	/**
	 * @private
	 */
	stop(playingSnd) {
		if (!playingSnd)
			return;

		playingSnd.src.audioElem.pause();
		playingSnd.hasStopped = true;
		this.clearFinishedPlayingSounds();
	}

	/**
	 * @private
	 */
	getGlobalVolume() {
		return this.GlobalVolume;
	}

	/**
	 * @private
	 */
	setGlobalVolume(v) {
		this.GlobalVolume = v;
		if (this.GlobalVolume < 0.0) this.GlobalVolume = 0.0;
		if (this.GlobalVolume > 1.0) this.GlobalVolume = 1.0;

		try {
			// update volume for all playing sounds
			for (var i = 0; i < this.PlayingSounds.length; ++i) {
				var pl = this.PlayingSounds[i];
				pl.src.audioElem.volume = pl.ownVolume * this.GlobalVolume;
			}
		}
		catch (err) { }
	}

	/**
	 * @private
	 */
	setVolume(playingSnd, v) {
		if (!playingSnd)
			return;

		try {
			playingSnd.src.audioElem.volume = v;
		}
		catch (err) { }
	}

	/**
	 * @private
	 */
	stopAll() {
		for (var i = 0; i < this.PlayingSounds.length; ++i) {
			var pl = this.PlayingSounds[i];
			pl.hasStopped = true;
			pl.src.audioElem.pause();
		}

		this.PlayingSounds = new Array();
	}

	/**
	 * @private
	 */
	clearFinishedPlayingSounds() {
		for (var i = 0; i < this.PlayingSounds.length;)
			if (this.PlayingSounds[i].hasPlayingCompleted())
				this.PlayingSounds.splice(i, 1);

			else
				++i;
	}

	/**
	 * @private
	 */
	stopSpecificPlayingSound(name) {
		for (var i = 0; i < this.PlayingSounds.length; ++i) {
			var pl = this.PlayingSounds[i];
			if (pl && pl.src && pl.src.Name == name) {
				this.PlayingSounds.splice(i, 1);

				pl.hasStopped = true;
				pl.src.audioElem.pause();
				return;
			}
		}
	}
}

export const gSoundManager = new CL3D.SoundManager();

// -----------------------------------------------------------------------------------------
// SoundSource
// -----------------------------------------------------------------------------------------

/**
 * @constructor
 * @private
 */
export class SoundSource {
	constructor(name) {
		this.Name = name;

		var a = null;
		try // some browsers (IE) don't support the audio element
		{
			a = new Audio();
			a.src = name;
		}
		catch (err) { }

		//var a = document.createElement('audio');
		//a.src = name;		
		//a.controls = 1;
		this.loaded = true;
		// this.loaded = false;
		//var me = this;
		//a.addEventListener('canplaythrough', function() { me.onAudioLoaded() ;}, false);
		this.audioElem = a;
	}

	onAudioLoaded() {
		//this.loaded = true;
	}
};

// -----------------------------------------------------------------------------------------
// Playing Sound
// -----------------------------------------------------------------------------------------

/**
 * @constructor
 * @private
 */
export class PlayingSound {
	constructor(source) {
		this.src = source;
		this.hasStopped = false;
		this.looping = false;
		this.ownVolume = 1.0;

		var d = new Date();
		this.startTime = d.getTime();
	}

	hasPlayingCompleted() {
		if (this.hasStopped)
			return true;

		if (this.looping)
			return false;

		var d = new Date();
		var now = d.getTime();
		var dur = this.src.duration;

		return dur > 0 && (now > this.startTime + dur);
	}
};
