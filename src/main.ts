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
        document.getElementById("loadingscreen")!.remove();
        GameScene.instance.showStartInfo();
        GameScene.instance.render();
    })
    .catch(err =>
    {
        console.log(err);
        alert("Virtueller Rundgang ist auf diesem Gerät nicht möglich.");
    });

