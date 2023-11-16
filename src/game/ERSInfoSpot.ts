import InteractiveObject from "./InteractiveObject";

class ERSInfoSpot extends InteractiveObject
{
    private _innerHTMLSource:string = "";
    private _pivotHeight:number = 1;
    private _counter:number = 0;

    public act(): void
    {
        let d:number = Math.sin(this._counter);
        this._counter += (Math.PI * 2.0) / 240.0;
        this.setPositionY(this._pivotHeight + d * 0.5);
        this.addRotationY(0.5);
    }

    public setPivotHeight(p:number):void
    {
        this._pivotHeight = p;
    }

    public setInnerHTMLSource(t:string):void
    {
        this._innerHTMLSource = t;
    }

    public getInnerHTMLSource():string
    {
        return this._innerHTMLSource;
    }
}
export default ERSInfoSpot;