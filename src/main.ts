import './style.css';
import GameScene from './scene/GameScene';

await GameScene.instance.load("simple_gltftest");

function onWindowResize()
{
    GameScene.instance.updateViewport();
}

window.addEventListener( 'resize', onWindowResize, false );
window.addEventListener( 'orientationchange', onWindowResize, false);


GameScene.instance.render();
