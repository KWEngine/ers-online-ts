import { Object3D, Group } from "three";
import GameObject from "./GameObject";

abstract class InteractiveObject extends GameObject
{
    constructor(object3d:Group, name:string)
    {
        super(object3d, name);
    }

    public abstract act():void;
}
export default InteractiveObject;