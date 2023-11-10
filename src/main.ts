import './style.css';
import '../src/inc';
import GameScene from './scene/GameScene';
import { getSceneFromLocation } from '../src/inc';

// Finde anhand der URL heraus, welche Szene angezeigt werden soll
// und lade die entsprechende Szene:

let scene:string = getSceneFromLocation(window.location);

GameScene.instance.load(scene)
    .then(result => {
        document.getElementById("pointerlock")!.setAttribute("style", "-webkit-backdrop-filter: blur(0.5rem) contrast(125%) brightness(0.8);");
        document.getElementById("pointerlock")!.setAttribute("style", "backdrop-filter: blur(0.5rem) contrast(125%) brightness(0.8);");
        document.getElementById("pointerlock")!.style.opacity = "1";
        GameScene.instance.render();
    })
    .catch(err =>
    {
        console.log(err);
        alert("Virtueller Rundgang ist auf diesem Gerät nicht möglich.");
    });

