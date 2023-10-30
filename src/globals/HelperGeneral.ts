import State from "../scene/State";
import { Vector3, Quaternion } from "three";

class HelperGeneral
{
    private static readonly _zeroVector:Vector3 = new Vector3(0,0,0);
    private static readonly _identityQuaternion = new Quaternion(0,0,0,1);

    public static rad2deg(radians:number):number
    {
      let deg = radians * (180.0 / Math.PI);
      return Math.round((deg + Number.EPSILON) * 100) / 100;
    }
    
    public static deg2rad(degrees:number):number
    {
        return degrees * (Math.PI / 180.0);
    }

    public static clamp(theValue:number, lowerBound:number, upperBound:number):number
    {
        return Math.max(lowerBound, Math.min(theValue, upperBound));
    }

    public static readonly DTFrameSize:number = 1.0 / 120.0;

    public static copyStates(src:State, dest:State):void
    {
        dest._position.x = src._position.x;
        dest._position.y = src._position.y;
        dest._position.z = src._position.z;

        dest._scale.x = src._scale.x;
        dest._scale.y = src._scale.y;
        dest._scale.z = src._scale.z;

        dest._rotation.x = src._rotation.x;
        dest._rotation.y = src._rotation.y;
        dest._rotation.z = src._rotation.z;
        dest._rotation.w = src._rotation.w;
    }

    public static blendStates(a:State, b:State, alpha:number, renderState:State):void
    {
        renderState._position = this._zeroVector.lerpVectors(a._position, b._position, alpha);
        renderState._scale = this._zeroVector.lerpVectors(a._scale, b._scale, alpha);
        renderState._rotation = this._identityQuaternion.slerpQuaternions(a._rotation, b._rotation, alpha);
    }
}

export default HelperGeneral;