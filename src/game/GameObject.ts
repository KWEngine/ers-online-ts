import { Object3D, Vector3, Group, Quaternion } from "three";
import Hitbox from "../model/Hitbox";
import HelperGeneral from "../helpers/HelperGeneral";
import State from "./State";
import HelperCollision from "../helpers/HelperCollision";

abstract class GameObject
{
    private static _idCounter:number = 0;

    private _id:number;
    private _object3d:Group;
    private _name:string;
    private _hitboxes:Hitbox[];
    private _leftrightmost:number[];
    private _backfrontmost:number[];
    private _bottomtopmost:number[];
    private _centerOfAllHitboxes:Vector3;
    private _stateCurrent:State;
    private _statePrevious:State;
    private _stateRender:State;

    constructor(object3d:Group, name:string)
    {
        this._id = GameObject._idCounter++;
        this._object3d = object3d.clone(true);
        this._name = name;
        this._hitboxes = [];
        this._leftrightmost = [0,0];
        this._bottomtopmost = [0,0];
        this._backfrontmost = [0,0];
        this._centerOfAllHitboxes = new Vector3(0,0,0);
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
        if(this._object3d.userData.hitboxes)
        {
            for(let i:number = 0; i < this._object3d.userData.hitboxes; i++)
            {
                let hbClone:Hitbox = this._object3d.userData.hitboxes[i].clone();
                hbClone.setNewId();
                hbClone.setGameObject(this);
                this._hitboxes.push(hbClone);
            }
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

    public moveOffsetByVector(vec:Vector3):void
    {
        this._stateCurrent._position.x += vec.x;
        this._stateCurrent._position.y += vec.y;
        this._stateCurrent._position.z += vec.z;
        this.updateHitboxes();
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
        let left = 99999999.0;
        let right = -99999999.0;
        let bottom = 99999999.0;
        let top = -99999999.0;
        let back = 99999999.0;
        let front = -99999999.0;
        let center = new Vector3(0,0,0);
        for(let i = 0; i < this._hitboxes.length; i++)
        {
            this._hitboxes[i].update(this._stateCurrent._scale, this._stateCurrent._rotation, this._stateCurrent._position);
            if(this._hitboxes[i]._boundsMin.x < left)
                left = this._hitboxes[i]._boundsMin.x;

            if(this._hitboxes[i]._boundsMax.x > right)
                right = this._hitboxes[i]._boundsMax.x;

            if(this._hitboxes[i]._boundsMin.y < bottom)
                bottom = this._hitboxes[i]._boundsMin.y;

            if(this._hitboxes[i]._boundsMax.y > top)
                top = this._hitboxes[i]._boundsMax.y;

            if(this._hitboxes[i]._boundsMin.z < back)
                back = this._hitboxes[i]._boundsMin.z;

            if(this._hitboxes[i]._boundsMax.z > front)
                front = this._hitboxes[i]._boundsMax.z;

            center.x += this._hitboxes[i]._center.x; 
            center.y += this._hitboxes[i]._center.y; 
            center.z += this._hitboxes[i]._center.z; 
        }
        this._leftrightmost[0] = left;
        this._leftrightmost[1] = right;
        this._bottomtopmost[0] = bottom;
        this._bottomtopmost[1] = top;
        this._backfrontmost[0] = back;
        this._backfrontmost[1] = front;
        center.x /= this._hitboxes.length;
        center.y /= this._hitboxes.length;
        center.z /= this._hitboxes.length;

        this._centerOfAllHitboxes.x = center.x;
        this._centerOfAllHitboxes.y = center.y;
        this._centerOfAllHitboxes.z = center.z;
    }

    public getHitboxes():Hitbox[]
    {
        return this._hitboxes;
    }

    // Collision testing:
    public getIntersections()
    {
        return HelperCollision.getIntersectionsFor(this);
    }

    public clearCollisionCandidates()
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