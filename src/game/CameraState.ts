import { Euler, Quaternion, Vector3 } from "three";
import HelperGeneral from "../helpers/HelperGeneral";
import HelperControls from "../helpers/HelperControls";

class CameraState
{
    public _euler:Euler;
    public _eulerInitial:Vector3;

    constructor(initX:number, initY:number, initZ:number)
    {
        this._euler = new Euler(0, 0, 0, 'YXZ');   
        this._eulerInitial = new Vector3(initX, initY, initZ);
    }

    public updateRotationAccordingToInput():void
    {
        if(HelperGeneral.isMobileDevice())
        {
            this._euler.x = HelperGeneral.clamp(this._euler.x + HelperControls._motionRotation[0], -1.5, 1.5);
            this._euler.y += HelperControls._motionRotation[1];
        }
        else
        {
            this._euler.x = this._eulerInitial.x + HelperGeneral.clamp(HelperControls._motionRotation[0], -1.5, 1.5);
            this._euler.y = this._eulerInitial.y + HelperControls._motionRotation[1];
        }
    }
}
export default CameraState;