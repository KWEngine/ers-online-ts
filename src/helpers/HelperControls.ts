import GameScene from "../scene/GameScene";
import HelperGeneral from "./HelperGeneral";

class HelperControls
{
    public static _keys:Map<string, boolean> = new Map<string, boolean>();
    public static _motionRotation:number[] = [0, 0];
    public static _motionMove:number[] = [0, 0];
    public static _hasFocus:boolean = true;
    public static _camMoveStrafeId:number = -1;
    public static _camPitchYawId:number = -1;
 
    public static isPointerLocked():boolean
    {
        return document.pointerLockElement === GameScene.instance.getRenderDomElement();
    }

    public static exitPointerLockForInfoScreen():void
    {
        if(this.isPointerLocked())
        {
            document.exitPointerLock();
        }
    }

    public static enterPointerLockAfterInfoScreen():void
    {
        if(HelperGeneral.isMobileDevice() == false)
            GameScene.instance.getRenderDomElement().requestPointerLock();
    }

    public static updatePlayerControlsForDesktop():void
    {
        if(HelperControls.isPointerLocked())
        {
            if(HelperGeneral.isMobileDevice() == false)
            {
                HelperControls._motionMove[0] = 0;
                HelperControls._motionMove[1] = 0;

                if(HelperControls._keys.get("w"))
                {
                    HelperControls._motionMove[0] = HelperGeneral.clamp(HelperControls._motionMove[0] + 1, -1, +1);
                }
                if(HelperControls._keys.get("s"))
                {
                    HelperControls._motionMove[0] = HelperGeneral.clamp(HelperControls._motionMove[0] - 1, -1, +1);
                }
                if(HelperControls._keys.get("a"))
                {
                    HelperControls._motionMove[1] = HelperGeneral.clamp(HelperControls._motionMove[1] - 1, -1, +1);
                }
                if(HelperControls._keys.get("d"))
                {
                    HelperControls._motionMove[1] = HelperGeneral.clamp(HelperControls._motionMove[1] + 1, -1, +1);
                }
            }
        }
    }

    public static addCameraRotation(x:number, y:number):void
    {
        HelperControls._motionRotation[0] += -x * Math.PI / 180;
        HelperControls._motionRotation[1] += -y * Math.PI / 180;

        if(GameScene.instance.isDebugMode())
        {
            document.getElementById("header")!.innerText = "x:" + x + " | y:" + y;
        }
    }
    
    public static addCameraRotationMobile(x:number, y:number):void
    {
        x = HelperGeneral.clamp((x * x) * Math.sign(x), -0.5, +0.5);
        y = HelperGeneral.clamp(y, -0.75, +0.75);

        if(GameScene.instance.isDebugMode())
        {
            document.getElementById("header")!.innerText = "x:" + x + " | y:" + y;
        }

        HelperControls._motionRotation[0] = (-x * Math.PI / 180) * 1.0;
        HelperControls._motionRotation[1] = (-y * Math.PI / 180) * 1.0;
    }
}
export default HelperControls;