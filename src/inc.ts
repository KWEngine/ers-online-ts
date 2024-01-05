import GameScene from './scene/GameScene';
import HelperControls from './helpers/HelperControls';
import HelperGeneral from './helpers/HelperGeneral';
import ERSDoorLib from './game/ERSDoorLib';

async function getData(url = '', data = {}) {
     
    const response:any = await fetch(url, {
      method: 'GET', // *GET, POST, PUT, DELETE, etc.
      mode: 'cors', // no-cors, *cors, same-origin
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      credentials: 'same-origin', // include, *same-origin, omit
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: 'follow', // manual, *follow, error
      referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body: null // body data type must match "Content-Type" header
    }).catch(error => console.log(error));
    return response.text();
  }

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
        GameScene.instance.closeInfoInfo();
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
    e.preventDefault();
}

function onTouchDivLeftStart(e:any)
{
    for(let i:number = 0; i < e.changedTouches.length; i++)
    {
        if(e.target.id == "navigation-mobile-left" && HelperControls._camMoveStrafeId < 0)
        {
            let rect = e.target.getBoundingClientRect();
            let x:number = HelperGeneral.clamp((e.changedTouches[i].clientX - rect.left) / rect.width - 0.5, -0.75, 0.75); 
            let y:number = HelperGeneral.clamp((e.changedTouches[i].clientY - rect.top) / rect.height - 0.5, -0.75, 0.75);

            HelperControls._motionMove[0] = -y;
            HelperControls._motionMove[1] = x;

            HelperControls._camMoveStrafeId = e.changedTouches[i].identifier;
            break;
        }
    }
    e.preventDefault();
}
function onTouchDivLeft(e:any)
{
    for(let i:number = 0; i < e.changedTouches.length; i++)
    {
        if(e.target.id == "navigation-mobile-left" && e.changedTouches[i].identifier == HelperControls._camMoveStrafeId)
        {
            let rect:any = e.target.getBoundingClientRect();
            let x:number = HelperGeneral.clamp((e.changedTouches[i].clientX - rect.left) / rect.width - 0.5, -0.75, 0.75); 
            let y:number = HelperGeneral.clamp((e.changedTouches[i].clientY - rect.top) / rect.height - 0.5, -0.75, 0.75);

            HelperControls._motionMove[0] = -y;
            HelperControls._motionMove[1] = x;
            break;
        }
    }
    e.preventDefault();
}
function onTouchDivLeftReset(e:any)
{
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

function onSelectionChanged(e:any)
{
    alert("[inc.ts] onSelectionChanged");
    //GameScene.instance.spawnLocationSpotForRoom("A102");
}


function getSceneFromLocation(loc:Location):string
{
    if(loc.pathname == "/")
    {
        return 'school_outside_front';
    }
    else if(loc.pathname == "/c-block/" || loc.pathname == "/c-block")
    {
        return 'school_c-block';
    }
    else if(loc.pathname == "/c-block/1/" || loc.pathname == "/c-block/1")
    {
        return 'school_c-block_1'; 
    }
    else if(loc.pathname == "/b-block/" || loc.pathname == "/b-block")
    {
        return 'school_b-block';
    }
    else if(loc.pathname == "/forum/" || loc.pathname == "/forum")
    {
        return 'school_forum';
    }

    // Standard-Fallback-Location:
    return 'school_outside_front';
}

async function populateRoomListForBlock(e:any)
{
    GameScene.instance.spawnLocationSpotForRoom(null, null); // entferne aktuelles Navi-Ziel
    let bs:HTMLSelectElement|null = document.getElementById('blocksearch') as HTMLSelectElement;
    let block:string|null = null;
    if(bs != null)
    {
        let selectNumber:HTMLSelectElement = document.getElementById('roomsearch') as HTMLSelectElement;
        selectNumber.selectedIndex = -1;
        while(selectNumber.options.length > 0)
        {
            selectNumber.removeChild(selectNumber[selectNumber.options.length - 1]);
        }

        block = bs.options[bs.selectedIndex].value;
        if(block == "A" || block == "B" || block == "C")
        {
            selectNumber.disabled = false;
            let list:any[] = await getRoomListForBlock(block);

            let option:HTMLElement = document.createElement('option');
            option.setAttribute('value', "");
            option.innerText = "";
            selectNumber.appendChild(option);

            for(let i:number = 0; i < list.length; i++)
            {
                let option:HTMLElement = document.createElement('option');
                option.setAttribute('value', block + list[i].name + ";" + list[i].coords[0] + ";" + list[i].coords[1] + ";" + list[i].coords[2]);
                option.innerText = list[i].name;
                selectNumber.appendChild(option);

            }
            if(e === true && selectNumber)
            {
                const searchParams:URLSearchParams = new URLSearchParams(window.location.search);
                let target:string|null = searchParams.get('target');
                if(target != null && target.length > 0)
                {
                    for(let i:number = 0; i < selectNumber.options.length; i++)
                    {
                        if(selectNumber.options[i].value.startsWith(target))
                        {
                            selectNumber.selectedIndex = i;
                            selectNumber.dispatchEvent(new Event('change'));
                            break;
                        }
                    }
                }
                
            }
        }
        else
        {
            selectNumber.disabled = true;
        }
    }
}

async function getRoomListForBlock(block:string):Promise<any[]>
{
    let doors:any = await getData('/doors/doors.json');
    let doorlib:ERSDoorLib = JSON.parse(doors);
    if(block == "A")
    {
        return doorlib.a;
    }
    else if(block == "B")
    {
        return doorlib.b;
    }
    else if(block == "C")
    {
        return doorlib.c;
    }
    return [];  
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

// Schriftgroesse auf mobilen Endgeraeten verkleinern:
if(HelperGeneral.isMobileDevice())
{
    document.documentElement.style.fontSize = "80%";
}

export {getSceneFromLocation, getData, populateRoomListForBlock};