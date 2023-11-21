import { Vector3, Quaternion } from "three";
import HelperGeneral from "../helpers/HelperGeneral";

class State
{
    public _position:Vector3;
    public _scale:Vector3;
    public _rotation:Quaternion;
    public _lookAtVector:Vector3 = new Vector3(0, 0, 1);

    public _boundsMin:Vector3;
    public _boundsMax:Vector3;
    public _center:Vector3;

    constructor()
    {
        this._boundsMax = new Vector3(-HelperGeneral.MAXNUM, -HelperGeneral.MAXNUM, -HelperGeneral.MAXNUM);
        this._boundsMin = new Vector3(+HelperGeneral.MAXNUM, +HelperGeneral.MAXNUM, +HelperGeneral.MAXNUM);
        this._center = new Vector3(0, 0, 0);

        this._position = new Vector3(0,0,0);
        this._scale = new Vector3(1,1,1);
        this._rotation = new Quaternion(0, 0, 0, 1);

        HelperGeneral.rotateVectorByQuaternion(this._lookAtVector, this._rotation);
    }
}
export default State;