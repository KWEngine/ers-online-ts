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
        if(HelperControls.isPointerLocked())
        {
            HelperControls.addCameraRotation(
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
        if(HelperGeneral.isInfoScreenActive())
        {
            //console.log("info active");
        }
        else if(HelperGeneral.isPortalScreenActive())
        {
            //console.log("portal active");
        }
        else
        {
            //console.log("showStartInfo()");
            GameScene.instance.showStartInfo();
        }
    }
}

function pointerLock(e:any)
{
    GameScene.instance.getRenderDomElement().requestPointerLock = 
        GameScene.instance.getRenderDomElement().requestPointerLock;// || GameScene.instance.getRenderDomElement().mozRequestPointerLock;
    GameScene.instance.getRenderDomElement().requestPointerLock();
    e.preventDefault();
}

function closeInfoScreen(e:any)
{
    if(HelperGeneral.isInfoScreenActive())
    {
        //console.log("info active");
    }
    else if(HelperGeneral.isPortalScreenActive())
    {
        GameScene.instance.closePortalInfo();
    }
    else
    {
        //console.log("showStartInfo()");
        //GameScene.instance.showStartInfo();
    }
    
}

function onTouchDivLeftStart(e:any)
{
    /*if(!checkForInfoOverlay())
    {
        e.preventDefault();
        return;
    }*/

    for(let i:number = 0; i < e.changedTouches.length; i++)
    {
        if(e.target.id == "navigation-mobile-left" && HelperControls._camMoveStrafeId < 0)
        {
            let rect = e.target.getBoundingClientRect();
            let x:number = (e.changedTouches[i].clientX - rect.left) / rect.width - 0.5; 
            let y:number = (e.changedTouches[i].clientY - rect.top) / rect.height - 0.5;

            HelperControls._motionMove[0] = -y * 1.33;
            HelperControls._motionMove[1] = x * 1.33;

            HelperControls._camMoveStrafeId = e.changedTouches[i].identifier;
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

            HelperControls._motionMove[0] = -y * 1.33;
            HelperControls._motionMove[1] = x * 1.33;
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
            HelperControls.addCameraRotationMobile(y, x);
            HelperControls._camPitchYawId = e.changedTouches[i].identifier;
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
            HelperControls.addCameraRotationMobile(y, x);
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
            HelperControls._motionRotation[0] = 0;
            HelperControls._motionRotation[1] = 0;
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
    document.getElementById("navigation-mobile-right")!.addEventListener('touchend', onTouchDivRightReset);

    document.getElementById("navigation-mobile-left")!.addEventListener('touchcancel', onTouchDivLeftReset);
    document.getElementById("navigation-mobile-right")!.addEventListener('touchcancel', onTouchDivRightReset);

    /*
    document.getElementById("nav-container")!.classList.add('mobiletext');
    document.getElementById("overlay-info")!.classList.add('mobileheight2');
    document.getElementById("overlay-info-content")!.classList.add('mobile');
    document.getElementById("overlay-info-close")!.classList.add('mobileheight');
    */

    document.getElementById("pointerlock")!.style.display = "none";
    document.getElementById("pointerlock-msg")!.style.display = "none";
    document.getElementById("pointerlock-msg")!.style.opacity = "0";
}
else
{
    document.body.addEventListener('mousemove', onMouseMove);
    document.body.addEventListener('keydown', onKeyDown);
    document.body.addEventListener('keyup', onKeyUp);
    document.getElementById('pointerlock-msg')!.addEventListener('click', pointerLock);
    
    if ("onpointerlockchange" in document)
    {
        document.addEventListener('pointerlockchange', lockChange, false);
    } 
}

window.addEventListener('resize', onWindowResize, false );
window.addEventListener('orientationchange', onWindowResize, false);
document.addEventListener('focusin', onFocusGained); //?
document.addEventListener('focusout', onFocusLost);  //?
document.getElementById('infoscreen-close')!.addEventListener('click', closeInfoScreen);

export {getSceneFromLocation};