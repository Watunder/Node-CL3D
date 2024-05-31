import * as CL3D from "../../dist/cl3d.js";

const engine = CL3D.startCopperLichtFromFile('copperlichtdata/animation.ccbjs', document.getElementById('3darea'));

// every time the user presses space, we want to do a collision test with the wall
// and create a cube where we hit the wall

let lastPlayedAnimation = 0;

document.onkeyup = (event) => {
    let scene = engine.getScene();
    if (!scene)
        return;

    // soldier is an AnimatedMeshSceneNode.
    let soldier = scene.getSceneNodeFromName('soldier');

    if (soldier) {
        if (event.keyCode == 32) // space has been pressed
        {
            // switch to next animation				
            // select the next animation:

            let animations = ['walk', 'stand', 'idle_a', 'aim'];
            ++lastPlayedAnimation;
            if (lastPlayedAnimation > animations.length - 1)
                lastPlayedAnimation = 0;

            let nextAnimationName = animations[lastPlayedAnimation];

            // and set it to be played

            soldier.setAnimation(nextAnimationName);
        }
        else
            if (event.keyCode == 67 || event.keyCode == 99) // 'c' has been pressed
            {
                // clone soldier

                let clone = soldier.createClone(scene.getRootSceneNode());
                clone.Pos.X += (Math.random() * 50) - 25;
                clone.Pos.Z += (Math.random() * 50) - 25;
            }
    }

    // we need to call the key handler of the 3d engine as well, so that the user is
    // able to move the camera using the keys
    engine.handleKeyUp(event);
}