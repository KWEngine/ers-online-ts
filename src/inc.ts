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
        GameScene.instance.getRenderDomElement().requestPointerLock;// || GameScene.instance.getRenderDomElement().mozRequestPointerLock;
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
    alert("!");        

    for(let i:number = 0; i < e.changedTouches.length; i++)
    {
        if(e.target.id == "navigation-mobile-left" && HelperControls._camMoveStrafeId < 0)
        {
            let rect = e.target.getBoundingClientRect();
            let x:number = (e.changedTouches[i].clientX - rect.left) / rect.width - 0.5; 
            let y:number = (e.changedTouches[i].clientY - rect.top) / rect.height - 0.5;

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

    for(let i:number = 0; i < e.changedTouches.length; i++)
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

    for(let i:number = 0; i < e.changedTouches.length; i++)
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

    for(let i:number = 0; i < e.changedTouches.length; i++)
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

    for(let i:number = 0; i < e.changedTouches.length; i++)
    {
        if(e.target.id == "navigation-mobile-left" && e.changedTouches[i].identifier == HelperControls._camMoveStrafeId)
        {
            let rect:any = e.target.getBoundingClientRect();
            let x:number = (e.changedTouches[i].clientX - rect.left) / rect.width - 0.5; 
            let y:number = (e.changedTouches[i].clientY - rect.top) / rect.height - 0.5;

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

    for(let i:number = 0; i < e.changedTouches.length; i++)
    {
        if(e.target.id == "navigation-mobile-right" && e.changedTouches[i].identifier == HelperControls._camPitchYawId)
        {
            let rect:any = e.target.getBoundingClientRect();
            let x:number = (e.changedTouches[i].clientX - rect.left) / rect.width - 0.5; 
            let y:number = (e.changedTouches[i].clientY - rect.top) / rect.height - 0.5;

            HelperControls._motionRotation[0]  = x;
            HelperControls._motionRotation[1]  = y > 0.5 ? 0.5 : y < -0.5 ? -0.5 : y;
            break;
        }

    }
    e.preventDefault();
}

function getSceneFromLocation(loc:Location):string
{
    if(loc.pathname == "/")
    {
        return 'school_outside_front';
    }
    else if(loc.pathname == "/c-block/")
    {
        return 'school_outside_front'; // Noch im Test :-)
    }

    // Standard-Fallback-Location:
    return 'school_outside_front';
}

// ============= BEGINNE PROGRAMM ============== //

if(HelperGeneral.isMobileDevice())
{
    document.getElementById("navigation-mobile")!.style.opacity = "1";

    document.getElementById("navigation-mobile-left")!.addEventListener('touchstart', onTouchDivLeftStart);
    document.getElementById("navigation-mobile-right")!.addEventListener('touchstart', onTouchDivRightStart);

    document.getElementById("navigation-mobile-left")!.addEventListener('touchmove', onTouchDivLeft);
    document.getElementById("navigation-mobile-right")!.addEventListener('touchmove', onTouchDivRight);

    document.getElementById("navigation-mobile-left")!.addEventListener('touchend', onTouchDivLeftReset);
    document.getElementById("navigation-mobile-right")!.addEventListener('touchend', onTouchDivLeftReset);

    document.getElementById("navigation-mobile-left")!.addEventListener('touchcancel', onTouchDivLeftReset);
    document.getElementById("navigation-mobile-right")!.addEventListener('touchcancel', onTouchDivLeftReset);

    /*
    document.getElementById("nav-container")!.classList.add('mobiletext');
    document.getElementById("overlay-info")!.classList.add('mobileheight2');
    document.getElementById("overlay-info-content")!.classList.add('mobile');
    document.getElementById("overlay-info-close")!.classList.add('mobileheight');
    */

    document.getElementById("pointerlock")!.style.display = "none";
    document.getElementById("pointerlock-inner")!.style.display = "none";
    
    document.getElementById('navigation-mobile')!.style.display = "flex";
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
document.addEventListener('focusin', onFocusGained); //?
document.addEventListener('focusout', onFocusLost);  //?

export {getSceneFromLocation};