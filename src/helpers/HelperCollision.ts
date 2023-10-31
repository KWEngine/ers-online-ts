import { Object3D, Mesh, Group, Vector3 } from "three";
import GameObject from "../game/GameObject";
import Hitbox from "../model/Hitbox";

class HelperCollision
{
    public static getIntersectionsFor(g:GameObject)
    {
        return [];
    }

    public static generateHitboxesFor(o:Object3D, hbs:Hitbox[]):void
    {
        if(o instanceof Mesh)
        {
            let m:Mesh = o;
            
            o.updateMatrix();
            let hb = new Hitbox(m.matrix, m.geometry, m.name);
            hbs.push(hb);
        }
        else
        {
            for(let i:number = 0; i < o.children.length; i++)
            {
                this.generateHitboxesFor(o.children[i], hbs);
            }
        }
    }

    public static checkIfInAttributeArray(haystack:Vector3[], needle:Vector3):boolean
    {
        for(let i:number = 0; i < haystack.length; i++)
        {
            if(needle.x == haystack[i].x && 
                needle.y == haystack[i].y && 
                needle.z == haystack[i].z)
                {
                    return true;
                }
        }
        return false;
    }

    private static _centerSum:Vector3 = new Vector3(0,0,0);
    private static _centerSumSq:Vector3 = new Vector3(0,0,0);
    private static _centerVariance:Vector3 = new Vector3(0,0,0);

    private static getLowExtendForAxis(hb:Hitbox, axisIndex:number):number
    {
        if(axisIndex == 0)
        {
            return hb._boundsMin.x;
        }
        else if(axisIndex == 1)
        {
            return hb._boundsMin.y;
        }
        else
        {
            return hb._boundsMin.z;
        }
    }

    private static getHighExtendForAxis(hb:Hitbox, axisIndex:number):number
    {
        if(axisIndex == 0)
        {
            return hb._boundsMax.x;
        }
        else if(axisIndex == 1)
        {
            return hb._boundsMax.y;
        }
        else
        {
            return hb._boundsMax.z;
        }
    }

    public static collisionBroadphaseTest(hbs:Hitbox[], axisIndex:number):number
    {
        let returnAxis:number = 0;

        if (axisIndex == 2)
            hbs.sort(compareGameObjectsZ);
        else if (axisIndex == 1)
            hbs.sort(compareGameObjectsY);
        else
            hbs.sort(compareGameObjectsX);

        this._centerSum.x = 0;
        this._centerSum.y = 0;
        this._centerSum.z = 0;
        this._centerSumSq.x = 0;
        this._centerSumSq.y = 0;
        this._centerSumSq.z = 0;
        this._centerVariance.x = 0;
        this._centerVariance.y = 0;
        this._centerVariance.z = 0;

        for(let i = 0; i < hbs.length; i++)
        {
            let fromI:Hitbox = hbs[i];
            this._centerSum.x += fromI._center.x;
            this._centerSum.y += fromI._center.y;
            this._centerSum.z += fromI._center.z;
            this._centerSumSq.x += fromI._center.x * fromI._center.x;
            this._centerSumSq.y += fromI._center.y * fromI._center.y;
            this._centerSumSq.z += fromI._center.z * fromI._center.z;

            for(let j = i + 1; j < hbs.length; j++)
            {
                let fromJ:Hitbox = hbs[j];
                if(this.getLowExtendForAxis(fromJ, axisIndex) > this.getHighExtendForAxis(fromI, axisIndex))
                {
                    break;
                }
                fromI.addCollisionCandidate(fromJ);
                fromJ.addCollisionCandidate(fromI);
            }

            this._centerSum.x /= hbs.length;
            this._centerSum.y /= hbs.length;
            this._centerSum.z /= hbs.length;
            this._centerSumSq.x /= hbs.length;
            this._centerSumSq.y /= hbs.length;
            this._centerSumSq.z /= hbs.length;

            this._centerVariance.x = this._centerSumSq.x - (this._centerSum.x - this._centerSum.x);
            this._centerVariance.y = this._centerSumSq.y - (this._centerSum.y - this._centerSum.y);
            this._centerVariance.z = this._centerSumSq.z - (this._centerSum.z - this._centerSum.z);

            let maxVar:number = Math.abs(this._centerVariance.x);
            if (Math.abs(this._centerVariance.y) > maxVar)
            {
                maxVar = Math.abs(this._centerVariance.y);
                returnAxis = 1;
            }
            if(Math.abs(this._centerVariance.z) > maxVar)
            {
                maxVar = Math.abs(this._centerVariance.z);
                returnAxis = 2;
            }        
        }
        return returnAxis;
    }
}

export default HelperCollision;

function compareGameObjectsX(a:Hitbox, b:Hitbox)
{
    if (a._boundsMin.x < b._boundsMin.x) {
      return -1;
    }
    if (a._boundsMin.x > b._boundsMin.x) {
      return 1;
    }
    return 0;
}

function compareGameObjectsY(a:Hitbox, b:Hitbox)
{
    if (a._boundsMin.y < b._boundsMin.y) {
      return -1;
    }
    if (a._boundsMin.y > b._boundsMin.y) {
      return 1;
    }
    return 0;
}

function compareGameObjectsZ(a:Hitbox, b:Hitbox)
{
    if (a._boundsMin.z < b._boundsMin.z) {
      return -1;
    }
    if (a._boundsMin.z > b._boundsMin.z) {
      return 1;
    }
    return 0;
}