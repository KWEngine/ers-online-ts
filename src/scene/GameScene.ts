import { AmbientLight, PerspectiveCamera, Scene, WebGLRenderer, Vector3, Clock, Object3D, Group, Object3DEventMap, Euler } from "three";
import ModelLoader from "../model/ModelLoader";
import InfoObject from "../game/InfoObject";
import HelperScene from "../helpers/HelperScene";
import ERSScene from "./ERSScene";
import ERSSceneInits from "./ERSSceneInits";
import HelperGeneral from "../helpers/HelperGeneral";
import InteractiveObject from "../game/InteractiveObject";
import ERSPlayer from "../game/ERSPlayer";
import HelperCollision from "../helpers/HelperCollision";
import Hitbox from "../model/Hitbox";
import GameObject from "../game/GameObject";
import ERSHitboxStatic from "../game/ERSHitboxStatic";
import RenderObject from "../game/RenderObject";
import ERSRenderObject from "../game/ERSRenderObject";
import HelperControls from "../helpers/HelperControls";

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
    private _cameraEuler:Euler;
    private _player:ERSPlayer|null;
    private readonly _scene = new Scene();
    private readonly _gameObjects:GameObject[] = [];
    private readonly _infoObjects:InfoObject[] = []; 
    private readonly _hitboxes:Hitbox[] = [];
    private readonly _clock:Clock;
    private readonly _modelDatabase:Map<string, Group>;
    private _dtAccumulator:number;
    private _camLookAtVector:Vector3;
    private _camLookAtVectorXZ:Vector3;

    private constructor()
    {
        this._dtAccumulator = 0;
        this._width = window.innerWidth;
        this._height = window.innerHeight;
        this._modelDatabase = new Map();
        this._camLookAtVector = new Vector3(0, 0, -1);
        this._camLookAtVectorXZ = new Vector3(0, 0, -1);
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
        this._player = null;
        this._cameraEuler = new Euler(0, 0, 0, 'YXZ');
    }

    public getRenderDomElement():HTMLElement
    {
        return this._targetElement;
    }

    public addCameraRotation(x:number, y:number):void
    {
        HelperControls._motionRotation[0] += -x * Math.PI / 180;
        HelperControls._motionRotation[1] += -y * Math.PI / 180;

        if(HelperControls._motionRotation[0] > 1.5)
            HelperControls._motionRotation[0] = 1.5;
        else if(HelperControls._motionRotation[0] < -1.5)
            HelperControls._motionRotation[0] = -1.5;

        this._cameraEuler.x = HelperControls._motionRotation[0];
        this._cameraEuler.y = HelperControls._motionRotation[1];
        this._camera.quaternion.setFromEuler(this._cameraEuler);
    }
    
    public getCamera():PerspectiveCamera
    {
        return this._camera;
    }

    public getPlayer():ERSPlayer
    {
        return this._player!;
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
        if(!HelperControls._hasFocus)
            return;

        let frametime:number = this._clock.getDelta(); // In Sekunden (z.B. 0.0166667s für 60fps)

        // Addiere die neue Frame-Zeit auf den Akkumulator:
        this._dtAccumulator += frametime;

        // Solange der Akkumulator größer ist als ein Simulationsschritt, 
        // werden einzelne Simulationsschritte ausgeführt:
        while (this._dtAccumulator >= HelperGeneral.DTFrameSize)
        {
            HelperControls.updatePlayerControls();
            for(let i:number = 0; i < this._gameObjects.length; i++)
            {
                if(this._gameObjects[i] instanceof InteractiveObject)
                {
                    this._gameObjects[i].stateBackup();
                    (this._gameObjects[i] as InteractiveObject).act();
                }
            }
            this._dtAccumulator -= HelperGeneral.DTFrameSize;
        }
        
        
        // Nachdem die Simulationsschritte erledigt sind, ermittle den 
        // Überblendungsfaktor und wende ihn auf alle Objekte an:
        let alpha:number = HelperGeneral.clamp(this._dtAccumulator / HelperGeneral.DTFrameSize, 0.0, 1.0);
        for(let i:number = 0; i < this._gameObjects.length; i++)
        {
            this._gameObjects[i].stateBlendToRender(alpha);
        }

        // Aktualisiere Kameraposition:
        this._camera.position.set(
            this._player!.get3DObject().position.x,
            this._player!.get3DObject().position.y + this._player!.getYOffset(),
            this._player!.get3DObject().position.z
            );

        requestAnimationFrame(this.render);
        this._renderer.render(this._scene, this._camera);
    }

    public async load(sceneName:string)
    {
        let s:ERSScene = HelperScene.parseSceneSettings(sceneName);

        // Lade 3D-Modell des Player-Objekts:
        let playerModel = await ModelLoader.instance.loadAsync("/models/ers-player.glb");
        let playerHitbox:Hitbox[] = [];
        HelperCollision.generateHitboxesFor(playerModel.scene, playerHitbox);
        playerModel.scene.userData = { "hitboxes": playerHitbox };
        this._modelDatabase.set("ers-player.glb", playerModel.scene);

        // Lade die 3D-Modelle die für die aktuelle Szene in der 
        // entsprechenden JSON-Datei stehen:
        for(let i:number = 0; i < s.loads.models.length; i++)
        {
            let model = await ModelLoader.instance.loadAsync("/models/" + s.loads.models[i]);
            let hitboxes:Hitbox[] = [];
            HelperCollision.generateHitboxesFor(model.scene, hitboxes);
            model.scene.userData = { "hitboxes": hitboxes };
            this._modelDatabase.set(s.loads.models[i], model.scene);
        }

        // Initialisiere Instanzen und Lichtgebung:
        this.init(s.inits);
    }

    private init(inits:ERSSceneInits):void
    {
        const ambientlight = new AmbientLight(parseInt(inits.ambientLight));
        this._scene.add(ambientlight);

        this.generatePlayer(inits);

        for(let i:number = 0; i < inits.renderObjects.length; i++)
        {
            let model:Group = this._modelDatabase.get(inits.renderObjects[i].model)!;
            let ro:ERSRenderObject = new ERSRenderObject(model, inits.renderObjects[i].name);
            this.addObject(ro);
        }

        for(let i:number = 0; i < inits.hitboxes.length; i++)
        {
            let model:Group = this._modelDatabase.get(inits.hitboxes[i].model)!;
            let o:ERSHitboxStatic = new ERSHitboxStatic(model, inits.hitboxes[i].name);
            this.addObject(o);
        }
    }

    private generatePlayer(inits:ERSSceneInits):void
    {
        let scale:number[] = inits.player.scale;
        let position:number[] = inits.player.position;
        let rotation:number[] = inits.player.rotation;
        let yOffset:number = inits.player.yOffset;
        let model:Group = this._modelDatabase.get("ers-player.glb")!;
        this._player = new ERSPlayer(model, "Player");
        this._player.setPosition(position[0], position[1], position[2]);
        this._player.addRotationY(rotation[1]);
        this._player.setScale(scale[0], scale[1], scale[2]);
        this._player.setYOffset(yOffset);
        this.addObject(this._player);
    }

    public addObject(o : GameObject):void
    {
        if(o instanceof InfoObject)
        {
            this._infoObjects.push(o as InfoObject);
            this.addHitboxesForObject(o);
            this._scene.add(o.get3DObject());
        }
        else if(o instanceof RenderObject)
        {
            this._gameObjects.push(o);
            this._scene.add(o.get3DObject());
        }
        else if(o instanceof ERSHitboxStatic)
        {
            this._gameObjects.push(o);
            this.addHitboxesForObject(o);
        }
        else if(o instanceof ERSPlayer)
        {
            this._gameObjects.push(o);
            this.addHitboxesForObject(o);
            //this._scene.add(o.get3DObject());
        }
        
    }

    public removeObject(o: GameObject):void
    {
        if(o instanceof InfoObject)
        {
            const predicate = (element:InfoObject) => element.getId() == o.getId();
            let index:number = this._infoObjects.findIndex(predicate);
            if(index >= 0)
            {
                this._infoObjects.splice(index, 1);
                this.removeHitboxesForObject(o);
                this._scene.remove(o.get3DObject());
            }
        }
        else if(o instanceof RenderObject) 
        {
            const predicate = (element:GameObject) => element.getId() == o.getId();
            let index:number = this._gameObjects.findIndex(predicate);
            if(index >= 0)
            {
                this._gameObjects.splice(index, 1);
                this._scene.remove(o.get3DObject());
            }
        }
        else if(o instanceof InteractiveObject)
        {
            const predicate = (element:GameObject) => element.getId() == o.getId();
            let index:number = this._gameObjects.findIndex(predicate);
            if(index >= 0)
            {
                this._gameObjects.splice(index, 1);
                this.removeHitboxesForObject(o);
                this._scene.remove(o.get3DObject());
            }
        }
    }

    private removeHitboxesForObject(o : GameObject):void
    {
        for(let hbIndex:number = 0; hbIndex < o.getHitboxes().length; hbIndex++)
        {
            for(let i:number = 0; i < this._hitboxes.length; i++)
            {
                const predicate = (element:Hitbox) => element.getId() == o.getHitboxes()[hbIndex].getId();
                let index:number = this._hitboxes.findIndex(predicate);
                if(index >= 0)
                {
                    this._hitboxes.splice(index, 1);
                    break;
                }
            }
        }
    }

    private addHitboxesForObject(o: GameObject):void
    {
        for(let i:number = 0; i < o.getHitboxes().length; i++)
        {
            this._hitboxes.push(o.getHitboxes()[i]);
        }
    }

    public isInfoObjectActive():boolean
    {
        return false; // todo
    }

    public showStartInfo():void
    {
        HelperControls._pointerLocked = false;
        this._targetElement.style.cursor = 'default';
        document.getElementById('pointerlock-inner')!.innerHTML = "<span>Klicke mit der linken Maustaste, <br /> um deine Tour zu beginnen!</span>";
        document.getElementById("pointerlock")!.style.opacity = '1.0';
        document.getElementById('pointerlock-inner')!.style.opacity = '1.0';
    }

    public makeSceneActive():void
    {
        this._targetElement.style.cursor = 'none';
        HelperControls._pointerLocked = true;
        document.getElementById("pointerlock")!.style.opacity = '0.0';
    }

    public getCameraLookAtVector():Vector3
    {
        this._camera.getWorldDirection(this._camLookAtVector);
        return this._camLookAtVector;
    }

    public getCameraLookAtVectorXZ():Vector3
    {
        this._camera.getWorldDirection(this._camLookAtVectorXZ);
        this._camLookAtVectorXZ.y = 0;
        this._camLookAtVectorXZ.normalize();
        return this._camLookAtVectorXZ;
    }

    public getCameraLookAtStrafeVectorXZ():Vector3
    {
        return HelperGeneral.getStrafeVector(this.getCameraLookAtVector(), this._camera.up).normalize();
    }

}

export default GameScene;