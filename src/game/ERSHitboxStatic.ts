import GameObject from "./GameObject";

class ERSHitboxStatic extends GameObject
{
    public updateFaces():void
    {
        for(let i:number = 0; i < this.getHitboxes().length; i++)
        {
            this.getHitboxes()[i].updateFaces();
        }
    }
}

export default ERSHitboxStatic;