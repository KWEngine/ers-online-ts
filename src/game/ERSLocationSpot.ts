import GameScene from "../scene/GameScene";
import ERSRadiusObject from "./ERSRadiusObject";

class ERSLocationSpot extends ERSRadiusObject
{
    private _counter:number = 0;

    public act(): void
    {
        if(this.isActivatedByPlayer() == false)
        {
            let d:number = Math.sin(this._counter);
            this._counter += (Math.PI * 2.0) / 240.0;
            this.setPositionY(this.getPivotInstance().y + d * 0.1);
            this.addRotationY(0.25);

            if(this.isPlayerNearby() && this.isActivatedByPlayer() == false)
            {
                this.setActivatedByPlayer(true);  
            } 
        }
        else
        {
            // Location wurde erreicht:
            this.setScaleRelative(0.975);
            if(this.getScaleAvg() < 0.01)
            {
                this.markForRemoval();
            }
        }
        
    }

    public setPivot(x:number, y:number, z:number):void
    {
        this.getPivotInstance().set(x, y, z);
    }
}
export default ERSLocationSpot;