import * as CL3D from "../../dist/cl3d.js";

const canvas = document.getElementById('3darea');
const engine = new CL3D.CopperLicht(canvas);
let scene = null;
    
if (engine.initRenderer(1280, 720, { alpha: false }, canvas))
{				 				  
    let setupShadowScene = () => {
        scene = engine.getScene();
        
        // now setup everything needed for shadow mapping
        
        scene.ShadowMappingEnabled = true;
        scene.ShadowMapOpacity = 0.5;
        scene.ShadowMapResolution = 1024;
        scene.ShadowMapBias1 = 0.0001;
        scene.ShadowMapCameraViewDetailFactor = 0.1;

    }
    engine.load('copperlichtdata/shadows.ccbz', false, setupShadowScene);
}