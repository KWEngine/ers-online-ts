import { Vector3 } from "three";
import GameScene from "../scene/GameScene";
import ERSRadiusObject from "./ERSRadiusObject";

class ERSPortal extends ERSRadiusObject
{
    private _target:string = "";
    private _counter:number = 0;

    public act(): void 
    {
        let d:number = Math.sin(this._counter);
        this._counter += (Math.PI * 2.0) / 120.0;
        this.setPosition(
          this.getPivotInstance().x + d * 0.25 * this.getLookAtVectorInstance().x,
          this.getPivotInstance().y + d * 0.25 * this.getLookAtVectorInstance().y,
          this.getPivotInstance().z + d * 0.25 * this.getLookAtVectorInstance().z,
        );

        if(this.isPlayerNearby())
        {
            if(this.isPlayerLookingAtMe() == true && this.isActivatedByPlayer() == false)
            {
                this.setActivatedByPlayer(true);
                GameScene.instance.showPortalInfo(this.getInnerHTMLSource());
            }
        } 
    }

    public setTarget(t:string):void
    {
        this._target = t;
    }

    public getTarget():string
    {
        return this._target;
    }
}
export default ERSPortal;