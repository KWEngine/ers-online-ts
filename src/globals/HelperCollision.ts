import { Object3D, Mesh, Group, Vector3 } from "three";
import GameObject from "../scene/GameObject";
import Hitbox from "../scene/Hitbox";

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
            // Generiere Hitbox für Mesh:
            
            o.updateMatrix();
            console.log("mesh found");
            console.log(o);
            
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
}

export default HelperCollision;