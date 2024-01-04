import { Vector3 } from "three";
import GameScene from "../scene/GameScene";
import InteractiveObject from "./InteractiveObject";

abstract class ERSRadiusObject extends InteractiveObject
{
    private _radiusInner:number = 1.25;
    private _radiusOuter:number = 3.0;
    private _pivot:Vector3 = new Vector3(0,0,0);
    private _innerHTMLSource:string = "";
    private _activatedByPlayer:boolean = false;

    public abstract act():void;

    public isActivatedByPlayer():boolean
    {
        return this._activatedByPlayer;
    }

    public setActivatedByPlayer(activated:boolean):void
    {
        this._activatedByPlayer = activated;
    }

    public setRadiusInnerOuter(i:number, o:number):void
    {
        this._radiusInner = i;
        this._radiusOuter = o;
    }

    public getRadiusInner():number
    {
        return this._radiusInner;
    }

    public getRadiusOuter():number
    {
        return this._radiusOuter;
    }

    protected getPivotInstance():Vector3
    {
        return this._pivot;
    }
        
    public setPivot(x:number, y:number, z:number):void
    {
        this._pivot.set(x, y, z);
    }

    public setInnerHTMLSource(html:string):void
    {
        this._innerHTMLSource = html;
    }

    public getInnerHTMLSource():string
    {
        return this._innerHTMLSource;
    }

    protected isPlayerNearby():boolean
    {
        let x:number = this._pivot.x - GameScene.instance.getPlayer().getPositionInstance().x;
        let y:number = (this._pivot.y - GameScene.instance.getPlayer().getPositionInstance().y) * 0.5;
        let z:number = this._pivot.z - GameScene.instance.getPlayer().getPositionInstance().z;
        let distance:number = Math.sqrt(x * x + y * y + z * z);

        if(distance > this._radiusOuter)
            this.setActivatedByPlayer(false);

        return distance < this._radiusInner;
    }

    protected isPlayerLookingAtMe():boolean
    {
        let pPos:Vector3 = new Vector3(
            this._pivot.x - GameScene.instance.getPlayer().getPositionInstance().x,
            0,
            this._pivot.z - GameScene.instance.getPlayer().getPositionInstance().z
         );
         pPos.normalize();
        let dotDir:number = GameScene.instance.getPlayer().getLookAtVectorPlayerInstance().dot(pPos);
        return dotDir > 0.8;
    }

}
export default ERSRadiusObject;