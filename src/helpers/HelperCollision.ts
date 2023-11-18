import { Object3D, Mesh, Vector3 } from "three";
import GameObject from "../game/GameObject";
import Hitbox from "../model/Hitbox";
import HitboxG from "../model/HitboxG";
import Collision from "../game/Collision";

class HelperCollision
{
    private static readonly BROADPHASETOLERANCE:number = 1.0;

    public static getIntersectionsFor(g:GameObject):Collision[]
    {
        let collisionlist:Collision[] = [];
        for(let i:number = 0; i < g.getHitboxes().length; i++)
        {
            for(let j:number = 0; j < g.getHitboxes()[i].getCollisionCandidates().length; j++)
            {
                let c:Collision|null = HitboxG.doCollisionTest(g.getHitboxes()[i], g.getHitboxes()[i].getCollisionCandidates()[j]);
                if(c != null)
                {
                    collisionlist.push(c);
                }
            }
        }
        return collisionlist;
    }

    /*
    internal static bool RayTriangleIntersection(Vector3 rayStart, Vector3 rayDirection, Vector3 vertex0, Vector3 vertex1, Vector3 vertex2, out Vector3 contactPoint)
    {
        const float EPSILON = 0.0000001f;
        contactPoint = Vector3.Zero;
        Vector3 edge1, edge2, h, s, q;
        float a, f, u, v;
        edge1 = vertex1 - vertex0;
        edge2 = vertex2 - vertex0;
        h = Vector3.Cross(rayDirection, edge2);
        a = Vector3.Dot(edge1, h);
        if (a > -EPSILON && a < EPSILON)
            return false;    // ray is parallel to triangle
        f = 1.0f / a;
        s = rayStart - vertex0;
        u = f * Vector3.Dot(s, h); 
        if (u < 0.0 || u > 1.0)
            return false;

        q = Vector3.Cross(s, edge1);
        v = f * Vector3.Dot(rayDirection, q); 
        if (v < 0.0 || u + v > 1.0)
            return false;
        float t = f * Vector3.Dot(edge2, q); <--
        if (t > EPSILON) // ray intersection
        {
            contactPoint = rayStart + rayDirection * t;
            return true;
        }
        else
            return false;
    }
    */

    private static edge1:Vector3 = new Vector3(0,0,0);
    private static edge2:Vector3 = new Vector3(0,0,0);
    private static h:Vector3 = new Vector3(0,0,0);
    private static s:Vector3 = new Vector3(0,0,0);
    private static q:Vector3 = new Vector3(0,0,0);


    public static raycastTriangle(rayStart:Vector3, rayDirection:Vector3, vertex0:Vector3, vertex1:Vector3, vertex2:Vector3, contact:Vector3):boolean
    {
        const EPSILON:number = 0.0000001;
        this.edge1.set(vertex1.x - vertex0.x, vertex1.y - vertex0.y, vertex1.z - vertex0.z);
        this.edge2.set(vertex2.x - vertex0.x, vertex2.y - vertex0.y, vertex2.z - vertex0.z);
        this.h.crossVectors(rayDirection, this.edge2);
        let a:number = this.edge1.dot(this.h);
        if(a > -EPSILON && a < EPSILON)
            return false;

        let f:number = 1.0 / a;
        this.s.set(rayStart.x - vertex0.x, rayStart.y - vertex0.y, rayStart.z - vertex0.z);
        let u:number = f * this.s.dot(this.h);
        if(u < 0.0 || u > 1.0)
            return false;

        this.q.crossVectors(this.s, this.edge1);
        let v:number = f * rayDirection.dot(this.q);
        if(v < 0.0 || u + v > 1.0)
            return false;

        let t:number = f * this.edge2.dot(this.q);
        if(t > EPSILON)
        {
            contact.set(
                rayStart.x + rayDirection.x * t,
                rayStart.y + rayDirection.y * t,
                rayStart.z + rayDirection.z * t
            );
            return true;
        }
        return false;
    }

    public static generateHitboxesFor(o:Object3D, hbs:Hitbox[]):void
    {
        if(o instanceof Mesh)
        {
            let m:Mesh = o;
            o.updateMatrix();
            if(o.name.includes("_nohitbox") == false)
            {
                let hb = new Hitbox(m.matrix, m.geometry, m.name);
                hbs.push(hb);
            }
        }
        else
        {
            if(o.name.includes("_nohitbox") == false)
            {
                for(let i:number = 0; i < o.children.length; i++)
            {
                this.generateHitboxesFor(o.children[i], hbs);
            }
            }
            
        }
    }

    public static checkIfInAttributeArray(haystack:Vector3[], needle:Vector3):boolean
    {
        for(let i:number = 0; i < haystack.length; i++)
        {
            if(
                Math.round(needle.x * 100.0) / 100.0 == Math.round(haystack[i].x * 100.0) / 100.0 && 
                Math.round(needle.y * 100.0) / 100.0 == Math.round(haystack[i].y * 100.0) / 100.0 && 
                Math.round(needle.z * 100.0) / 100.0 == Math.round(haystack[i].z * 100.0) / 100.0
                )
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

    private static sign(p1:Vector3, p2:Vector3, p3:Vector3):number
    {
        return (p1.x - p3.x) * (p2.z - p3.z) * (p2.x - p3.x) * (p1.z - p3.z);
    }

    public static isPointInTriangle2D(p:Vector3, tv1:Vector3, tv2:Vector3, tv3:Vector3):boolean
    {
        let d1:number = this.sign(p, tv1, tv2);
        let d2:number = this.sign(p, tv2, tv3);
        let d3:number = this.sign(p, tv3, tv1);
        
        let has_neg:boolean = d1 < 0 || d2 < 0 || d3 < 0;
        let has_pos:boolean = d1 > 0 || d2 > 0 || d3 > 0;

        return !(has_neg && has_pos);
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