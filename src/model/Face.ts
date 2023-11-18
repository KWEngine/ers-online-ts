import { Matrix4, Triangle, Vector3 } from "three";
import HelperGeneral from "../helpers/HelperGeneral";

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

    public updateTriangle(m:Matrix4, mInv:Matrix4):void
    {
        HelperGeneral.transformNormalInverse(this._normal, mInv, this._normal);
        HelperGeneral.transformPosition(this._triangle.a, m, this._triangle.a);
        HelperGeneral.transformPosition(this._triangle.b, m, this._triangle.b);
        HelperGeneral.transformPosition(this._triangle.c, m, this._triangle.c);
    }

    public print():void
    {
        console.log("  normal: " + HelperGeneral.roundTo2(this._normal.x) , HelperGeneral.roundTo2(this._normal.y), HelperGeneral.roundTo2(this._normal.z));
        console.log("  v1:     " + HelperGeneral.roundTo2(this._triangle.a.x), HelperGeneral.roundTo2(this._triangle.a.y), HelperGeneral.roundTo2(this._triangle.a.z));
        console.log("  v2:     " + HelperGeneral.roundTo2(this._triangle.b.x), HelperGeneral.roundTo2(this._triangle.b.y), HelperGeneral.roundTo2(this._triangle.b.z));
        console.log("  v3:     " + HelperGeneral.roundTo2(this._triangle.c.x), HelperGeneral.roundTo2(this._triangle.c.y), HelperGeneral.roundTo2(this._triangle.c.z));
    }
}
export default Face;