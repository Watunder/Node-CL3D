// ---------------------------------------------------------------------
// Playing video stream
// ---------------------------------------------------------------------

/**
 * @public
 * @constructor
 * @class
 */
export class VideoStream {
    constructor(filename, renderer) {
        this.filename = filename;
        this.videoElement = null;
        this.renderer = renderer;
        this.texture = null;
        this.handlerOnVideoEnded = null;
        this.handlerOnVideoFailed = null;
        this.readyToShow = false;
        this.playBackEnded = false;
        this.stopped = false;
        this.state = 0; // 0=stopped, 1=loading, 2=playing, 3=paused
        this.playLooped = false;
        this.isError = false;
    }

    videoBufferReady() {
        this.state = 2; // playing


        // start video
        this.videoElement.play();
        this.readyToShow = true;

        var oldTexture = this.texture;
        var newTexture = this.renderer.createTextureFrom2DCanvas(this.videoElement, true);

        // now replace content of the new texture with the old placeholder texture
        this.renderer.replacePlaceholderTextureWithNewTextureContent(oldTexture, newTexture);
    }

    videoPlaybackDone() {
        this.state = 0; // 0=stopped, 1=loading, 2=playing, 3=paused
        this.playBackEnded = true;
    }

    errorHappened() {
        this.state = 0;
        this.playBackEnded = true;
        this.isError = true;
    }

    play(playLooped) {
        if (this.state == 2 || this.state == 1) // playing or loading
            return;

        if (this.videoElement) {
            if (this.state == 3) // paused
            {
                // unpause
                this.videoElement.play();
                this.state = 2;
                this.playBackEnded = false;
                return;
            }
            else
                if (this.state == 0) // stopped
                {
                    this.videoElement.currentTime = 0;
                    this.videoElement.play();
                    this.state = 2;
                    this.playBackEnded = false;
                    return;
                }
        }

        var v = document.createElement('video');

        var me = this;

        this.videoElement = v;
        this.playLooped = playLooped;

        v.addEventListener("canplaythrough", function () { me.videoBufferReady(); }, true);
        v.addEventListener("ended", function () { me.videoPlaybackDone(); }, true);
        v.addEventListener("error", function () { me.errorHappened(); }, true);

        v['preload'] = "auto";
        v.src = this.filename; // works with .ogv and .mp4
        v.style.display = 'none';

        if (this.playLooped)
            v.loop = true;

        this.state = 1; // loading



        // create placeholder texture
        var canvas = document.createElement("canvas");
        if (canvas == null)
            return;
        canvas.width = 16;
        canvas.height = 16;

        //ctx = canvas.getContext("2d");
        //ctx.fillStyle = "rgba(255, 0, 255, 1)";
        //ctx.fillRect(0, 0, canvas.width, canvas.height);
        this.texture = this.renderer.createTextureFrom2DCanvas(canvas, true);
    }

    pause() {
        if (this.state != 2)
            return;

        this.videoElement.pause();
        this.state = 3;
    }

    stop() {
        if (this.state != 2)
            return;

        this.videoElement.pause();
        this.state = 0;
    }

    updateVideoTexture() {
        if (!this.readyToShow)
            return;

        if (this.state != 2) // playing
            return;

        this.renderer.updateTextureFrom2DCanvas(this.texture, this.videoElement);
    }

    hasPlayBackEnded() {
        if (this.state == 0) // 0=stopped, 1=loading, 2=playing, 3=paused
            return true;

        return this.playBackEnded;
    }
};
