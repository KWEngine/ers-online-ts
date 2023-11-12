import { AmbientLight, PerspectiveCamera, Scene, WebGLRenderer, Vector3, Clock, Object3D, Group, Object3DEventMap, Euler, SphereGeometry, TextureLoader, SRGBColorSpace, MeshBasicMaterial, Mesh } from "three";
import ModelLoader from "../model/ModelLoader";
import ERSInfoSpot from "../game/ERSInfoSpot";
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
import HitboxG from "../model/HitboxG";
import ERSPortal from "../game/ERSPortal";

class GameScene
{
    private static readonly MAXCAMDISTANCE = 1000;
    private static _instance = new GameScene();
    public static get instance() 
    {
        return this._instance;
    }

    private readonly _scene = new Scene();
    private readonly _gameObjects:GameObject[] = [];
    private readonly _hitboxes:HitboxG[] = [];
    private readonly _clock:Clock;
    private readonly _modelDatabase:Map<string, Group>;
    private readonly _hitboxDatabase:Map<string, Hitbox[]>;

    private _targetElement:HTMLElement;
    private _width:number;
    private _height:number;
    private _renderer:WebGLRenderer;
    private _camera:PerspectiveCamera;
    private _cameraEuler:Euler;
    private _player:ERSPlayer|null;
    private _background:Mesh;
    private _textureLoader:TextureLoader;
    private _broadphaseAxisIndex:number = 0;
    private _dtAccumulator:number;
    private _camLookAtVector:Vector3;
    private _camLookAtVectorXZ:Vector3;
    private _cameraEulerInitial:Vector3;

    private constructor()
    {
        this._dtAccumulator = 0;
        this._width = window.innerWidth;
        this._height = window.innerHeight;
        this._modelDatabase = new Map();
        this._hitboxDatabase = new Map();
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
        this._camera = new PerspectiveCamera(45, aspectRatio, 0.1, GameScene.MAXCAMDISTANCE);

        this._clock = new Clock();
        this._player = null;
        this._cameraEuler = new Euler(0, 0, 0, 'YXZ');
        this._cameraEulerInitial = new Vector3(0,0,0);

        this._textureLoader = new TextureLoader();
        this._background = new Mesh();
    }

    public getRenderDomElement():HTMLElement
    {
        return this._targetElement;
    }

    public addCameraRotation(x:number, y:number):void
    {
        HelperControls._motionRotation[0] += -x * Math.PI / 180;
        HelperControls._motionRotation[1] += -y * Math.PI / 180;
    }
    
    public setCameraRotationMobile(x:number, y:number):void
    {
        HelperControls._motionRotation[0] = (-x * Math.PI / 180) * 2.5;
        HelperControls._motionRotation[1] = (-y * Math.PI / 180) * 2.5;
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
        if(HelperGeneral.isMobileDevice())
        {
            this._cameraEuler.x = HelperGeneral.clamp(this._cameraEuler.x + HelperControls._motionRotation[0], -1.5, 1.5);
            this._cameraEuler.y += HelperControls._motionRotation[1];
        }
        else
        {
            this._cameraEuler.x = this._cameraEulerInitial.x + HelperGeneral.clamp(HelperControls._motionRotation[0], -1.5, 1.5);
            this._cameraEuler.y = this._cameraEulerInitial.y + HelperControls._motionRotation[1];
        }
        
        this._camera.quaternion.setFromEuler(this._cameraEuler);

        let frametime:number = this._clock.getDelta(); // In Sekunden (z.B. 0.0166667s für 60fps)

        // Addiere die neue Frame-Zeit auf den Akkumulator:
        this._dtAccumulator += frametime;
        // Solange der Akkumulator größer ist als ein Simulationsschritt, 
        // werden einzelne Simulationsschritte ausgeführt:
        while (this._dtAccumulator >= HelperGeneral.DTFrameSize)
        {
            HelperControls.updatePlayerControlsForDesktop();
            this._broadphaseAxisIndex = HelperCollision.collisionBroadphaseTest(this._hitboxes, this._broadphaseAxisIndex);
            for(let i:number = 0; i < this._gameObjects.length; i++)
            {
                if(this._gameObjects[i] instanceof InteractiveObject)
                {
                    /*
                    for(let j:number = 0; j < this._gameObjects[i].getHitboxes().length; j++)
                    {
                        //console.log(this._gameObjects[i].getHitboxes()[j].getName());
                        this._gameObjects[i].getHitboxes()[j].printCollisionCandidatesNames();
                    }
                    */
                    this._gameObjects[i].stateBackup();
                    (this._gameObjects[i] as InteractiveObject).act();
                    this._gameObjects[i].clearCollisionCandidates();
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

        // Aktualisiere Hintergrund-Meshposition:
        this._background.position.set(this._player!.get3DObject().position.x, 0, this._player!.get3DObject().position.z);

        requestAnimationFrame(this.render);
        this._renderer.render(this._scene, this._camera);
    }

    public async load(sceneName:string)
    {
        // Lies die Szeneninfos aus der entsprechenden JSON-Datei ein:
        let s:ERSScene = HelperScene.parseSceneSettings(sceneName);

        // Lade die 3D-Modelle, die eh in jeder Szene vorhanden sind, vorab:
        await this.loadStaticModels();

        // Lade die 3D-Modelle die für die aktuelle Szene in der 
        // entsprechenden JSON-Datei stehen:
        for(let i:number = 0; i < s.loads.models.length; i++)
        {
            let model = await ModelLoader.instance.loadAsync("/models/" + s.loads.models[i]);
            let hitboxes:Hitbox[] = [];
            HelperCollision.generateHitboxesFor(model.scene, hitboxes);
            HelperGeneral.disableInvisibleMeshes(model.scene);
            this._modelDatabase.set(s.loads.models[i], model.scene);
            this._hitboxDatabase.set(s.loads.models[i], hitboxes);
        }

        // Initialisiere Instanzen und Lichtgebung:
        this.init(s.inits);
    }

    private initDefaultHitbox()
    {

    }

    private init(inits:ERSSceneInits):void
    {
        let pointerlockMessage:HTMLElement|null = document.getElementById("pointerlock-inner"); 
        pointerlockMessage!.innerHTML = "Drücke diese Schaltfläche<br />um fortzufahren.";

        const ambientlight = new AmbientLight(parseInt(inits.ambientLight));
        this._scene.add(ambientlight);
        this.setBackgroundImage(inits.background_image);

        this.generatePlayer(inits);

        for(let i:number = 0; i < inits.renderObjects.length; i++)
        {
            let model:Group = this._modelDatabase.get(inits.renderObjects[i].model)!;
            let ro:ERSRenderObject = new ERSRenderObject(model, inits.renderObjects[i].name, inits.renderObjects[i].model);
            this.addObject(ro);
        }

        for(let i:number = 0; i < inits.hitboxes.length; i++)
        {
            let model:Group = this._modelDatabase.get(inits.hitboxes[i].model)!;
            let o:ERSHitboxStatic = new ERSHitboxStatic(model, inits.hitboxes[i].name, inits.hitboxes[i].model);
            this.addObject(o);
        }

        for(let i: number = 0; i < inits.portals.length; i++)
        {
            let model:Group = this._modelDatabase.get(inits.portals[i].model)!;
            let portal:ERSPortal = new ERSPortal(model, inits.portals[i].name, inits.portals[i].model);
            portal.setPosition(inits.portals[i].position[0], inits.portals[i].position[1], inits.portals[i].position[2]);
            portal.setRotation(inits.portals[i].rotation[0], inits.portals[i].rotation[1], inits.portals[i].rotation[2]);
            portal.setScale(inits.portals[i].scale[0], inits.portals[i].scale[1], inits.portals[i].scale[2]);
            this.addObject(portal);
        }

        for(let i: number = 0; i < inits.infospots.length; i++)
        {
            let model:Group = this._modelDatabase.get(inits.infospots[i].model)!;
            let infospot:ERSInfoSpot = new ERSInfoSpot(model, inits.infospots[i].name, inits.infospots[i].model);
            infospot.setPosition(inits.infospots[i].position[0], inits.infospots[i].position[1], inits.infospots[i].position[2]);
            infospot.setRotation(inits.infospots[i].rotation[0], inits.infospots[i].rotation[1], inits.infospots[i].rotation[2]);
            infospot.setScale(inits.infospots[i].scale[0], inits.infospots[i].scale[1], inits.infospots[i].scale[2]);
            this.addObject(infospot);
        }
    }

    private async loadStaticModels()
    {
        // Lade 3D-Modell für Info-Spots:
        let infoModel = await ModelLoader.instance.loadAsync("/models/ers-info.glb");
        let infoHitbox:Hitbox[] = [];
        HelperGeneral.disableInvisibleMeshes(infoModel.scene);
        HelperCollision.generateHitboxesFor(infoModel.scene, infoHitbox);
        this._modelDatabase.set("ers-info.glb", infoModel.scene);
        this._hitboxDatabase.set("ers-info.glb", infoHitbox);
 
        // Lade 3D-Modell des Player-Objekts:
        let playerModel = await ModelLoader.instance.loadAsync("/models/ers-player.glb");
        let playerHitbox:Hitbox[] = [];
        HelperGeneral.disableInvisibleMeshes(playerModel.scene);
        HelperCollision.generateHitboxesFor(playerModel.scene, playerHitbox);
        this._modelDatabase.set("ers-player.glb", playerModel.scene);
        this._hitboxDatabase.set("ers-player.glb", playerHitbox);

        // Lade 3D-Modell für Portal-Spots:
        let portalModel = await ModelLoader.instance.loadAsync("/models/ers-arrow.glb");
        let portalHitbox:Hitbox[] = [];
        HelperGeneral.disableInvisibleMeshes(portalModel.scene);
        HelperCollision.generateHitboxesFor(portalModel.scene, portalHitbox);
        this._modelDatabase.set("ers-arrow.glb", portalModel.scene);
        this._hitboxDatabase.set("ers-arrow.glb", portalHitbox);
    }

    private setBackgroundImage(img:string):void
    {
        const geometry = new SphereGeometry(GameScene.MAXCAMDISTANCE - 1, 40, 30);
        geometry.scale(-1, 1, 1);
        const texture = this._textureLoader.load(img);
        texture.colorSpace = SRGBColorSpace;
        const material = new MeshBasicMaterial({ map: texture });
        this._background = new Mesh(geometry, material);
        this._scene.add(this._background);
    }

    private generatePlayer(inits:ERSSceneInits):void
    {
        let scale:number[] = inits.player.scale;
        let position:number[] = inits.player.position;
        let rotation:number[] = inits.player.rotation;
        let yOffset:number = inits.player.yOffset;
        let model:Group = this._modelDatabase.get("ers-player.glb")!;
        this._player = new ERSPlayer(model, "Player", "ers-player.glb");
        this._player.setPosition(position[0], position[1], position[2]);
        this._player.addRotationY(rotation[1]);
        this._player.setScale(scale[0], scale[1], scale[2]);
        this._player.setYOffset(yOffset);
        this._camera.position.set(position[0], position[1] + yOffset, position[2]);
        this._camera.lookAt(inits.player.lookAt[0], inits.player.lookAt[1] + yOffset, inits.player.lookAt[2]);
        this._cameraEuler.set(this._camera.rotation.x, this._camera.rotation.y, this._camera.rotation.z, 'YXZ');
        this._cameraEulerInitial.set(this._camera.rotation.x, this._camera.rotation.y, this._camera.rotation.z);
        console.log(this._cameraEulerInitial);
        this.addObject(this._player);
    }

    public getHitboxesForModel(m:string):Hitbox[]
    {
        if(this._hitboxDatabase.has(m))
        {
            return this._hitboxDatabase.get(m)!;
        }
        return [];
    }

    public addObject(o : GameObject):void
    {
        if(o instanceof RenderObject)
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
        } 
        else if(o instanceof ERSInfoSpot || o instanceof ERSPortal)
        {
            this._gameObjects.push(o);
            this.addHitboxesForObject(o);
            this._scene.add(o.get3DObject());
        }
    }

    public removeObject(o: GameObject):void
    {
        
        if(o instanceof ERSInfoSpot || o instanceof ERSPortal)
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
        
        if(o instanceof RenderObject) 
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
                const predicate = (element:HitboxG) => element.getId() == o.getHitboxes()[hbIndex].getId();
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
        document.getElementById("pointerlock")!.style.display = "flex";
    }

    public makeSceneActive():void
    {
        this._targetElement.style.cursor = 'none';
        HelperControls._pointerLocked = true;
        
        document.getElementById("pointerlock")!.style.display = "none";
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