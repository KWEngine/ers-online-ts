import HelperCookie from "../helpers/HelperCookie";
import HelperGeneral from "../helpers/HelperGeneral";
import GameScene from "../scene/GameScene";
import ERSRadiusObject from "./ERSRadiusObject";

class ERSPortal extends ERSRadiusObject
{
    private _target:string = "";
    private _counter:number = 0;
    private _isUnderConstruction:boolean = false;

    public act(): void 
    {
        if(this.isActivatedByPlayer() == false && this._isUnderConstruction == false)
        {
            let d:number = Math.sin(this._counter);
            this._counter += (Math.PI * 2.0) / 120.0;
            this.setPosition(
            this.getPivotInstance().x + d * 0.25 * this.getLookAtVectorInstance().x,
            this.getPivotInstance().y + d * 0.25 * this.getLookAtVectorInstance().y,
            this.getPivotInstance().z + d * 0.25 * this.getLookAtVectorInstance().z,
            );
        }

        let playerNearby:boolean = this._isUnderConstruction == false && this.isPlayerNearby();
        if(playerNearby == true && GameScene.instance.isOverlayVisible() == false)
        {
            let lookingAt:boolean = this.isPlayerLookingAtMe();
            if(lookingAt == true && this.isActivatedByPlayer() == false)
            {
                this.setActivatedByPlayer(true);
                let selectedRoom:string = "";
                if(GameScene.instance.getNavTarget() != null && GameScene.instance.getNavTarget()!.isTraversalSpot())
                {
                    selectedRoom = HelperGeneral.getSelectedBlockRoom();
                }

                GameScene.instance.showPortalInfo(this.getInnerHTMLSource(), selectedRoom);
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

    public markAsUnderConstruction():void
    {
        this.setVisible(false);
        this._isUnderConstruction = true;   
    }

    public isUnderConstruction():boolean
    {
        return this._isUnderConstruction;
    }
}
export default ERSPortal;