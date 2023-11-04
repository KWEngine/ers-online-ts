import './style.css';
import GameScene from './scene/GameScene';
import HelperControls from './helpers/HelperControls';

function onWindowResize()
{
    GameScene.instance.updateViewport();
}

function onMouseMove(e:any)
{
    if(!isMobileDevice())
    {
        //if(GLOBAL_PointerLocked == true)
        {
            GameScene.instance.addCameraRotation(
                (e.movementY || 0) / 20.0,
                (e.movementX || 0) / 20.0
            );
        }
    }
}

function isMobileDevice():boolean
{
    return window.matchMedia("(any-pointer:coarse)").matches;
}

function onKeyDown(e:any)
{
    HelperControls._keys.set(String(e.key).toLowerCase(), true);
}

function onKeyUp(e:any)
{
    HelperControls._keys.set(String(e.key).toLowerCase(), false);
}

if(isMobileDevice())
{
    console.log("todo...");
}
else
{
    document.body.addEventListener('mousemove', onMouseMove);
    document.body.addEventListener('keydown', onKeyDown);
    document.body.addEventListener('keyup', onKeyUp);
}


window.addEventListener('resize', onWindowResize, false );
window.addEventListener('orientationchange', onWindowResize, false);

GameScene.instance.load("school_outside_front")
    .then(result => {
        GameScene.instance.render();
    })
    .catch(err =>
    {
        alert("Virtueller Rundgang ist auf diesem Gerät nicht möglich.");
    });

