import InteractiveObject from "./InteractiveObject";

class ERSPlayer extends InteractiveObject
{
    private _moveRight:boolean = true;

    public act(): void {
        if(this._moveRight)
        {
            this.moveOffset(0.01, 0, 0);
            if(this.getPosition().x > 5)
            {
                this._moveRight = false;
            }
        }
        else
        {
            this.moveOffset(-0.01, 0, 0);
            if(this.getPosition().x < -5)
            {
                this._moveRight = true;
            }
        }
        
    }
    
}
export default ERSPlayer;