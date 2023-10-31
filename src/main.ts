import './style.css';
import GameScene from './scene/GameScene';

function onWindowResize()
{
    GameScene.instance.updateViewport();
}

window.addEventListener('resize', onWindowResize, false );
window.addEventListener('orientationchange', onWindowResize, false);

GameScene.instance.load("simple_gltftest")
    .then(result => {
        GameScene.instance.render();
    })
    .catch(err =>
    {
        alert("Virtueller Rundgang ist auf diesem Gerät nicht möglich.");
    });

