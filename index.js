import sdl from '@kmamal/sdl';
import * as CL3D from './dist/cl3d.mjs';

const window = sdl.video.createWindow({
	resizable: true,
	opengl: true,
})

const { pixelWidth: width, pixelHeight: height, native } = window
const textureManager = new CL3D.TextureManager();
const render = new CL3D.Renderer(textureManager);
textureManager.TheRenderer = render;

render.init(width, height, native);

const redraw = () =>
{
	render.beginScene(CL3D.createColor(255,50,50,50));
	render.draw2DRectangle(0,0,100,100,CL3D.createColor(255,255,255,255),true);
	render.draw2DImage(0, 0, 400, 400, textureManager.getTexture("idle.png", true),true);
	render.endScene();
}

window.on('expose', redraw);

window.on('resize', ({ width: w, height: h, pixelWidth: pw, pixelHeight: ph }) =>
{
	render.width = w;
	render.height = h;

	render.ensuresizeok();

	redraw()
});
