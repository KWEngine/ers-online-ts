import GameScene from "../scene/GameScene";
import ERSRadiusObject from "./ERSRadiusObject";

class ERSLocationSpot extends ERSRadiusObject
{
    private _counter:number = 0;
    private _isTraversalSpot:boolean = false;
    private _isUnderConstruction:boolean = false;

    public act(): void
    {
        if(this._isTraversalSpot == true && this._isUnderConstruction == false)
        {

        }
        else
        {
            if(this.isActivatedByPlayer() == false)
            {
                let d:number = Math.sin(this._counter);
                this._counter += (Math.PI * 2.0) / 240.0;
                this.setPositionY(this.getPivotInstance().y + d * 0.1);
                this.addRotationY(0.25);

                if(this.isPlayerNearby() && this.isActivatedByPlayer() == false && GameScene.instance.isOverlayVisible() == false)
                {
                    this.setActivatedByPlayer(true);  
                    if(this._isTraversalSpot == false)
                    {
                        GameScene.instance.eraseNavTarget();
                    }
                    else
                    {
                        if(this._isUnderConstruction == true && this._isTraversalSpot == true)
                        {
                           
                        }
                        else
                        {
                            GameScene.instance.eraseNavTarget();
                        }
                    }

                    if(this._isUnderConstruction == false)
                    {
                        GameScene.instance.showInfoInfo("", "target");
                    }
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
    }

    public setPivot(x:number, y:number, z:number):void
    {
        this.getPivotInstance().set(x, y, z);
    }

    public markAsTraversalSpot():void
    {
        this.setVisible(false);
        this._isTraversalSpot = true;
    }

    public isTraversalSpot():boolean
    {
        return this._isTraversalSpot;
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
export default ERSLocationSpot;