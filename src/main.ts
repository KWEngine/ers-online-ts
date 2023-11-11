import './style.css';
import '../src/inc';
import GameScene from './scene/GameScene';
import { getSceneFromLocation } from '../src/inc';
import HelperGeneral from './helpers/HelperGeneral';

// Finde anhand der URL heraus, welche Szene angezeigt werden soll
// und lade die entsprechende Szene:

let scene:string = getSceneFromLocation(window.location);

GameScene.instance.load(scene)
    .then(result => {
        if(!HelperGeneral.isMobileDevice())
        {
            document.getElementById("pointerlock")!.setAttribute("style", "-webkit-backdrop-filter: blur(0.5rem) contrast(125%) brightness(0.8);");
            document.getElementById("pointerlock")!.setAttribute("style", "backdrop-filter: blur(0.5rem) contrast(125%) brightness(0.8);");
            document.getElementById("pointerlock")!.style.opacity = "1";
        }
        document.getElementById("loadingscreen")!.style.display = "none";
        GameScene.instance.render();
    })
    .catch(err =>
    {
        console.log(err);
        alert("Virtueller Rundgang ist auf diesem Gerät nicht möglich.");
    });

