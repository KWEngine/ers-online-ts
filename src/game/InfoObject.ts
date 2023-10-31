import { Object3D, Group } from "three";
import GameObject from "./GameObject";

class InfoObject extends GameObject
{
    constructor(object3d:Group, name:string)
    {
        super(object3d, name);
    }
}
export default InfoObject;