import { AmbientLight, PerspectiveCamera, Scene, WebGLRenderer, Vector3, Clock, Group, SphereGeometry, TextureLoader, SRGBColorSpace, MeshBasicMaterial, Mesh, DirectionalLight, Object3D, WebGLRenderTarget, ColorManagement, ACESFilmicToneMapping, HalfFloatType, RGBAFormat, Vector2, InstancedMesh, MeshStandardMaterial } from "three";
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
import { getData, populateRoomListForBlock } from "../inc";
import { EffectComposer, RenderPass, UnrealBloomPass } from "three/examples/jsm/Addons.js";
import ERSLocationSpot from "../game/ERSLocationSpot";
import DijkstraGraph from "../game/DijkstraGraph";
import DijkstraNode from "../game/DijkstraNode";
import DijkstraSolver from "../game/DijkstraSolver";

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
    private readonly _gameObjectsNew:GameObject[] = [];
    private readonly _hitboxes:HitboxG[] = [];
    private readonly _clock:Clock;
    private readonly _modelDatabase:Map<string, Group>;
    private readonly _hitboxDatabase:Map<string, Hitbox[]>;

    private _targetElement:HTMLElement;
    private _navTarget:ERSLocationSpot|null;
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
    
    private _graph:DijkstraGraph;
    private _graphSolver:DijkstraSolver|null;
    private _graphChips:InstancedMesh[];
    private _graphChipsGroupId:number;


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
                new Vector2(                            // Auflösung des Glow-Effekts
                    256,
                    256
                    ), 
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
        this._navTarget = null;

        this._graph = new DijkstraGraph();
        this._graphChips = [];
        this._graphSolver = null;
        this._graphChipsGroupId = -1;
    }

    public getModel(name:string):Group
    {
        return this._modelDatabase.get(name)!;
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
        this._width = window.innerWidth;
        this._height = window.innerHeight;
        this._camera.aspect = window.innerWidth / window.innerHeight;
        this._camera.updateProjectionMatrix();
        this._renderer.setSize( window.innerWidth, window.innerHeight );
        this._renderComposer.setSize(window.innerWidth, window.innerHeight);
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

        this.removeObjects();
        this.addObjects();

        this.displayNavigationChips();
        this._frameCounter++;
        requestAnimationFrame(this.render);
        this._renderComposer.render();

        
    }

    private displayNavigationChips():void
    {
        let g:Object3D = this._scene.getObjectById(this._graphChipsGroupId)!;
        for(let i:number = 0; i < this._graphChips.length; i++)
        {
            (this._graphChips[i].material as MeshStandardMaterial).visible = false;
        }

        if(this._navTarget != null)
        {
            let nearestNode:DijkstraNode|null = this._graph.getNearestDijkstraNode(this._player!);
            if(nearestNode != null)
            {
                let target:DijkstraNode|null = this._graph.getNearestDijkstraNode(this._navTarget);
                if(target != null && this._graphSolver != null)
                {
                    this._graphSolver.reset();
                    let route:DijkstraNode[] = this._graphSolver.calculate(nearestNode, target);
                    if(route.length > 1)
                    {
                        for(let i:number = 0; i < route.length - 1; i++)
                        {
                            let idx = this.getChipIndexFor(route[i], route[i + 1]);
                            if(idx != undefined)
                                (this._graphChips[idx].material as MeshStandardMaterial).visible = true;
                        }
                    }
                }
            }    
        }
    }

    private getChipIndexFor(n1:DijkstraNode, n2:DijkstraNode):number
    {
        return n1.getNeighbourChipIndexInGraph(n2);
    }

    private updateHeaderPositionInformation():void
    {
        if(document.getElementById("data-position-x"))
        {
            let x:string = (Math.round(this._player!.getPositionInstance().x * 10) * 0.1 >= 0 ? "+" : "") + (Math.round(this._player!.getPositionInstance().x * 100) / 100).toFixed(1);
            let y:string = (Math.round(this._player!.getPositionInstance().y * 10) * 0.1 >= 0 ? "+" : "") + (Math.round(this._player!.getPositionInstance().y * 100) / 100).toFixed(1);
            let z:string = (Math.round(this._player!.getPositionInstance().z * 10) * 0.1 >= 0 ? "+" : "") + (Math.round(this._player!.getPositionInstance().z * 100) / 100).toFixed(1);
            document.getElementById("data-position-x")!.innerText = x;
            document.getElementById("data-position-y")!.innerText = y;
            document.getElementById("data-position-z")!.innerText = z;
        }
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

        await this.showHeader();

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
            this.addObjectInternal(o);
        }

        for(let i:number = 0; i < inits.renderObjects.length; i++)
        {
            let model:Group = this._modelDatabase.get(inits.renderObjects[i].model)!;
            let ro:ERSRenderObject = new ERSRenderObject(model, inits.renderObjects[i].name, inits.renderObjects[i].model);
            this.addObjectInternal(ro);
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
            this.addObjectInternal(portal);
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
            this.addObjectInternal(infospot);
        }

        this.generatePlayer(inits);

        this.generateDijkstraNodeGraph(inits.dijkstranodes);
    }

    private generateDijkstraNodeGraph(dijkstranodes:any[]):void
    {
        if(dijkstranodes != null)
        {
            for(let i:number = 0; i < dijkstranodes.length; i++)
            {
                let name:string = dijkstranodes[i].name;
                let location:Vector3 = new Vector3(dijkstranodes[i].location[0], dijkstranodes[i].location[1], dijkstranodes[i].location[2]);
                let dn:DijkstraNode = new DijkstraNode(name, location);
                for(let j:number = 0; j < dijkstranodes[i].neighbours.length; j++)
                {
                    dn.addNeighbourIndex(dijkstranodes[i].neighbours[j]);
                }
                this._graph.add(dn);
            }
            this._graph.setNeighboursForAllNodes();
            this._graphChips = this._graph.getChipsMeshes();
            let meshGroup:Group = new Group();
            this._graphChipsGroupId = meshGroup.id;
            for(let chip of this._graphChips)
            {
                meshGroup.add(chip);
            }
            this._scene.add(meshGroup);
            this._graphSolver = new DijkstraSolver(this._graph);
        }
        
    }

    private async loadStaticModels()
    {
        // Lade 3D-Modell für Location-Spots:
        let locationModel = await ModelLoader.instance.loadAsync("/models/ers-location.glb");
        HelperGeneral.disableInvisibleMeshes(locationModel.scene);
        this._modelDatabase.set("ers-location.glb", locationModel.scene);

        // Lade 3D-Modell für Info-Spots:
        let infoModel = await ModelLoader.instance.loadAsync("/models/ers-info.glb");
        HelperGeneral.disableInvisibleMeshes(infoModel.scene);
        this._modelDatabase.set("ers-info.glb", infoModel.scene);
 
        // Lade 3D-Modell des Player-Objekts:
        let playerModel = await ModelLoader.instance.loadAsync("/models/ers-player.glb");
        let playerHitbox:Hitbox[] = [];
        HelperGeneral.disableInvisibleMeshes(playerModel.scene);
        HelperCollision.generateHitboxesFor(playerModel.scene, playerHitbox);
        this._modelDatabase.set("ers-player.glb", playerModel.scene);
        this._hitboxDatabase.set("ers-player.glb", playerHitbox);

        // Lade 3D-Modell für Portal-Spots:
        let portalModel = await ModelLoader.instance.loadAsync("/models/ers-arrow.glb");
        HelperGeneral.disableInvisibleMeshes(portalModel.scene);
        HelperGeneral.addGlowToObject(portalModel.scene, 5);
        this._modelDatabase.set("ers-arrow.glb", portalModel.scene);

        // Lade 3D-Modell für Navi-Chips:
        let chipModel = await ModelLoader.instance.loadAsync("/models/ers-dijkstrachip.glb");
        this._modelDatabase.set("ers-dijkstrachip.glb", chipModel.scene);
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
        this.addObjectInternal(this._player);
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

    private addObjectInternal(o : GameObject):void
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
        else if(o instanceof ERSInfoSpot || o instanceof ERSPortal || o instanceof ERSLocationSpot)
        {
            this._gameObjects.push(o);
            this._scene.add(o.get3DObject());
        }
    }

    public addObjectForNextFrame(o:GameObject):void
    {
        this._gameObjectsNew.push(o);
    }

    public spawnLocationSpotForRoom(block:string|null, n:string|null):void
    {
        if(this._navTarget != null)
        {
            this._navTarget.markForRemoval();
        }

        if(block == null || block.length == 0 || n == null || n.length == 0)
        {
            this._navTarget = null;
        }
        else
        {
            let exp:string[] = n.split(";");
            let room:string = exp[0];
            if(HelperGeneral.isTargetInCurrentLocation(room))
            {
                let x:number = parseFloat(exp[1]);
                let y:number = parseFloat(exp[2]);
                let z:number = parseFloat(exp[3]);
                this._navTarget = this.spawnLocationSpot(x, y + 0.25, z);
            }
            else
            {
                // To do: Finde den nächstgelegenen Übergangspunkt!
                //        ...
            }
        }
        
    }

    private spawnLocationSpot(x:number, y:number, z:number):ERSLocationSpot
    {
        let model:Group = this._modelDatabase.get('ers-location.glb')!;
        let ls:ERSLocationSpot = new ERSLocationSpot(model, 'target', 'ers-location.glb');
        ls.setPosition(x, y, z);
        ls.setPivot(x, y, z);
        ls.setRotation(0, 0, 0);
        ls.setScale(1, 1, 1);
        this.addObjectForNextFrame(ls);
        return ls;
    }

    private addObjects():void
    {
        for(let i:number = 0; i < this._gameObjectsNew.length; i++)
        {
            this.addObjectInternal(this._gameObjectsNew[i]);
        }
        this._gameObjectsNew.splice(0, this._gameObjectsNew.length);
    }

    private removeObjects():void
    {
        for(let i:number = this._gameObjects.length - 1; i >= 0; i--)
        {
            let o:GameObject = this._gameObjects[i];
            if(o.isMarkedForRemoval())
            {
                if(o instanceof ERSInfoSpot || o instanceof ERSPortal || o instanceof ERSLocationSpot)
                {
                    const predicate = (element:GameObject) => element.getId() == o.getId();
                    let index:number = this._gameObjects.findIndex(predicate);
                    if(index >= 0)
                    {
                        this._gameObjects.splice(index, 1);
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
        }

        
    }

    private removeHitboxesForObject(o : GameObject):void
    {
        for(let hbIndex:number = 0; hbIndex < o.getHitboxes().length; hbIndex++)
        {
            for(let i:number = this._hitboxes.length - 1; i >= 0 ; i--)
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

    private async showHeader()
    {
        let header:HTMLElement|null = document.getElementById('header');
        if(header != null)
        {
            let headerCenter:HTMLElement|null = document.getElementById('header-center');
            if(headerCenter != null)
            {
                let table:HTMLTableElement = document.createElement('table');
                table.setAttribute('id', 'data-position');
                let row:HTMLTableRowElement = table.insertRow(0);
                row.insertCell().innerHTML = "Position:&nbsp";
                row.insertCell().innerText = "(";
                row.insertCell().setAttribute('id', 'data-position-x');
                row.insertCell().innerText = "|";
                row.insertCell().setAttribute('id', 'data-position-y');
                row.insertCell().innerText = "|";
                row.insertCell().setAttribute('id', 'data-position-z');
                row.insertCell().innerText = ")";
                headerCenter!.appendChild(table);
            }

            let headerRight:HTMLElement|null = document.getElementById('header-right');
            if(headerRight != null)
            {
                let p:HTMLElement = document.createElement('p');
                p.innerText = "Raumsuche:";
    
                let selectBlock:HTMLSelectElement = document.createElement('select');
                selectBlock.setAttribute('class', 'roomsearch');
                selectBlock.setAttribute('id', 'blocksearch');
                selectBlock.setAttribute('name', 'blocksearch');
                let blockOptionEmpty:HTMLElement = document.createElement('option');
                blockOptionEmpty.setAttribute('value', "");
                blockOptionEmpty.innerText = "";
                let blockOptionA:HTMLElement = document.createElement('option');
                blockOptionA.setAttribute('value', "A");
                blockOptionA.innerText = "A";
                let blockOptionB:HTMLElement = document.createElement('option');
                blockOptionB.setAttribute('value', "B");
                blockOptionB.innerText = "B";
                let blockOptionC:HTMLElement = document.createElement('option');
                blockOptionC.setAttribute('value', "C");
                blockOptionC.innerText = "C";
                selectBlock.appendChild(blockOptionEmpty);
                selectBlock.appendChild(blockOptionA);
                selectBlock.appendChild(blockOptionB);
                selectBlock.appendChild(blockOptionC);



                let selectNumber:HTMLSelectElement = document.createElement('select');
                selectNumber.setAttribute('id', 'roomsearch');
                selectNumber.setAttribute('class', 'roomsearch');
                selectNumber.setAttribute('name', 'roomsearch');
                selectNumber.disabled = true;
                
                headerRight.appendChild(p);
                headerRight.appendChild(selectBlock);
                headerRight.appendChild(selectNumber);

                selectBlock.addEventListener('change', populateRoomListForBlock);
                selectNumber.addEventListener('change', function(e:any)
                {
                    let bs:HTMLSelectElement|null = document.getElementById('blocksearch') as HTMLSelectElement;
                    let rs:HTMLSelectElement|null = document.getElementById('roomsearch') as HTMLSelectElement;
                    let block:string|null = null;
                    let room:string|null = null;
                    if(bs && rs && rs.selectedIndex >= 0)
                    {
                        block = bs.options[bs.selectedIndex].value;
                        room = rs.options[rs.selectedIndex].value;
                        GameScene.instance.spawnLocationSpotForRoom(block, room);
                    }
                    else
                    {
                        GameScene.instance.spawnLocationSpotForRoom(null, null);
                    }
                    
                });
            }
            
        }
        document.getElementById('header')!.style.opacity = "1";
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

    public getNavTarget():ERSLocationSpot|null
    {
        return this._navTarget;
    }

    public eraseNavTarget():void
    {
        this.resetRoomSearch();
    }

    private resetRoomSearch():void
    {
        this._navTarget = null;
        let selectBlock:HTMLSelectElement = document.getElementById('blocksearch') as HTMLSelectElement;
        if(selectBlock)
            selectBlock.selectedIndex = -1;
        let selectNumber:HTMLSelectElement = document.getElementById('roomsearch') as HTMLSelectElement;
        if(selectNumber)
        {
            selectNumber.disabled = true;
            selectNumber.selectedIndex = -1;
        }
    }

}

export default GameScene;