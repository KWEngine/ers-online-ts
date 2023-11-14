import { Vector3 } from "three";
import HelperControls from "../helpers/HelperControls";
import GameScene from "../scene/GameScene";
import InteractiveObject from "./InteractiveObject";
import Collision from "./Collision";
import ERSPortal from "./ERSPortal";

class ERSPlayer extends InteractiveObject
{
    private _yOffset:number = 0;
    private _speed:number = 0.06;
    private _direction:Vector3 = new Vector3(0, 0, 0);

    public act(): void 
    {
        let portal:boolean = false;

        this.updateDirectionVector();
        this.moveOffsetByVectorAndSpeed(this._direction, this._speed);

        let collisionList:Collision[] = this.getIntersections();
        for(let i:number = 0; i < collisionList.length; i++)
        {
            let c:Collision = collisionList[i];
            if(c.getCollider().getGameObject() instanceof ERSPortal)
            {
                portal = true;
            }
            this.moveOffsetByVector(c.getMTV());
        }

        if(portal)
        {
            GameScene.instance.showPortalInfo();
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