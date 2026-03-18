import raubTools from "addon-tools-raub";
import fs from "fs";
import path from "path";
import url from "url";

const prebuildModules = [
	"webgl-raub",
	"segfault-raub",
	"glfw-raub",
	"deps-opengl-raub",
];

const bundlePath = `../dist/bundle/${raubTools.getBin()}`;
if (!fs.existsSync("../dist/bundle/")) {
	fs.mkdirSync("../dist/bundle/");
}
if (!fs.existsSync(bundlePath)) {
	fs.mkdirSync(bundlePath);
}

prebuildModules.forEach(module => {
	const module_dir = url.fileURLToPath(path.dirname(import.meta.resolve(module)));
	const binary_dir = path.join(module_dir, raubTools.getBin());

	fs.readdirSync(binary_dir).forEach(file => {
		if (/^(?:lib)?[a-zA-Z0-9_.-]+\.(?:node|dll|dylib|so(?:\.\d+)*)$/.test(file)) {
			fs.copyFileSync(path.join(binary_dir, file), `${bundlePath}/${file}`);
		}
	});
});
