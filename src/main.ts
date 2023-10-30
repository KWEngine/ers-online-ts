import './style.css';
import GameScene from './scene/GameScene';

function onWindowResize()
{
    GameScene.instance.updateViewport();
}

window.addEventListener( 'resize', onWindowResize, false );
window.addEventListener( 'orientationchange', onWindowResize, false);

await GameScene.instance.load("simple_gltftest");
GameScene.instance.render();
