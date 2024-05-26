// input
export { AnimatorOnClick } from "./OnClick.js";
export { AnimatorOnMove } from "./OnMove.js";

// 
export { AnimatorOnProximity } from "./OnCollide.js";
export { AnimatorCollisionResponse } from "./CollisionResponse.js";

//
export { AnimatorFollowPath } from "./FollowPath.js";
export { AnimatorFlyStraight } from "./FlyStraight.js";
export { AnimatorFlyCircle } from "./FlyCircle.js";

// material
export { AnimatorAnimateTexture } from "./AnimateTexture.js";

// scenenode
export { AnimatorRotation } from "./Rotation.js";

// camera
export { AnimatorCameraModelViewer } from "./CameraModelViewer.js";
export { AnimatorCameraFPS } from "./CameraFPS.js";

/// private
// contains several animators which only make sense in combination with the Coppercube editor, and are not pulic.
export { CopperCubeVariable, CopperCubeVariables } from "./CoppercubePrivate/CopperCubeVariable.js";

// input
export { AnimatorKeyboardControlled } from "./CoppercubePrivate/KeyboardControlled.js";
export { AnimatorMobileInput } from "./CoppercubePrivate/MobileInput.js";
export { AnimatorOnKeyPress } from "./CoppercubePrivate/OnKeyPress.js";

// camera
export { Animator3rdPersonCamera } from "./CoppercubePrivate/3rdPersonCamera.js";

// game ai
export { AnimatorGameAI } from "./CoppercubePrivate/GameAI.js";

// utils
export { AnimatorOnFirstFrame } from "./CoppercubePrivate/OnFirstFrame.js";

export { AnimatorTimer } from "./CoppercubePrivate/Timer.js";
