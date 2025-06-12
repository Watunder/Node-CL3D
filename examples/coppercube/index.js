import * as CL3D from "../../dist/cl3d.js";

const url = location.href;
const name = url.slice(url.lastIndexOf("/") + 1, url.lastIndexOf("."));
const type = name == "firstpersoncamera" ? "ccbz" : "ccbjs";

const file = `./copperlichtdata/${name}.${type}`;
const canvas = document.getElementById('3darea');
const loading = '\
Loading $PROGRESS$...<br/><br/>\
<img style="max-width:50%" src="./copperlichtdata/coppercubeloadinglogo.png" />';
const color = "#000000";
const error = '\
Error: This browser does not support WebGL (or it is disabled).<br/>\
See <a href=\"http://www.ambiera.com/copperlicht/browsersupport.html\">here</a> for details.';

const engine = CL3D.startCopperLichtFromFile(file, canvas, loading, color, error, false);