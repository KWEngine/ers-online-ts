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

function onFocusGained(e:any)
{
    HelperControls._hasFocus = true;
    GameScene.instance.render;
}

function onFocusLost(e:any)
{
    HelperControls._hasFocus = false;
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

function onTouchDivLeftStart(e:any)
{
    /*if(!checkForInfoOverlay())
    {
        e.preventDefault();
        return;
    }*/
        

    for(let i = 0; i < e.changedTouches.length; i++)
    {
        if(e.target.id == "navigation-mobile-left" && HelperControls._camMoveStrafeId < 0)
        {
            var rect = e.target.getBoundingClientRect();
            var x = (e.changedTouches[i].clientX - rect.left) / rect.width - 0.5; 
            var y = (e.changedTouches[i].clientY - rect.top) / rect.height - 0.5;

            HelperControls._motionMove[0] = y > 0.5 ? -0.5 : y < -0.5 ? 0.5 : -y;
            HelperControls._motionMove[1] = x;

            HelperControls._camMoveStrafeId = e.changedTouches[i].identifier;
            break;
        }
    }
    e.preventDefault();
}

function onTouchDivRightStart(e:any)
{
    /*
    if(!checkForInfoOverlay())
    {
        e.preventDefault();
        return;
    }
    */

    for(let i = 0; i < e.changedTouches.length; i++)
    {
        if(e.target.id == "navigation-mobile-right" && HelperControls._camPitchYawId < 0)
        {
            let rect = e.target.getBoundingClientRect();
            let x = (e.changedTouches[i].clientX - rect.left) / rect.width - 0.5; 
            let y = (e.changedTouches[i].clientY - rect.top) / rect.height - 0.5;

            HelperControls._motionRotation[0] = x;
            HelperControls._motionRotation[1] = y > 0.5 ? 0.5 : y < -0.5 ? -0.5 : y;
            HelperControls._camPitchYawId = e.changedTouches[i].identifier;
            break;
        }

    }
    e.preventDefault();
}

function onTouchDivLeftReset(e:any)
{
    /*
    if(!checkForInfoOverlay())
    {
        e.preventDefault();
        return;
    }
    */

    for(let i = 0; i < e.changedTouches.length; i++)
    {
        if(e.target.id == "navigation-mobile-left")
        {
            HelperControls._camMoveStrafeId = -1;
            HelperControls._motionMove[0]  = 0;
            HelperControls._motionMove[1]  = 0;
            break;
        }
    }
    e.preventDefault();
}

function onTouchDivRightReset(e:any)
{
    /*
    if(!checkForInfoOverlay())
    {
        e.preventDefault();
        return;
    }
    */

    for(let i = 0; i < e.changedTouches.length; i++)
    {
        if(e.target.id == "navigation-mobile-right")
        {
            HelperControls._camPitchYawId = -1;
            HelperControls._motionRotation[0]  = 0;
            HelperControls._motionRotation[1] = 0;
            break;
        }
    }
    e.preventDefault();
}

function onTouchDivLeft(e:any)
{
    /*
    if(!checkForInfoOverlay())
    {
        e.preventDefault();
        return;
    }
    */

    for(var i = 0; i < e.changedTouches.length; i++)
    {
        if(e.target.id == "navigation-mobile-left" && e.changedTouches[i].identifier == HelperControls._camMoveStrafeId)
        {
            var rect = e.target.getBoundingClientRect();
            var x = (e.changedTouches[i].clientX - rect.left) / rect.width - 0.5; 
            var y = (e.changedTouches[i].clientY - rect.top) / rect.height - 0.5;

            HelperControls._motionMove[0] = y > 0.5 ? -0.5 : y < -0.5 ? 0.5 : -y;
            HelperControls._motionMove[1] = x;
            break;
        }
    }
    e.preventDefault();
}

function onTouchDivRight(e:any)
{
    /*
    if(!checkForInfoOverlay())
    {
        e.preventDefault();
        return;
    }
    */

    for(var i = 0; i < e.changedTouches.length; i++)
    {
        if(e.target.id == "navigation-mobile-right" && e.changedTouches[i].identifier == HelperControls._camPitchYawId)
        {
            var rect = e.target.getBoundingClientRect();
            var x = (e.changedTouches[i].clientX - rect.left) / rect.width - 0.5; 
            var y = (e.changedTouches[i].clientY - rect.top) / rect.height - 0.5;

            HelperControls._motionRotation[0]  = x;
            HelperControls._motionRotation[1]  = y > 0.5 ? 0.5 : y < -0.5 ? -0.5 : y;
            break;
        }

    }
    e.preventDefault();
}

// ============= BEGINNE PROGRAMM ============== //

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
window.addEventListener('focus', onFocusGained);
window.addEventListener('focus', onFocusLost);

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

