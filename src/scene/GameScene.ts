import { AmbientLight, PerspectiveCamera, Scene, WebGLRenderer, Vector3, Clock, Group, SphereGeometry, TextureLoader, SRGBColorSpace, MeshBasicMaterial, Mesh, DirectionalLight, Object3D, WebGLRenderTarget, ColorManagement, ACESFilmicToneMapping, HalfFloatType, RGBAFormat, Vector2 } from "three";
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
import CameraState from "../game/CameraState";
import { getData } from "../inc";
import { EffectComposer, RenderPass, UnrealBloomPass } from "three/examples/jsm/Addons.js";

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
    private _frameCounter:number;
    private _width:number;
    private _height:number;
    private _renderer:WebGLRenderer;
    private _renderTarget:WebGLRenderTarget;
    private _renderComposer:EffectComposer;
    private _camera:PerspectiveCamera;
    private _cameraStateCurrent:CameraState;
    private _cameraStatePrevious:CameraState;
    private _cameraStateRender:CameraState;
    private _player:ERSPlayer|null;
    private _background:Mesh;
    private _textureLoader:TextureLoader;
    private _broadphaseAxisIndex:number = 0;
    private _dtAccumulator:number;
    private _camLookAtVector:Vector3;
    private _camLookAtVectorXZ:Vector3;
    private _debugMode:boolean;


    private constructor()
    {
        this._debugMode = false;

        this._dtAccumulator = 0;
        this._frameCounter = 0;
        this._width = window.innerWidth;
        this._height = window.innerHeight;
        this._modelDatabase = new Map();
        this._hitboxDatabase = new Map();
        this._camLookAtVector = new Vector3(0, 0, -1);
        this._camLookAtVectorXZ = new Vector3(0, 0, -1);
        this._renderer = new WebGLRenderer(
            {
                alpha:false,
                antialias:false
            }
        );
        this._renderer.outputColorSpace = SRGBColorSpace;
        this._renderer.toneMapping = ACESFilmicToneMapping;
        this._renderer.setPixelRatio(window.devicePixelRatio);
        this._renderer.setSize(this._width, this._height);

        const aspectRatio = this._width / this._height;
        this._camera = new PerspectiveCamera(45, aspectRatio, 0.1, GameScene.MAXCAMDISTANCE);

        this._renderTarget = new WebGLRenderTarget(this._width, this._height, { type: HalfFloatType, format: RGBAFormat, colorSpace: SRGBColorSpace});
        this._renderTarget.samples = 1;
        this._renderComposer = new EffectComposer(this._renderer, this._renderTarget);
        this._renderComposer.setSize(this._width, this._height);
        this._renderComposer.addPass(new RenderPass(this._scene, this._camera));
        this._renderComposer.addPass(
            new UnrealBloomPass(
                new Vector2(this._width * 0.5, this._height * 0.5), // Auflösung des Glow-Effekts
                0.50,                                   // Stärke des Glow-Effekts
                0.50,                                   // Zus. Radius des Glow-Effekts
                1.00                                    // Effekt-Schwellwert
            )
        );

        this._targetElement = document.getElementById("app")!;
        if(!this._targetElement)
        {
            throw "unable to find render target";
        }
        this._targetElement.appendChild(this._renderer.domElement);
        
        

        this._clock = new Clock();
        this._player = null;
        this._cameraStateCurrent = new CameraState(0, 0, 0);
        this._cameraStatePrevious = new CameraState(0, 0, 0);
        this._cameraStateRender = new CameraState(0, 0, 0);

        this._textureLoader = new TextureLoader();
        this._background = new Mesh();
    }

    public getRenderDomElement():HTMLElement
    {
        return this._targetElement;
    }

    public getCamera():PerspectiveCamera
    {
        return this._camera;
    }

    public getPlayer():ERSPlayer
    {
        return this._player!;
    }

    private stateBackupCamera():void
    {
        HelperGeneral.copyStatesCamera(this._cameraStateCurrent, this._cameraStatePrevious);
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

        // Addiere die neue Frame-Zeit auf den Akkumulator:
        this._dtAccumulator += frametime;

        // Solange der Akkumulator größer ist als ein Simulationsschritt, 
        // werden einzelne Simulationsschritte ausgeführt:
        while (this._dtAccumulator >= HelperGeneral.DTFrameSize)
        {
            HelperControls.updatePlayerControlsForDesktop();
            this.stateBackupCamera();
            this._cameraStateCurrent.updateRotationAccordingToInput();
            this._broadphaseAxisIndex = HelperCollision.collisionBroadphaseTest(this._hitboxes, this._broadphaseAxisIndex);
            
            // Aktualisiere alle GameObject-Instanzen via instanzeigener act()-Methode:
            for(let i:number = 0; i < this._gameObjects.length; i++)
            {
                if(this._gameObjects[i] instanceof InteractiveObject)
                {
                    this._gameObjects[i].stateBackup();
                    (this._gameObjects[i] as InteractiveObject).act();
                    this._gameObjects[i].clearCollisionCandidates();
                }
            }
            // Verringere Akkumulator um die feste Dauer des Simulationsschritts:
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
        this.updateCameraPositionAndOrientation(alpha);
    
        this.updateHeaderPositionInformation();

        // Aktualisiere Hintergrund-Meshposition:
        this._background.position.set(this._player!.get3DObject().position.x, 0, this._player!.get3DObject().position.z);

        this._frameCounter++;
        requestAnimationFrame(this.render);
        this._renderComposer.render();
    }

    private updateHeaderPositionInformation():void
    {
        let x:string = (Math.round(this._player!.getPositionInstance().x * 10) * 0.1 >= 0 ? "+" : "") + (Math.round(this._player!.getPositionInstance().x * 100) / 100).toFixed(1);
        let y:string = (Math.round(this._player!.getPositionInstance().y * 10) * 0.1 >= 0 ? "+" : "") + (Math.round(this._player!.getPositionInstance().y * 100) / 100).toFixed(1);
        let z:string = (Math.round(this._player!.getPositionInstance().z * 10) * 0.1 >= 0 ? "+" : "") + (Math.round(this._player!.getPositionInstance().z * 100) / 100).toFixed(1);
        document.getElementById("data-position-x")!.innerText = x;
        document.getElementById("data-position-y")!.innerText = y;
        document.getElementById("data-position-z")!.innerText = z;
    }

    private updateCameraPositionAndOrientation(alpha:number):void
    {
        HelperGeneral.blendStatesCamera(this._cameraStatePrevious, this._cameraStateCurrent, alpha, this._cameraStateRender);

        this._camera.position.set(
            this._player!.get3DObject().position.x,
            this._player!.get3DObject().position.y + this._player!.getYOffset(),
            this._player!.get3DObject().position.z
        );

        this._camera.quaternion.setFromEuler(this._cameraStateRender._euler);
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

        if(HelperGeneral.isMobileDevice())
        {
            HelperGeneral.setMobileControlsVisible(true);
        }
        else
        {
            this.showStartInfo();
        }

    }

    private init(inits:ERSSceneInits):void
    {
        const ambientlight = new AmbientLight(parseInt(inits.ambientLight));
        this._scene.add(ambientlight);
        this.setBackgroundImage(inits.background_image);

        // Füge Lichtquellen hinzu:
        for(let i:number = 0; i < inits.staticLight.length; i++)
        {
            if(inits.staticLight[i].type == "sun")
            {
                let l:DirectionalLight = new DirectionalLight(
                    HelperGeneral.hexToIntColor(inits.staticLight[i].color[0]),
                    inits.staticLight[i].color[1]);
                l.position.set(inits.staticLight[i].position[0], inits.staticLight[i].position[1], inits.staticLight[i].position[2]);
                let dummyTarget:Object3D = new Object3D();
                dummyTarget.position.set(inits.staticLight[i].target[0], inits.staticLight[i].target[1], inits.staticLight[i].target[2]);
                this._scene.add(l);

            }
        }
        
        for(let i:number = 0; i < inits.hitboxes.length; i++)
        {
            let model:Group = this._modelDatabase.get(inits.hitboxes[i].model)!;
            let o:ERSHitboxStatic = new ERSHitboxStatic(model, inits.hitboxes[i].name, inits.hitboxes[i].model);
            this.addObject(o);
        }

        for(let i:number = 0; i < inits.renderObjects.length; i++)
        {
            let model:Group = this._modelDatabase.get(inits.renderObjects[i].model)!;
            let ro:ERSRenderObject = new ERSRenderObject(model, inits.renderObjects[i].name, inits.renderObjects[i].model);
            this.addObject(ro);
        }

        for(let i: number = 0; i < inits.portals.length; i++)
        {
            let model:Group = this._modelDatabase.get(inits.portals[i].model)!;
            let portal:ERSPortal = new ERSPortal(model, inits.portals[i].name, inits.portals[i].model);
            portal.setPosition(inits.portals[i].position[0], inits.portals[i].position[1], inits.portals[i].position[2]);
            portal.setPivot(inits.portals[i].position[0], inits.portals[i].position[1], inits.portals[i].position[2]);
            portal.setRotation(inits.portals[i].rotation[0], inits.portals[i].rotation[1], inits.portals[i].rotation[2]);
            portal.setScale(inits.portals[i].scale[0], inits.portals[i].scale[1], inits.portals[i].scale[2]);
            portal.setTarget(inits.portals[i].target);
            portal.setInnerHTMLSource(inits.portals[i].innerHTMLSource);
            this.addObject(portal);
        }

        for(let i: number = 0; i < inits.infospots.length; i++)
        {
            let model:Group = this._modelDatabase.get(inits.infospots[i].model)!;
            let infospot:ERSInfoSpot = new ERSInfoSpot(model, inits.infospots[i].name, inits.infospots[i].model);
            infospot.setPosition(inits.infospots[i].position[0], inits.infospots[i].position[1], inits.infospots[i].position[2]);
            infospot.setPivot(inits.infospots[i].position[0], inits.infospots[i].position[1], inits.infospots[i].position[2]);
            infospot.setRotation(inits.infospots[i].rotation[0], inits.infospots[i].rotation[1], inits.infospots[i].rotation[2]);
            infospot.setScale(inits.infospots[i].scale[0], inits.infospots[i].scale[1], inits.infospots[i].scale[2]);
            infospot.setInnerHTMLSource(inits.infospots[i].innerHTMLSource);
            this.addObject(infospot);
        }

        this.generatePlayer(inits);
    }

    private async loadStaticModels()
    {
        // Lade 3D-Modell für Info-Spots:
        let infoModel = await ModelLoader.instance.loadAsync("/models/ers-info.glb");
        let infoHitbox:Hitbox[] = [];
        HelperGeneral.disableInvisibleMeshes(infoModel.scene);
        //HelperGeneral.addGlowToObject(infoModel.scene, 5);
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
        HelperGeneral.addGlowToObject(portalModel.scene, 5);
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
        this.setPlayerInitialLookAtRotation(inits.player.lookAt);
        this.addObject(this._player);
    }

    public restartWithDefaultPlayerPosition():void
    {
        window.location.href = window.location.pathname;
    }

    private setPlayerInitialLookAtRotation(deg:number):void
    {
        // Vorher: Prüfe auf Get-Parameter
        const searchParams:URLSearchParams = new URLSearchParams(window.location.search);
        if(searchParams.has('x') && searchParams.has('y') && searchParams.has('z'))
        {
            let x:number = parseFloat(searchParams.get('x')!);
            let y:number = parseFloat(searchParams.get('y')!);
            let z:number = parseFloat(searchParams.get('z')!);
            this._player!.setPosition(x, y, z);
        }
        if(searchParams.has('r'))
        {
            deg = parseInt(searchParams.get('r')!);
        }

        if(HelperGeneral.isMobileDevice())
        {
            this._cameraStateCurrent._euler.y = HelperGeneral.deg2rad(-deg);
        }
        else
        {
            this._cameraStateCurrent._eulerInitial.set(0, HelperGeneral.deg2rad(-deg), 0);
        }
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
            (o as ERSHitboxStatic).updateFaces();
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

    public isOverlayVisible():boolean
    {
        return document.getElementById("pointerlock")!.style.display == "flex";
    }

    private setOverlayVisible(visible:boolean):void
    {
        if(visible)
        {
            document.getElementById("pointerlock")!.setAttribute("style", "-webkit-backdrop-filter: blur(0.5rem) contrast(125%) brightness(0.8);");
            document.getElementById("pointerlock")!.setAttribute("style", "backdrop-filter: blur(0.5rem) contrast(125%) brightness(0.8);");
            document.getElementById("pointerlock")!.style.opacity = "1";
            document.getElementById("pointerlock")!.style.display = "flex";
        }
        else
        {
            document.getElementById("pointerlock")!.style.opacity = "0";
            document.getElementById("pointerlock")!.style.display = "none";
        }
    }

    public showStartInfo():void
    {
        if(HelperGeneral.isMobileDevice() == false)
        {
            this.setOverlayVisible(true);   
            document.getElementById('pointerlock-msg')!.innerHTML = "<span>Betätige diese Schaltfläche, <br /> um fortzufahren!</span>";
            document.getElementById("pointerlock-msg")!.style.opacity = "1";
            document.getElementById("pointerlock-msg")!.style.display = "flex";
        }
    }

    private resetControlsForOverlay():void
    {
        if(HelperGeneral.isMobileDevice())
        {
            HelperControls._motionMove[0] = 0;
            HelperControls._motionMove[1] = 0;
            HelperControls._camPitchYawId = -1;
            HelperControls._camMoveStrafeId = -1;

        }
        else
        {
            HelperControls._motionMove[0] = 0;
            HelperControls._motionMove[1] = 0;
            HelperControls.exitPointerLockForInfoScreen();
        }
    }

    private setInfoScreenVisible(visible:boolean, html:string = ""):void
    {
        if(visible)
        {
            HelperGeneral.setMobileControlsVisible(false);
            document.getElementById("infoscreen")!.style.opacity = "1";
            document.getElementById('infoscreen')!.style.display = "flex";
            document.getElementById('infoscreen-close')!.innerText = "X";
            document.getElementById('infoscreen-inner')!.innerHTML = html;
        }
        else{
            HelperGeneral.setMobileControlsVisible(true);
            document.getElementById('infoscreen')!.style.display = "none";
            document.getElementById("infoscreen")!.style.opacity = "0";
            document.getElementById('infoscreen-inner')!.innerHTML = "";
        }
    }

    public isDebugMode():boolean
    {
        return this._debugMode;
    }

    public async showInfoInfo(innerHTMLSource:string)
    {
        let url = '/infohtml/' + innerHTMLSource;
        const html:any = await getData(url);

        HelperGeneral.setInfoSreenActive(1); // 0 = disabled, 1 = info, 2 = portal
        this.resetControlsForOverlay();
        this.setOverlayVisible(true);
        this.setInfoScreenVisible(true, html);
    }

    public closeInfoInfo():void
    {
        HelperGeneral.setInfoSreenActive(0); // 0 = disabled, 1 = info, 2 = portal
        HelperControls.enterPointerLockAfterInfoScreen();
        this.setInfoScreenVisible(false);
        this.setOverlayVisible(false);
    }

    public async showPortalInfo(innerHTMLSource:string)
    {
        let url = '/portalhtml/' + innerHTMLSource;
        const html:any = await getData(url);

        HelperGeneral.setInfoSreenActive(2); // 0 = disabled, 1 = info, 2 = portal
        this.resetControlsForOverlay();
        this.setOverlayVisible(true);
        this.setInfoScreenVisible(true, html);
    }

    public closePortalInfo():void
    {
        HelperGeneral.setInfoSreenActive(0); // 0 = disabled, 1 = info, 2 = portal
        HelperControls.enterPointerLockAfterInfoScreen();
        this.setInfoScreenVisible(false);
        this.setOverlayVisible(false);
    }

    public makeSceneActive():void
    {
        document.getElementById("pointerlock")!.style.display = "none";
        document.getElementById("pointerlock-msg")!.style.display = "none";
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