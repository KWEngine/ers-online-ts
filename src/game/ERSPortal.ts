import InteractiveObject from "./InteractiveObject";

class ERSPortal extends InteractiveObject
{
    private _target:string = "";
    private _innerHTML:string = "";

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

    public setInnerHTML(html:string):void
    {
        this._innerHTML = html;
    }

    public getInnerHTML():string
    {
        return this._innerHTML;
    }
}
export default ERSPortal;