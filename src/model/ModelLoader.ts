import { GLTFLoader } from "three/examples/jsm/Addons.js";

class ModelLoader
{
    private static _instance = new GLTFLoader();
    public static get instance() 
    {
        return this._instance;
    }

}

export default ModelLoader;