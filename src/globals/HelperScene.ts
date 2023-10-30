import ERSScene from "../scene/ERSScene";
import Scene from "../scene/ERSScene";

class HelperScene
{
    public static parseSceneSettings(scene:string) : Scene
    {
        let path = "/public/scenes/" + scene + ".json";
        let request = new XMLHttpRequest();
        request.open("GET", path, false);
        request.send(null);
        let json:ERSScene = JSON.parse(request.responseText);
        return json;
    }
}

export default HelperScene;