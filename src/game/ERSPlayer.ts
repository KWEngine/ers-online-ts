import HelperControls from "../helpers/HelperControls";
import GameScene from "../scene/GameScene";
import InteractiveObject from "./InteractiveObject";

class ERSPlayer extends InteractiveObject
{
    private _yOffset:number = 0;

    public act(): void 
    {
        if(HelperControls._keys.get("w"))
        {
            this.moveOffset(0, 0, -0.1);
        }
        if(HelperControls._keys.get("s"))
        {
            this.moveOffset(0, 0, +0.1);
        }
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