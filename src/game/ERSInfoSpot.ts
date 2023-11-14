import InteractiveObject from "./InteractiveObject";

class ERSInfoSpot extends InteractiveObject
{
    private _innerHTMLSource:string = "";

    public act(): void
    {
        
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