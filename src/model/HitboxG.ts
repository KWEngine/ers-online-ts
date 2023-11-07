import { Matrix4, Quaternion, Vector3 } from "three";
import GameObject from "../game/GameObject";
import Collision from "../game/Collision";
import Hitbox from "./Hitbox";
import HelperGeneral from "../helpers/HelperGeneral";
import Face from "./Face";

class HitboxG
{
    private static _idCounter:number = 0;
    private _name:string;
    private _id:number;
    private _gameObject:GameObject;
    private _boundsMin:Vector3;
    private _boundsMax:Vector3;
    private _center:Vector3 = new Vector3(0, 0, 0);
    private _vertices:Vector3[];
    private _normals:Vector3[];
    private _matrix:Matrix4;
    private _meshMatrix:Matrix4;
    private _meshVertices:Vector3[] = [];
    private _meshNormals:Vector3[] =  [];
    private _meshFaces:Face[] = [];

    private _collisionCandidates:HitboxG[];

    constructor(og:Hitbox, g:GameObject)
    {
        this._name = og.getName();
        this._id = HitboxG._idCounter++;
        this._gameObject = g;
        this._collisionCandidates = [];
        this._matrix = new Matrix4();
        this._normals = [];
        this._vertices = [];
        this._boundsMax = new Vector3(-HelperGeneral.MAXNUM, -HelperGeneral.MAXNUM, -HelperGeneral.MAXNUM);
        this._boundsMin = new Vector3(+HelperGeneral.MAXNUM, +HelperGeneral.MAXNUM, +HelperGeneral.MAXNUM);
        
        for(let i:number = 0; i < og.getMeshFaces().length; i++)
        {
            let f:Face = new Face(og.getMeshFaces()[i]._triangle.a, og.getMeshFaces()[i]._triangle.b, og.getMeshFaces()[i]._triangle.c);
            this._meshFaces.push(f);
        }
        for(let i:number = 0; i < og.getMeshVertices().length; i++)
        {
            this._meshVertices.push(og.getMeshVertices()[i].clone());
        }
        for(let i:number = 0; i < og.getMeshNormals().length; i++)
        {
            this._meshNormals.push(og.getMeshNormals()[i].clone());
        }
        this._meshMatrix = og.getMeshMatrix().clone();
    }

    public getBoundsMin():Vector3
    {
        return this._boundsMin;
    }

    public getBoundsMax():Vector3
    {
        return this._boundsMax;
    }

    public getCenter():Vector3
    {
        return this._center;
    }

    public getName():string
    {
        return this._name;
    }

    public getId():number
    {
        return this._id;
    }

    public getGameObject():GameObject
    {
        return this._gameObject;
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


    private createModelMatrix(translation:Vector3, rotation:Quaternion, scale:Vector3)
    {
        return this._matrix.compose(translation, rotation, scale);
    }

    private static overlaps(min1:number, max1:number, min2:number, max2:number):boolean
    {
        return HitboxG.isBetweenOrdered(min2, min1, max1) || HitboxG.isBetweenOrdered(min1, min2, max2);
    }

    private static isBetweenOrdered(val:number, lowerBound:number, upperBound:number):boolean
    {
        return lowerBound <= val && val <= upperBound;
    }

    private static doCollisionTest(a:HitboxG, b:HitboxG):Collision|null
    {
        let mtv = [new Vector3(0,0,0), new Vector3(0,0,0)];
        let mtvDirectionArray = [1.0];
        let mtvDistanceArray = [Number.POSITIVE_INFINITY];
        let mtvUpDirectionArray = [1.0];
        let mtvUpDistanceArray = [Number.POSITIVE_INFINITY];

        for(let i = 0; i < a._normals.length; i++)
        {
            let shape1MinMax = HitboxG.satTest(a._normals[i], a._vertices);
            let shape2MinMax = HitboxG.satTest(a._normals[i], b._vertices);
            if(!HitboxG.overlaps(shape1MinMax[0], shape1MinMax[1], shape2MinMax[0], shape2MinMax[1]))
            {
                return null;
            }
            else
            {
                HitboxG.calculateOverlap(
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
            let shape1MinMax = HitboxG.satTest(b._normals[i], a._vertices);
            let shape2MinMax = HitboxG.satTest(b._normals[i], b._vertices);
            if(!HitboxG.overlaps(shape1MinMax[0], shape1MinMax[1], shape2MinMax[0], shape2MinMax[1]))
            {
                return null;
            }
            else
            {
                HitboxG.calculateOverlap(
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

    public addCollisionCandidate(h:HitboxG):void
    {
        this._collisionCandidates.push(h);
    }

    public printCollisionCandidatesNames():void
    {
        let s:string = "";
        for(let i:number = 0; i < this._collisionCandidates.length; i++)
        {
            s += this._collisionCandidates[i].getName() + ", ";
        }
        console.log(s);
    }
}
export default HitboxG;