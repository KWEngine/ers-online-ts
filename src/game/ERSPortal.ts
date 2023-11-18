import InteractiveObject from "./InteractiveObject";

class ERSPortal extends InteractiveObject
{
    private _target:string = "";
    private _innerHTMLSource:string = "";
    private _cooldown:number = 0;

    public act(): void 
    {
        
    }

    public setTarget(t:string):void
    {
        this._target = t;
    }

    public getTarget():string
    {
        return this._target;
    }

    public setInnerHTMLSource(html:string):void
    {
        this._innerHTMLSource = html;
    }

    public getInnerHTMLSource():string
    {
        return this._innerHTMLSource;
    }
}
export default ERSPortal;