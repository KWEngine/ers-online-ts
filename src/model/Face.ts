import { Triangle, Vector3 } from "three";

class Face
{
    public _triangle:Triangle;
    public _normal:Vector3 = new Vector3(0,0,0);
    
    constructor(v1:Vector3, v2:Vector3, v3:Vector3)
    {
        this._triangle = new Triangle(v1.clone(), v2.clone(), v3.clone());
        this._triangle.getNormal(this._normal);
        this._normal.normalize();
    }
}
export default Face;