import { Vector3 } from "three";
import Hitbox from "../model/Hitbox";
import GameObject from "./GameObject";

class Collision
{
    private _collider:Hitbox;
    private _gameObject:GameObject;
    private _mtv:Vector3;
    private _mtvUp:Vector3;

    constructor(hb:Hitbox, g:GameObject, mtv:Vector3[])
    {
        this._collider = hb;
        this._gameObject = g;
        this._mtv = mtv[0].clone();
        this._mtvUp = mtv[1].clone();
    }
}
export default Collision;