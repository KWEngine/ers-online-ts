import { Object3D } from "three";
import GameObject from "./GameObject";

class RenderObject extends GameObject
{
    constructor(object3d:Object3D, name:string)
    {
        super(object3d, name);
    }
}
export default RenderObject;