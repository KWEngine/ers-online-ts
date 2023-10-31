import { AmbientLight, PerspectiveCamera, Scene, WebGLRenderer, Vector3, Clock, Object3D, Group, Object3DEventMap } from "three";
import ModelLoader from "../model/ModelLoader";
import InfoObject from "../game/InfoObject";
import HelperScene from "../helpers/HelperScene";
import ERSScene from "./ERSScene";
import ERSSceneInits from "./ERSSceneInits";
import HelperGeneral from "../helpers/HelperGeneral";
import RenderObject from "../game/RenderObject";
import InteractiveObject from "../game/InteractiveObject";
import ERSPlayer from "../game/ERSPlayer";
import HelperCollision from "../helpers/HelperCollision";
import Hitbox from "../model/Hitbox";

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
    private readonly _movingObjects:InteractiveObject[] = [];
    private readonly _infoObjects:InfoObject[] = []; 
    private readonly _renderObjects:RenderObject[] = []; 
    private readonly _clock:Clock;
    private readonly _modelDatabase:Map<string, Group>;
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
        this._camera.position.set(0, 5, 25);
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
            for(let i:number = 0; i < this._movingObjects.length; i++)
            {
                this._movingObjects[i].stateBackup();
                this._movingObjects[i].act();
            }
            this._dtAccumulator -= HelperGeneral.DTFrameSize;
        }
        //todo:
        //blend objects' states based on the remaining accumulator value...
        let alpha:number = HelperGeneral.clamp(this._dtAccumulator / HelperGeneral.DTFrameSize, 0.0, 1.0);
        for(let i:number = 0; i < this._movingObjects.length; i++)
        {
            this._movingObjects[i].stateBlendToRender(alpha);
        }

        requestAnimationFrame(this.render);
        this._renderer.render(this._scene, this._camera);
    }

    public async load(sceneName:string)
    {
        let s:ERSScene = HelperScene.parseSceneSettings(sceneName);

        for(let i:number = 0; i < s.loads.models.length; i++)
        {
            let model = await ModelLoader.instance.loadAsync("/models/" + s.loads.models[i]);
            let hitboxes:Hitbox[] = [];
            HelperCollision.generateHitboxesFor(model.scene, hitboxes);
            model.scene.userData = { "hitboxes": hitboxes };
            console.log(model.scene);
            this._modelDatabase.set(s.loads.models[i], model.scene);
        }
        this.init(s.inits);
    }

    private init(inits:ERSSceneInits):void
    {
        const ambientlight = new AmbientLight(parseInt(inits.ambientLight));
        this._scene.add(ambientlight);

        for(let i:number = 0; i < inits.renderObjects.length; i++)
        {
            let model:Group = this._modelDatabase.get(inits.renderObjects[i].model)!;
            let player:ERSPlayer = new ERSPlayer(model, inits.renderObjects[i].name);
            this.addObject(player);
        }
    }

    private addObject(o : InteractiveObject):void
    {
        this._movingObjects.push(o);
        this._scene.add(o.get3DObject());
    }
}

export default GameScene;