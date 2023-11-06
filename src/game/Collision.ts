import { Vector3 } from "three";
import GameObject from "./GameObject";
import HitboxG from "../model/HitboxG";

class Collision
{
    private _collider:HitboxG;
    private _gameObject:GameObject;
    private _mtv:Vector3;
    private _mtvUp:Vector3;

    constructor(hb:HitboxG, g:GameObject, mtv:Vector3[])
    {
        this._collider = hb;
        this._gameObject = g;
        this._mtv = mtv[0].clone();
        this._mtvUp = mtv[1].clone();
    }
}
export default Collision;