import { Matrix4, Quaternion, Vector3 } from "three";
import GameObject from "../game/GameObject";
import Collision from "../game/Collision";
import Hitbox from "./Hitbox";
import HelperGeneral from "../helpers/HelperGeneral";
import Face from "./Face";
import ERSPlayer from "../game/ERSPlayer";

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
    private _matrixInverse:Matrix4;
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
        this._matrixInverse = this._matrix.clone();
        this._matrixInverse.invert();
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
            this._vertices.push(new Vector3(0,0,0));
        }
        for(let i:number = 0; i < og.getMeshNormals().length; i++)
        {
            this._meshNormals.push(og.getMeshNormals()[i].clone());
            this._normals.push(new Vector3(0,0,0));
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

        this.updateModelMatrixWith(translation, rotation, scale);
        this._matrix.premultiply(this._meshMatrix);
        this._matrixInverse.copy(this._matrix);
        this._matrixInverse.invert();

        for(let i:number = 0; i < this._meshVertices.length; i++)
        {
            if(i < this._meshNormals.length)
            {
                HelperGeneral.transformNormalInverse(this._meshNormals[i], this._matrixInverse, this._normals[i]);
            }
            HelperGeneral.transformPosition(this._meshVertices[i], this._matrix, this._vertices[i]);

            if(this._vertices[i].x < left)
                left = this._vertices[i].x;
            if(this._vertices[i].x > right)
                right = this._vertices[i].x;

            if(this._vertices[i].y < bottom)
                bottom = this._vertices[i].y;
            if(this._vertices[i].y > top)
                top = this._vertices[i].y;

            if(this._vertices[i].z < back)
                back = this._vertices[i].z;
            if(this._vertices[i].z > front)
                front = this._vertices[i].z;
        }       

        this._boundsMax.x = right;
        this._boundsMax.y = top;
        this._boundsMax.z = front;
        this._boundsMin.x = left;
        this._boundsMin.y = bottom;
        this._boundsMin.z = back;
        
        this._center.x = (this._boundsMax.x + this._boundsMin.x) / 2.0;
        this._center.y = (this._boundsMax.y + this._boundsMin.y) / 2.0;
        this._center.z = (this._boundsMax.z + this._boundsMin.z) / 2.0;
    }


    private updateModelMatrixWith(translation:Vector3, rotation:Quaternion, scale:Vector3):void
    {
        this._matrix.compose(translation, rotation, scale);
    }

    private static overlaps(min1:number, max1:number, min2:number, max2:number):boolean
    {
        return HitboxG.isBetweenOrdered(min2, min1, max1) || HitboxG.isBetweenOrdered(min1, min2, max2);
    }

    private static isBetweenOrdered(val:number, lowerBound:number, upperBound:number):boolean
    {
        return lowerBound <= val && val <= upperBound;
    }

    public getNormals():Vector3[]
    {
        return this._normals;
    }

    public static doCollisionTest(a:HitboxG, b:HitboxG):Collision|null
    {
        let mtv:Vector3[] = [new Vector3(0,0,0), new Vector3(0,0,0)];
        let mtvDistanceArray:number[] = [HelperGeneral.MAXNUM, HelperGeneral.MAXNUM];
        
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
                    a._center,
                    b._center
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
                    a._center,
                    b._center
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
            let dotVal = points[i].dot(axisToTest);
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
        mtvDistance:number[], // array with 2 elements (shortest and up)
        mtv:Vector3[], // array with 2 elements (shortest and up)
        posA:Vector3,
        posB:Vector3
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
        
        //let axisLengthSquared:number = axis.dot(axis);
        let intersectionDepthSquared:number = (intersectionDepthScaled * intersectionDepthScaled);// / axisLengthSquared;
        
        if(intersectionDepthSquared < mtvDistance[0])
        {
            mtvDistance[0] = intersectionDepthSquared;
            let tmpMtv = axis.clone(); tmpMtv.multiplyScalar(intersectionDepthScaled); // / axisLengthSquared);
            let notSameDirection = (posA.x - posB.x) * tmpMtv.x + (posA.y - posB.y) * tmpMtv.y + (posA.z - posB.z) * tmpMtv.z;
            tmpMtv.multiplyScalar(notSameDirection < 0.0 ? -1.0 : 1.0);
            mtv[0] = tmpMtv;
        }

        // find up-vector (for stairs)
        if(Math.abs(axis.y) > Math.abs(axis.x) && Math.abs(axis.y) > Math.abs(axis.z) && (intersectionDepthSquared < mtvDistance[1]))
        {
            let tmpMtvUp = axis.clone(); tmpMtvUp.multiplyScalar(intersectionDepthScaled); // / axisLengthSquared);
            mtvDistance[1] = intersectionDepthSquared;
            let notSameDirection = (posA.x - posB.x) * tmpMtvUp.x + (posA.y - posB.y) * tmpMtvUp.y + (posA.z - posB.z) * tmpMtvUp.z;
            tmpMtvUp.multiplyScalar(notSameDirection < 0.0 ? -1.0 : 1.0);
            mtv[1] = tmpMtvUp;
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

    public getCollisionCandidates():HitboxG[]
    {
        return this._collisionCandidates;
    }
}
export default HitboxG;