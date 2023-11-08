import { Object3D, Vector3, Group, Quaternion } from "three";
import Hitbox from "../model/Hitbox";
import HelperGeneral from "../helpers/HelperGeneral";
import State from "./State";
import HelperCollision from "../helpers/HelperCollision";
import GameScene from "../scene/GameScene";
import HitboxG from "../model/HitboxG";
import Collision from "./Collision";

abstract class GameObject
{
    private static _idCounter:number = 0;

    private _id:number;
    private _object3d:Group;
    private _name:string;
    private _hitboxes:HitboxG[];
    
    private _stateCurrent:State;
    private _statePrevious:State;
    private _stateRender:State;
    private _modelFileName:string;

    constructor(object3d:Group, name:string, modelFileName:string)
    {
        this._modelFileName = modelFileName;
        this._id = GameObject._idCounter++;
        this._object3d = object3d.clone(true);
        this._name = name;
        this._hitboxes = [];
        this._object3d.receiveShadow = false;
        this._object3d.castShadow = false;
        this._stateCurrent = new State();
        this._statePrevious = new State();
        this._stateRender = new State();
        this.copyHitboxesFromModel();
        this.updateHitboxes();
    }

    private copyHitboxesFromModel()
    {
        let hbs:Hitbox[] = GameScene.instance.getHitboxesForModel(this._modelFileName);
        for(let i:number = 0; i < hbs.length; i++)
        {
            let hbClone:HitboxG = HelperCollision.copyHitbox(hbs[i], this);
            this._hitboxes.push(hbClone);
        }        
    }

    public getId():number
    {
        return this._id;
    }

    public getName():string
    {
        return this._name;
    }

    public castReceiveShadow(cast:boolean, receive:boolean):void
    {
        this._object3d.traverse(function(o){
            o.castShadow = cast;
            o.receiveShadow = receive;
        });
    }

    public setScale(x:number, y:number, z:number):void
    {
        this._stateCurrent._scale.x = x;
        this._stateCurrent._scale.y = y;
        this._stateCurrent._scale.z = z;
    }

    public getPosition():Vector3
    {
        return this._stateCurrent._position.clone();
    }

    public setPosition(x:number, y:number, z:number):void
    {
        this._stateCurrent._position.x = x;
        this._stateCurrent._position.y = y;
        this._stateCurrent._position.z = z;
        this.updateHitboxes();
    }

    public moveOffset(x:number, y:number, z:number):void
    {
        this._stateCurrent._position.x += x;
        this._stateCurrent._position.y += y;
        this._stateCurrent._position.z += z;
        this.updateHitboxes();
    }

    public moveOffsetByVector(v:Vector3):void
    {
        this.moveOffset(v.x, v.y, v.z);
    }

    public moveOffsetByVectorAndSpeed(vec:Vector3, speedFactor:number):void
    {
        this._stateCurrent._position.x += vec.x * speedFactor;
        this._stateCurrent._position.y += vec.y * speedFactor;
        this._stateCurrent._position.z += vec.z * speedFactor;
        this.updateHitboxes();
    }

    public strafeOffsetByVectorAndSpeed(vec:Vector3, speedFactor:number):void
    {
        let v:Vector3 = HelperGeneral.getStrafeVector(vec, GameScene.instance.getCamera().up);
        this.moveOffsetByVectorAndSpeed(v, speedFactor);
    }

    
    public addRotationX(degrees:number):void
    {
        let addedRotation:Quaternion = HelperGeneral.quaternionFromAxisAngle("x", degrees);
        this._stateCurrent._rotation.multiply(addedRotation);
        this.updateHitboxes();
    }

    public addRotationY(degrees:number):void
    {
        let addedRotation:Quaternion = HelperGeneral.quaternionFromAxisAngle("y", degrees);
        this._stateCurrent._rotation.multiply(addedRotation);
        this.updateHitboxes();
    }

    public addRotationZ(degrees:number):void
    {
        let addedRotation:Quaternion = HelperGeneral.quaternionFromAxisAngle("z", degrees);
        this._stateCurrent._rotation.multiply(addedRotation);
        this.updateHitboxes();
    }

    private updateHitboxes():void
    {
        let left:number = 99999999.0;
        let right:number = -99999999.0;
        let bottom:number = 99999999.0;
        let top:number = -99999999.0;
        let back:number = 99999999.0;
        let front:number = -99999999.0;

        for(let i = 0; i < this._hitboxes.length; i++)
        {
            this._hitboxes[i].update(this._stateCurrent._scale, this._stateCurrent._rotation, this._stateCurrent._position);
            if(this._hitboxes[i].getBoundsMin().x < left)
                left = this._hitboxes[i].getBoundsMin().x;

            if(this._hitboxes[i].getBoundsMax().x > right)
                right = this._hitboxes[i].getBoundsMax().x;

            if(this._hitboxes[i].getBoundsMin().y < bottom)
                bottom = this._hitboxes[i].getBoundsMin().y;

            if(this._hitboxes[i].getBoundsMax().y > top)
                top = this._hitboxes[i].getBoundsMax().y;

            if(this._hitboxes[i].getBoundsMin().z < back)
                back = this._hitboxes[i].getBoundsMin().z;

            if(this._hitboxes[i].getBoundsMax().z > front)
                front = this._hitboxes[i].getBoundsMax().z;
        }
        this._stateCurrent._boundsMin.set(left, bottom, back);
        this._stateCurrent._boundsMax.set(right, top, front);

        this._stateCurrent._center.set(
            (this._stateCurrent._boundsMax.x + this._stateCurrent._boundsMin.x) / 2.0, 
            (this._stateCurrent._boundsMax.y + this._stateCurrent._boundsMin.y) / 2.0, 
            (this._stateCurrent._boundsMax.z + this._stateCurrent._boundsMin.z) / 2.0); 
    }

    public getHitboxes():HitboxG[]
    {
        return this._hitboxes;
    }

    // Collision testing:
    public getIntersections():Collision[]
    {
        return HelperCollision.getIntersectionsFor(this);
    }

    public clearCollisionCandidates():void
    {
        for(let i:number = 0; i < this._hitboxes.length; i++)
        {
            this._hitboxes[i].clearCollisionCandidates();
        }
    }

    public get3DObject():Object3D
    {
        return this._object3d;
    }

    public stateBackup():void
    {
        HelperGeneral.copyStates(this._stateCurrent, this._statePrevious);
    }

    public stateBlendToRender(alpha:number):void
    {
        HelperGeneral.blendStates(this._statePrevious, this._stateCurrent, alpha, this._stateRender);
        this._object3d.position.set(
            this._stateRender._position.x, 
            this._stateRender._position.y, 
            this._stateRender._position.z);
        this._object3d.rotation.setFromQuaternion(this._stateRender._rotation);
        this._object3d.scale.set(
            this._stateRender._scale.x, 
            this._stateRender._scale.y, 
            this._stateRender._scale.z);
    }
}

export default GameObject;