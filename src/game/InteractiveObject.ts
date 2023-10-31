import GameObject from "./GameObject";

abstract class InteractiveObject extends GameObject
{
    public abstract act():void;
}
export default InteractiveObject;