import { Vector3 } from "three";
import HelperControls from "../helpers/HelperControls";
import GameScene from "../scene/GameScene";
import InteractiveObject from "./InteractiveObject";
import Collision from "./Collision";
import ERSPortal from "./ERSPortal";
import ERSInfoSpot from "./ERSInfoSpot";
import HitboxG from "../model/HitboxG";
import Face from "../model/Face";
import HelperCollision from "../helpers/HelperCollision";
import HelperGeneral from "../helpers/HelperGeneral";

class ERSPlayer extends InteractiveObject
{
    private _yOffset:number = 0;
    private _speed:number = 0.06;
    private _direction:Vector3 = new Vector3(0, 0, 0);
    private _posTmp:Vector3 = new Vector3(0, 0, 0);
    private _rayDown:Vector3 = new Vector3(0, -1, 0);
    private _rayContact:Vector3 = new Vector3(0, 0, 0);

    public act(): void 
    {
        let portal:string = "";

        this.updateDirectionVector();
        this.moveOffsetByVectorAndSpeed(this._direction, this._speed);


        let collisionList:Collision[] = this.getIntersections();
        for(let i:number = 0; i < collisionList.length; i++)
        {
            let c:Collision = collisionList[i];
            if(c.getCollider().getGameObject() instanceof ERSPortal)
            {
                portal = (c.getCollider().getGameObject() as ERSPortal).getInnerHTMLSource();
            }
            else if(c.getCollider().getGameObject() instanceof ERSInfoSpot)
            {

            }
            
            if(c.getCollider().isStairsOrFloor())
            {
                this.moveOffsetToFloor(c.getCollider());
            }
            else
            {
                this.moveOffsetByVector(c.getMTV());
            }
        }

        if(portal.length > 0)
        {
            GameScene.instance.showPortalInfo(portal);
        }
    }

    private moveOffsetToFloor(hb:HitboxG):void
    {
        this._posTmp.set(
            this.getHitboxes()[0].getCenter().x,
            this.getHitboxes()[0].getCenter().y + HelperGeneral.RAYCASTOFFSET,
            this.getHitboxes()[0].getCenter().z
        );

        for(let i:number = 0; i < hb.getFaces().length; i++)
        {
            let f:Face = hb.getFaces()[i];
            if(f._normal.y > 0)
            {
                let hasContact:boolean = HelperCollision.raycastTriangle(this._posTmp, this._rayDown, f._triangle.a, f._triangle.b, f._triangle.c, this._rayContact);
                if(hasContact)
                {
                    this.setPositionY(this._rayContact.y);
                }
            }
        }
       
    }

    private updateDirectionVector():void
    {
        let lav = GameScene.instance.getCameraLookAtVectorXZ();
        let lavStrafe = GameScene.instance.getCameraLookAtStrafeVectorXZ();
        this._direction.set(0, 0, 0);
        this._direction.x += HelperControls._motionMove[0] * lav.x;
        this._direction.y += HelperControls._motionMove[0] * lav.y;
        this._direction.z += HelperControls._motionMove[0] * lav.z;

        this._direction.x += HelperControls._motionMove[1] * lavStrafe.x;
        this._direction.y += HelperControls._motionMove[1] * lavStrafe.y;
        this._direction.z += HelperControls._motionMove[1] * lavStrafe.z;

        if(this._direction.lengthSq() > 1)
            this._direction.normalize();
        //this._direction.y -= 0.1;
    }

    public setYOffset(y:number):void
    {
        this._yOffset = y;
    }

    public getYOffset():number
    {
        return this._yOffset;
    }
}

export default ERSPlayer;