import { Vector3, Quaternion } from "three";

class State
{
    public _position:Vector3;
    public _scale:Vector3;
    public _rotation:Quaternion;

    constructor()
    {
        this._position = new Vector3(0,0,0);
        this._scale = new Vector3(1,1,1);
        this._rotation = new Quaternion(0, 0, 0, 1);
    }
}
export default State;