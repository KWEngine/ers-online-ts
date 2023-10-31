import { Vector3 } from "three";
import RenderObject from "../game/RenderObject";

class ERSSceneInits
{
    public ambientLight:string = "0x000000";
    public playerStart:Vector3 = new Vector3(0,0,0);
    public renderObjects:any[] = [];
}

export default ERSSceneInits;