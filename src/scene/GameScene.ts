import { BoxGeometry, MeshBasicMaterial, PerspectiveCamera, Scene, WebGLRenderer, Mesh } from "three";
//import { materialAlphaTest } from "three/examples/jsm/nodes/Nodes.js";

class GameScene
{
    private static _instance = new GameScene();
    public static get instance() 
    {
        return this._instance;
    }

    private _width:number;
    private _height:number;
    private _renderer:WebGLRenderer;
    private _camera:PerspectiveCamera;

    // three.js stuff:
    private readonly _scene = new Scene();


    private constructor()
    {
        this._width = window.innerWidth;
        this._height = window.innerHeight;

        this._renderer = new WebGLRenderer(
            {
                alpha:true,
                antialias:true,
            }
        );
        this._renderer.setPixelRatio(window.devicePixelRatio);
        this._renderer.setSize(this._width, this._height);

        const targetElement = document.getElementById("app");
        if(!targetElement)
        {
            throw "unable to find render target";
        }
        targetElement.appendChild(this._renderer.domElement);
        const aspectRatio = this._width / this._height;
        this._camera = new PerspectiveCamera(45, aspectRatio, 0.1, 1000);
        this._camera.position.set(0, 0, 3);
    }

    public render = () => 
    {
        requestAnimationFrame(this.render);
        this._renderer.render(this._scene, this._camera);
    }

    public load = () => 
    {
        const geometry = new BoxGeometry(1,1,1);
        const mat = new MeshBasicMaterial({color:0x00ff00});
        const cube = new Mesh(geometry, mat);
        this._scene.add(cube);
    }
}

export default GameScene;