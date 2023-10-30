import { AmbientLight, PerspectiveCamera, Scene, WebGLRenderer, Vector3, Clock, Object3D } from "three";
import ModelLoader from "./ModelLoader";
import GameObject from "./GameObject";
import InfoObject from "./InfoObject";
import HelperScene from "../globals/HelperScene";
import ERSScene from "./ERSScene";
import ERSSceneInits from "./ERSSceneInits";
import HelperGeneral from "../globals/HelperGeneral";
import RenderObject from "./RenderObject";

class GameScene
{
    private static _instance = new GameScene();
    public static get instance() 
    {
        return this._instance;
    }

    private _targetElement:HTMLElement;
    private _width:number;
    private _height:number;
    private _renderer:WebGLRenderer;
    private _camera:PerspectiveCamera;
    private readonly _scene = new Scene();
    private readonly _gameObjects:GameObject[] = [];
    private readonly _infoObjects:InfoObject[] = []; 
    private readonly _renderObjects:RenderObject[] = []; 
    private readonly _clock:Clock;
    private readonly _modelDatabase:Map<string, Object>;
    private _dtAccumulator:number;

    private constructor()
    {
        this._dtAccumulator = 0;
        this._width = window.innerWidth;
        this._height = window.innerHeight;
        this._modelDatabase = new Map();

        this._renderer = new WebGLRenderer(
            {
                alpha:true,
                antialias:true,
            }
        );
        this._renderer.setPixelRatio(window.devicePixelRatio);
        this._renderer.setSize(this._width, this._height);

        this._targetElement = document.getElementById("app")!;
        if(!this._targetElement)
        {
            throw "unable to find render target";
        }
        this._targetElement.appendChild(this._renderer.domElement);
        const aspectRatio = this._width / this._height;
        this._camera = new PerspectiveCamera(45, aspectRatio, 0.1, 1000);
        this._camera.position.set(0, 25, 100);
        this._camera.lookAt(new Vector3(0,0,0));

        this._clock = new Clock();
    }

    public updateViewport()
    {
        this._camera.aspect = window.innerWidth / window.innerHeight;
        this._camera.updateProjectionMatrix();
        this._renderer.setSize( window.innerWidth, window.innerHeight );
        this._renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
    }

    public render = () => 
    {
        let frametime:number = this._clock.getDelta(); // In Sekunden (z.B. 0.0166667s für 60fps)
        this._dtAccumulator += frametime;
        while (this._dtAccumulator >= HelperGeneral.DTFrameSize)
        {
            // todo: update objects...

            this._dtAccumulator -= HelperGeneral.DTFrameSize;
            
        }
        //todo:
        //blend objects' states based on the remaining accumulator value...
        let alpha:number = HelperGeneral.clamp(this._dtAccumulator / HelperGeneral.DTFrameSize, 0.0, 1.0);
        // ...

        requestAnimationFrame(this.render);
        this._renderer.render(this._scene, this._camera);
    }

    public load = async (sceneName:string) => 
    {
        let s:ERSScene = HelperScene.parseSceneSettings(sceneName);
        //console.log(s);

        for(let i:number = 0; i < s.loads.models.length; i++)
        {
            let model = await ModelLoader.instance.loadAsync("/public/models/" + s.loads.models[i]);
            this._modelDatabase.set(s.loads.models[i], model);
            console.log(this._modelDatabase);
        }
        this.init(s.inits);
    }

    private init = (inits:ERSSceneInits) =>
    {
        const ambientlight = new AmbientLight(parseInt(inits.ambientLight));
        this._scene.add(ambientlight);

    }
}

export default GameScene;