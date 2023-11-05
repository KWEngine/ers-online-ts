import './style.css';
import GameScene from './scene/GameScene';
import HelperControls from './helpers/HelperControls';
import HelperGeneral from './helpers/HelperGeneral';

function onWindowResize()
{
    GameScene.instance.updateViewport();
}

function onMouseMove(e:any)
{
    if(!HelperGeneral.isMobileDevice())
    {
        if(HelperControls._pointerLocked)
        {
            GameScene.instance.addCameraRotation(
                (e.movementY || 0) / 20.0,
                (e.movementX || 0) / 20.0
            );
        }
    }
}



function onKeyDown(e:any)
{
    let inputDown:string = String(e.key).toLowerCase();
    HelperControls._keys.set(inputDown, true);
}

function onKeyUp(e:any)
{
    let inputUp:string = String(e.key).toLowerCase();
    HelperControls._keys.set(inputUp, false);
}

function lockChange()
{
    if(document.pointerLockElement === GameScene.instance.getRenderDomElement())
    {
        GameScene.instance.makeSceneActive();
    } 
    else 
    {
        GameScene.instance.showStartInfo();
    }
}

function pointerLock(e:any)
{
    GameScene.instance.getRenderDomElement().requestPointerLock = 
        GameScene.instance.getRenderDomElement().requestPointerLock;
    GameScene.instance.getRenderDomElement().requestPointerLock();

    HelperControls._pointerLocked = true;
    e.preventDefault();
}

if(HelperGeneral.isMobileDevice())
{
    console.log("todo...");
}
else
{
    document.body.addEventListener('mousemove', onMouseMove);
    document.body.addEventListener('keydown', onKeyDown);
    document.body.addEventListener('keyup', onKeyUp);
    document.getElementById('pointerlock')!.addEventListener('click', pointerLock);

    if ("onpointerlockchange" in document)
    {
        document.addEventListener('pointerlockchange', lockChange, false);
    } 
}

window.addEventListener('resize', onWindowResize, false );
window.addEventListener('orientationchange', onWindowResize, false);

// Finde anhand der URL heraus, welche Szene angezeigt werden soll
// und lade die entsprechende Szene:
GameScene.instance.load("school_outside_front")
    .then(result => {
        GameScene.instance.render();
    })
    .catch(err =>
    {
        alert("Virtueller Rundgang ist auf diesem Gerät nicht möglich.");
    });

