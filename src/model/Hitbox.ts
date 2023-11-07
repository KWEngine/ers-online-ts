import { Vector3, Matrix4, BufferGeometry, BufferAttribute } from "three";
import HelperCollision from "../helpers/HelperCollision";
import Face from "./Face";

class Hitbox 
{
    private _name:string;

    public _boundsMin:Vector3;
    public _boundsMax:Vector3;
    public _center:Vector3 = new Vector3(0, 0, 0);

    private _meshMatrix:Matrix4;
    private _meshVertices:Vector3[];
    private _meshNormals:Vector3[];
    private _meshFaces:Face[];

    constructor(
        matrixFromNode:Matrix4,
        geometry:BufferGeometry,
        name:string)
    {
        this._name = "" + name;
        this._meshNormals = [];
        this._meshVertices = [];
        this._meshFaces = [];
        this._meshMatrix = matrixFromNode!.clone();
        this._boundsMax = geometry.boundingBox!.max.clone();
        this._boundsMin = geometry.boundingBox!.min.clone();
        this.init(geometry);
    }

    public getMeshFaces():Face[]
    {
        return this._meshFaces;
    }

    public getMeshVertices():Vector3[]
    {
        return this._meshVertices;
    }

    public getMeshNormals():Vector3[]
    {
        return this._meshNormals;
    }

    public getMeshMatrix():Matrix4
    {
        return this._meshMatrix;
    }

    public getName():string
    {
        return this._name;
    }

    private init(geometry:BufferGeometry):void
    {
        // Finde einzigartige Vertices:
        const index:BufferAttribute = geometry.getIndex()!;
        for (let i:number = 0; i < index.count; i += 3) 
        {
            let v1:Vector3 = new Vector3(
                geometry.attributes.position.getX(index.getX(i)), 
                geometry.attributes.position.getY(index.getX(i)), 
                geometry.attributes.position.getZ(index.getX(i))
                );
            let v2:Vector3 = new Vector3(
                geometry.attributes.position.getX(index.getX(i+1)), 
                geometry.attributes.position.getY(index.getX(i+1)), 
                geometry.attributes.position.getZ(index.getX(i+1))
                );
            let v3:Vector3 = new Vector3(
                geometry.attributes.position.getX(index.getX(i+2)), 
                geometry.attributes.position.getY(index.getX(i+2)), 
                geometry.attributes.position.getZ(index.getX(i+2))
                );
            
            // Generiere aus drei Vertices ein Dreieck (Face):
            let f:Face = new Face(v1, v2, v3);
            this._meshFaces.push(f);

            // Für die Kollisionsberechnung via SAT benötigen wir nur
            // einzigartige Vertices:
            if(HelperCollision.checkIfInAttributeArray(this._meshVertices, v1) == false)
                this._meshVertices.push(v1);
            if(HelperCollision.checkIfInAttributeArray(this._meshVertices, v2) == false)
                this._meshVertices.push(v2);
            if(HelperCollision.checkIfInAttributeArray(this._meshVertices, v3) == false)
                this._meshVertices.push(v3);
        }

        // Finde einzigartige Normals:
        for ( let i = 0; i < this._meshFaces.length; i++ ) 
        {
            let n:Vector3 = this._meshFaces[i]._normal.clone();
            if(HelperCollision.checkIfInAttributeArray(this._meshNormals, n) == false)
            {
                this._meshNormals.push(n);
            }
        }
    }
}
export default Hitbox;