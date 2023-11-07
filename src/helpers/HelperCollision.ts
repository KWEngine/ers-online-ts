import { Object3D, Mesh, Vector3 } from "three";
import GameObject from "../game/GameObject";
import Hitbox from "../model/Hitbox";
import HitboxG from "../model/HitboxG";

class HelperCollision
{
    private static readonly BROADPHASETOLERANCE:number = 1.0;

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

    private static getLowExtendForAxis(hb:HitboxG, axisIndex:number):number
    {
        if(axisIndex == 0)
        {
            return hb.getBoundsMin().x;
        }
        else if(axisIndex == 1)
        {
            return hb.getBoundsMin().y;
        }
        else
        {
            return hb.getBoundsMin().z;
        }
    }

    private static getHighExtendForAxis(hb:HitboxG, axisIndex:number):number
    {
        if(axisIndex == 0)
        {
            return hb.getBoundsMax().x;
        }
        else if(axisIndex == 1)
        {
            return hb.getBoundsMax().y;
        }
        else
        {
            return hb.getBoundsMax().z;
        }
    }

    public static collisionBroadphaseTest(hbs:HitboxG[], axisIndex:number):number
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
            let fromI:HitboxG = hbs[i];
            this._centerSum.x += fromI.getCenter().x;
            this._centerSum.y += fromI.getCenter().y;
            this._centerSum.z += fromI.getCenter().z;
            this._centerSumSq.x += fromI.getCenter().x * fromI.getCenter().x;
            this._centerSumSq.y += fromI.getCenter().y * fromI.getCenter().y;
            this._centerSumSq.z += fromI.getCenter().z * fromI.getCenter().z;

            for(let j = i + 1; j < hbs.length; j++)
            {
                let fromJ:HitboxG = hbs[j];
                if(this.getLowExtendForAxis(fromJ, axisIndex) - this.BROADPHASETOLERANCE > this.getHighExtendForAxis(fromI, axisIndex) + this.BROADPHASETOLERANCE)
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

    public static copyHitbox(source:Hitbox, g:GameObject):HitboxG
    {
        let target:HitboxG = new HitboxG(source, g);
        return target;
    }
}

export default HelperCollision;

function compareGameObjectsX(a:HitboxG, b:HitboxG)
{
    if (a.getBoundsMin().x < b.getBoundsMin().x) {
      return -1;
    }
    if (a.getBoundsMin().x > b.getBoundsMin().x) {
      return 1;
    }
    return 0;
}

function compareGameObjectsY(a:HitboxG, b:HitboxG)
{
    if (a.getBoundsMin().y < b.getBoundsMin().y) {
      return -1;
    }
    if (a.getBoundsMin().y > b.getBoundsMin().y) {
      return 1;
    }
    return 0;
}

function compareGameObjectsZ(a:HitboxG, b:HitboxG)
{
    if (a.getBoundsMin().z < b.getBoundsMin().z) {
      return -1;
    }
    if (a.getBoundsMin().z > b.getBoundsMin().z) {
      return 1;
    }
    return 0;
}