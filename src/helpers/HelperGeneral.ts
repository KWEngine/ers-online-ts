import CameraState from "../game/CameraState";
import State from "../game/State";
import { Vector3, Quaternion, Matrix4, Euler, Object3D, Mesh } from "three";

class HelperGeneral
{
    private static readonly _zeroVector:Vector3 = new Vector3(0,0,0);
    private static readonly _unitX:Vector3 = new Vector3(1,0,0);
    private static readonly _unitY:Vector3 = new Vector3(0,1,0);
    private static readonly _unitZ:Vector3 = new Vector3(0,0,1);
    private static readonly _strafeVector:Vector3 = new Vector3(1, 0, 0);
    private static readonly _identityQuaternion = new Quaternion(0,0,0,1);
    public static readonly _mat4Identity = new Matrix4();
    public static readonly MAXNUM:number = 9999999.9;
    private static readonly ISMOBILE:boolean = HelperGeneral.checkIfMobileDevice();

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
        renderState._position = this._zeroVector.lerpVectors(a._position, b._position, alpha).clone();
        renderState._scale = this._zeroVector.lerpVectors(a._scale, b._scale, alpha).clone();
        renderState._rotation = this._identityQuaternion.slerpQuaternions(a._rotation, b._rotation, alpha).clone();
    }

    public static copyStatesCamera(src:CameraState, dest:CameraState)
    {
        dest._eulerInitial.x = src._eulerInitial.x;
        dest._eulerInitial.y = src._eulerInitial.y;
        dest._eulerInitial.z = src._eulerInitial.z;

        dest._euler.x = src._euler.x;
        dest._euler.y = src._euler.y;
        dest._euler.z = src._euler.z;
    }

    
    public static blendStatesCamera(a:CameraState, b:CameraState, alpha:number, renderState:CameraState)
    {
        renderState._euler.set(
            a._euler.x * alpha + b._euler.x * (1.0 - alpha), 
            a._euler.y * alpha + b._euler.y * (1.0 - alpha), 
            a._euler.z * alpha + b._euler.z * (1.0 - alpha)
        );
    }

    public static quaternionFromAxisAngle(axisInput:string, angleInDegrees:number):Quaternion
    {
        let axis:Vector3 = axisInput == "x" ? this._unitX : axisInput == "y" ? this._unitY : this._unitZ;
        let result:Quaternion = new Quaternion(0, 0, 0, 1);
        let angle:number = this.deg2rad(angleInDegrees);
        angle *= 0.5;

        result.x = axis.x * Math.sin(angle);
        result.y = axis.y * Math.sin(angle);
        result.z = axis.z * Math.sin(angle);
        result.w = Math.cos(angle);
        result.normalize();

        return result;
    }

    public static disableInvisibleMeshes(o:Object3D)
    {
        if(o instanceof Mesh)
        {
            if(o.name.includes("_fullhitbox") == true)
            {
                o.visible = false;
            }
        }
        else
        {
            for(let i:number = 0; i < o.children.length; i++)
            {
                this.disableInvisibleMeshes(o.children[i]);
            }
        }
    }

    public static quaternionFrom3Axes(x:number, y:number, z:number):Quaternion
    {
        let e:Euler = new Euler(this.deg2rad(x), this.deg2rad(y), this.deg2rad(z), 'YXZ');
        let result:Quaternion = new Quaternion(0, 0, 0, 1);
        result.setFromEuler(e);
        return result;
    }

    public static getStrafeVector(lav:Vector3, up:Vector3):Vector3
    {
        this._strafeVector.crossVectors(lav, up);
        this._strafeVector.normalize();
        return this._strafeVector;
    }

    public static multiplyVectorByScalar(v:Vector3, s:number, out:Vector3):void
    {
        out.x = v.x * s;
        out.y = v.y * s;
        out.z = v.z * s;
    }

    public static isMobileDevice():boolean
    {
        return this.ISMOBILE;
    }

    private static checkIfMobileDevice():boolean
    {
        //return true;
        return (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1);
        //return window.matchMedia("(any-pointer:coarse)").matches;
    }


    public static transformNormalInverse(norm:Vector3, invMat:Matrix4, result:Vector3):void
    {
        result.set(
            norm.x * invMat.elements[0] + norm.y * invMat.elements[1] + norm.z * invMat.elements[2], 
            norm.x * invMat.elements[4] + norm.y * invMat.elements[5] + norm.z * invMat.elements[6],
            norm.x * invMat.elements[8] + norm.y * invMat.elements[9] + norm.z * invMat.elements[10]
        );
        result.normalize();
    }

    public static transformPosition(pos:Vector3, mat:Matrix4, result:Vector3):void
    {
        result.x = pos.x * mat.elements[0] + pos.y * mat.elements[4] + pos.z * mat.elements[8] + mat.elements[12];
        result.y = pos.x * mat.elements[1] + pos.y * mat.elements[5] + pos.z * mat.elements[9] + mat.elements[13];
        result.z = pos.x * mat.elements[2] + pos.y * mat.elements[6] + pos.z * mat.elements[10] + mat.elements[14];

    }
}

export default HelperGeneral;