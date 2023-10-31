import { Vector3, Matrix4, Quaternion, Box3, BufferGeometry, BufferAttribute } from "three";
import  GameObject from "../game/GameObject";
import HelperCollision from "../helpers/HelperCollision";
import Face from "./Face";
import Collision from "../game/Collision";

class Hitbox 
{
    private _name:string;
    private _gameObject:GameObject|null;

    public _boundsMin:Vector3;
    public _boundsMax:Vector3;
    public _center:Vector3 = new Vector3(0, 0, 0);
    private _vertices:Vector3[];
    private _normals:Vector3[];
    private _matrix:Matrix4;
    
    private _meshMatrix:Matrix4;
    private _meshVertices:Vector3[];
    private _meshNormals:Vector3[];
    private _meshFaces:Face[];

    private _collisionCandidates:Hitbox[];

    constructor(
        matrixFromNode:Matrix4,
        geometry:BufferGeometry,
        name:string)
    {
        this._gameObject = null;
        this._boundsMax = geometry.boundingBox!.max.clone();
        this._boundsMin = geometry.boundingBox!.min.clone();
        this._matrix = new Matrix4();
        this._name = name;
        this._vertices = [];
        this._normals = [];
        this._meshMatrix = matrixFromNode.clone();
        this._meshNormals = [];
        this._meshVertices = [];
        this._meshFaces = [];
        this._collisionCandidates = [];
        this.init(geometry);
    }

    public getGameObject():GameObject|null
    {
        return this._gameObject;
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

    public update(scale:Vector3, rotation:Quaternion, translation:Vector3):void
    {
        let left:number = 99999999.0;
        let right:number = -99999999.0;
        let bottom:number = 99999999.0;
        let top:number = -99999999.0;
        let back:number = 99999999.0;
        let front:number = -99999999.0;

        this.createModelMatrix(translation, rotation, scale);
        this._matrix.premultiply(this._meshMatrix);

        this._center.x = 0;
        this._center.y = 0;
        this._center.z = 0;
        for(let i:number = 0; i < this._meshVertices.length; i++)
        {
            if(i < this._meshNormals.length)
            {
                let tmpNormal:Vector3 = this._meshNormals[i].clone();
                tmpNormal.applyMatrix4(this._matrix);
                this._normals[i] = tmpNormal;
            }

            var tmpVertex = this._meshVertices[i].clone();
            tmpVertex.applyMatrix4(this._matrix);
            this._center.x += tmpVertex.x;
            this._center.y += tmpVertex.y;
            this._center.z += tmpVertex.z;
            this._vertices[i] = tmpVertex;

            if(tmpVertex.x < left)
                left = tmpVertex.x;
            if(tmpVertex.x > right)
                right = tmpVertex.x;

            if(tmpVertex.y < bottom)
                bottom = tmpVertex.y;
            if(tmpVertex.y > top)
                top = tmpVertex.y;

            if(tmpVertex.z < back)
                back = tmpVertex.z;
            if(tmpVertex.z > front)
                front = tmpVertex.z;
        }       

        this._boundsMax.x = right;
        this._boundsMax.y = top;
        this._boundsMax.z = front;
        this._boundsMin.x = left;
        this._boundsMin.y = bottom;
        this._boundsMin.z = back;
        
        this._center.x /= this._meshVertices.length;
        this._center.y /= this._meshVertices.length;
        this._center.z /= this._meshVertices.length;
    }

    public setGameObject(g:GameObject):void
    {
        this._gameObject = g;
    }

    private createModelMatrix(translation:Vector3, rotation:Quaternion, scale:Vector3)
    {
        return this._matrix.compose(translation, rotation, scale);
    }

    private static overlaps(min1:number, max1:number, min2:number, max2:number):boolean
    {
        return Hitbox.isBetweenOrdered(min2, min1, max1) || Hitbox.isBetweenOrdered(min1, min2, max2);
    }

    private static isBetweenOrdered(val:number, lowerBound:number, upperBound:number):boolean
    {
        return lowerBound <= val && val <= upperBound;
    }

    private static doCollisionTest(a:Hitbox, b:Hitbox):Collision|null
    {
        let mtv = [new Vector3(0,0,0), new Vector3(0,0,0)];
        let mtvDirectionArray = [1.0];
        let mtvDistanceArray = [Number.POSITIVE_INFINITY];
        let mtvUpDirectionArray = [1.0];
        let mtvUpDistanceArray = [Number.POSITIVE_INFINITY];

        for(let i = 0; i < a._normals.length; i++)
        {
            let shape1MinMax = Hitbox.satTest(a._normals[i], a._vertices);
            let shape2MinMax = Hitbox.satTest(a._normals[i], b._vertices);
            if(!Hitbox.overlaps(shape1MinMax[0], shape1MinMax[1], shape2MinMax[0], shape2MinMax[1]))
            {
                return null;
            }
            else
            {
                Hitbox.calculateOverlap(
                    a._normals[i], 
                    shape1MinMax[0],
                    shape1MinMax[1],
                    shape2MinMax[0],
                    shape2MinMax[1],
                    mtvDistanceArray,
                    mtv,
                    mtvDirectionArray,
                    a._center,
                    b._center,
                    mtvUpDistanceArray,
                    mtvUpDirectionArray
                );
            }
        }
        for(let i = 0; i < b._normals.length; i++)
        {
            let shape1MinMax = Hitbox.satTest(b._normals[i], a._vertices);
            let shape2MinMax = Hitbox.satTest(b._normals[i], b._vertices);
            if(!Hitbox.overlaps(shape1MinMax[0], shape1MinMax[1], shape2MinMax[0], shape2MinMax[1]))
            {
                return null;
            }
            else
            {
                Hitbox.calculateOverlap(
                    b._normals[i], 
                    shape1MinMax[0],
                    shape1MinMax[1],
                    shape2MinMax[0],
                    shape2MinMax[1],
                    mtvDistanceArray,
                    mtv,
                    mtvDirectionArray,
                    a._center,
                    b._center,
                    mtvUpDistanceArray,
                    mtvUpDirectionArray
                );
            }
        }

        if(mtv[0].lengthSq() > 0)
        {
            return new Collision(b, b.getGameObject()!, mtv);
        }
        else
        {
            return null;
        }
    }

    private static satTest(axisToTest:Vector3, points:Vector3[]):number[]
    {
        let minAlong = Number.POSITIVE_INFINITY;
        let maxAlong = Number.NEGATIVE_INFINITY;

        for(var i = 0; i < points.length; i++)
        {
            let tmp = points[i].clone();
            let dotVal = tmp.dot(axisToTest);
            if(dotVal < minAlong)
            {
                minAlong = dotVal;
            }
            if(dotVal > maxAlong)
            {
                maxAlong = dotVal;
            }
        }

        return [minAlong, maxAlong];
    }

    private static calculateOverlap(
        axis:Vector3, 
        shape1Min:number, shape1Max:number, 
        shape2Min:number, shape2Max:number, 
        mtvDistance:number[], // array
        mtv:Vector3[], // array with 2 elements (shortest and up)
        mtvDirection:number[], //array
        posA:Vector3,
        posB:Vector3,
        mtvUpDistance:number[], // array
        mtvUpDirection:number[] // array
        )
    {
        let intersectionDepthScaled = 1;
        if (shape1Min < shape2Min)
        {
            if (shape1Max > shape2Max)
            {
                let diff1 = shape1Max - shape2Max;
                let diff2 = shape2Min - shape1Min;
                if(diff1 > diff2)
                {
                    intersectionDepthScaled = shape2Max - shape1Min;
                }
                else
                {
                    intersectionDepthScaled = shape2Min - shape1Max;
                }
            }
            else
            {
                intersectionDepthScaled = shape1Max - shape2Min; // default
            }
        }
        else
        {
            if(shape1Max < shape2Max)
            {
                let diff1 = shape2Max - shape1Max;
                let diff2 = shape1Min - shape2Min;
                if (diff1 > diff2)
                {
                    intersectionDepthScaled = shape1Max - shape2Min;
                }
                else
                {
                    intersectionDepthScaled = shape1Min - shape2Max;
                }
            }
            else
            {
                intersectionDepthScaled = shape1Min - shape2Max; // default
            }
        }
        
        let axisLengthSquared = axis.dot(axis);
        let intersectionDepthSquared = (intersectionDepthScaled * intersectionDepthScaled) / axisLengthSquared;
        
        if(intersectionDepthSquared < mtvDistance[0])
        {
            mtvDistance[0] = intersectionDepthSquared;

            let tmpMtv = axis.clone();
            tmpMtv.multiplyScalar(intersectionDepthScaled / axisLengthSquared);
            let notSameDirection = new Vector3(0,0,0).subVectors(posA, posB).dot(tmpMtv);
            mtvDirection[0] = notSameDirection < 0 ? -1.0 : 1.0;
            /*if(this.meshData == null)
            {
                tmpMtv.multiplyScalar(mtvDirection[0]);
            }*/
            mtv[0] = tmpMtv.clone();
        }
        // find up-vector (for stairs)
        if(Math.abs(axis.y) > Math.abs(axis.x) && Math.abs(axis.y) > Math.abs(axis.z) && (intersectionDepthSquared < mtvUpDistance[0]))
        {
            let tmpMtv = axis.clone();
            tmpMtv.multiplyScalar(intersectionDepthScaled / axisLengthSquared);

            let tmpMtvUpDistance = intersectionDepthSquared;
            let notSameDirection = new Vector3(0,0,0).subVectors(posA, posB).dot(tmpMtv);
            let tmpMtvUpDirection = notSameDirection < 0 ? -1.0 : 1.0;
            /*
            if(this.meshData == null)
            {
                tmpMtv.multiplyScalar(tmpMtvUpDirection);
            }
            */
            mtvUpDistance[0] = tmpMtvUpDistance;
            mtvUpDirection[0] = tmpMtvUpDirection;
            mtv[1] = tmpMtv.clone();
        }
    }

    public clearCollisionCandidates()
    {
        this._collisionCandidates = [];
    }

    public addCollisionCandidate(h:Hitbox):void
    {
        this._collisionCandidates.push(h);
    }
}

export default Hitbox;