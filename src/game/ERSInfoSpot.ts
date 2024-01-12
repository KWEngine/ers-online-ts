import GameScene from "../scene/GameScene";
import ERSRadiusObject from "./ERSRadiusObject";

class ERSInfoSpot extends ERSRadiusObject
{
    private _counter:number = 0;

    public act(): void
    {
        if(this.isActivatedByPlayer() == false)
        {
            let d:number = Math.sin(this._counter);
            this._counter += (Math.PI * 2.0) / 240.0;
            this.setPositionY(this.getPivotInstance().y + d * 0.25);
            this.addRotationY(0.5);
        }

        if(this.isPlayerNearby() && GameScene.instance.isOverlayVisible() == false)
        {
            if(this.isPlayerLookingAtMe() == true && this.isActivatedByPlayer() == false)
            {
                this.setActivatedByPlayer(true);
                GameScene.instance.showInfoInfo(this.getInnerHTMLSource());
            }
        } 
    }

    public setPivot(x:number, y:number, z:number):void
    {
        this.getPivotInstance().set(x, y, z);
    }
}
export default ERSInfoSpot;