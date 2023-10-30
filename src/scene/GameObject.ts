import { Object3D, Vector3, Group, QuadraticBezierCurve, Quaternion } from "three";
import Hitbox from "./Hitbox";
import HelperGeneral from "../globals/HelperGeneral";
import State from "./State";
import HelperCollision from "../globals/HelperCollision";

abstract class GameObject
{
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
        this._object3d = object3d.clone(true);
        this._name = name;
        this._hitboxes = [];
        this._leftrightmost = [0,0];
        this._bottomtopmost = [0,0];
        this._backfrontmost = [0,0];
        this._centerOfAllHitboxes = new Vector3(0,0,0);
        this.generateHitboxes();
        this._object3d.receiveShadow = false;
        this._object3d.castShadow = false;
        this._stateCurrent = new State();
        this._statePrevious = new State();
        this._stateRender = new State();
        this.updateHitbox();
    }

    public getName():string
    {
        return this._name;
    }

    public castReceiveShadow(cast:boolean, receive:boolean)
    {
        this._object3d.traverse(function(o){
            o.castShadow = cast;
            o.receiveShadow = receive;
        });
    }

    private generateHitboxes()
    {
        console.log(this._object3d);
        /*
        if(this._object3d.isObject3D)
        {
            for(let i = 0; i < this._object3d.children.length; i++)
            {
                let meshData = {
                    vertices : [],
                    normals : []
                };

                let node = this._object3d.children[i];
                if(node.type == "Group")
                {
                    let minX = Number.POSITIVE_INFINITY;
                    let minY = Number.POSITIVE_INFINITY;
                    let minZ = Number.POSITIVE_INFINITY;
                    let maxX = Number.NEGATIVE_INFINITY;
                    let maxY = Number.NEGATIVE_INFINITY;
                    let maxZ = Number.NEGATIVE_INFINITY;

                    

                    // collect mins/maxes from multiple children
                    for(let j = 0; j < node.children.length; j++)
                    {
                        if(node.children[j].geometry.boundingBox == null)
                        {
                            node.children[j].geometry.computeBoundingBox();
                        }

                        let submesh = node.children[j].geometry.boundingBox;
                        // gather mins, maxes:
                        minX = submesh.min.x < minX ? submesh.min.x : minX;
                        minY = submesh.min.y < minY ? submesh.min.y : minY;
                        minZ = submesh.min.z < minZ ? submesh.min.z : minZ;

                        maxX = submesh.max.x > maxX ? submesh.max.x : maxX;
                        maxY = submesh.max.y > maxY ? submesh.max.y : maxY;
                        maxZ = submesh.max.z > maxZ ? submesh.max.z : maxZ;
                        
                        if(node.children[j].name.toLowerCase().includes('_invisible'))
                        {
                            node.children[j].visible = false;
                        }

                        if(node.name.toLowerCase().includes('_fullhitbox'))
                        {
                            if(node.children[j].geometry && node.children[j].geometry instanceof THREE.Geometry)
                            {
                                for(let k = 0; k < node.children[j].geometry.vertices.length; k++)
                                {
                                    meshData.vertices.push(node.children[j].geometry.vertices[k].clone());
                                }
                                for(let k = 0; k < node.children[j].geometry.faces.length; k++)
                                {
                                    meshData.normals.push(node.children[j].geometry.faces[k].normal.clone());
                                }

                            }
                            else if(node.children[j].geometry && node.children[j].geometry instanceof THREE.BufferGeometry)
                            {
                                let geo = new THREE.Geometry().fromBufferGeometry(node.children[j].geometry);
                                for(let k = 0; k < geo.vertices.length; k++)
                                {
                                    meshData.vertices.push(geo.vertices[k].clone());
                                }
                                for(let k = 0; k < geo.faces.length; k++)
                                {
                                    meshData.normals.push(geo.faces[k].normal.clone());
                                }
                            }
                        }

                    }
                    let meshCenter = new THREE.Vector3(
                        minX + ((maxX - minX) / 2.0), 
                        minY + ((maxY - minY) / 2.0), 
                        minZ + ((maxZ - minZ) / 2.0), 
                        );

                    
                    let isFloor = node.name.toLowerCase().includes('_floor');
                    if(node.name.toLowerCase().includes('_fullhitbox'))
                    {
                        
                        this._hitboxes.push(
                            new Hitbox(this, meshCenter, minX, minY, minZ, maxX, maxY, maxZ, node.position, node.rotation, node.scale, isFloor, meshData, node.name)
                        );
                    }
                    else
                    {
                        this._hitboxes.push(
                            new Hitbox(this, meshCenter, minX, minY, minZ, maxX, maxY, maxZ, node.position, node.rotation, node.scale, isFloor, null, node.name)
                        );
                    }
                }
                else if(node.isMesh && node.name.toLowerCase().includes('_nohitbox') == false)
                {
                    // mesh with single material found
                    if(node.geometry.boundingBox == null)
                    {
                        node.geometry.computeBoundingBox();
                    }

                    if(node.name.toLowerCase().includes('_invisible'))
                    {
                        node.visible = false;
                    }

                    let bb = node.geometry.boundingBox;
                    
                    let meshCenter = new Vector3(
                        bb.min.x + (bb.max.x - bb.min.x) / 2, 
                        bb.min.y + (bb.max.y - bb.min.y) / 2, 
                        bb.min.z + (bb.max.z - bb.min.z) / 2
                    );

                    if(node.name.toLowerCase().includes('_fullhitbox'))
                    {
                        if(node.geometry && node.geometry instanceof Geometry)
                        {
                            for(let k = 0; k < node.geometry.vertices.length; k++)
                            {
                                meshData.vertices.push(node.geometry.vertices[k].clone());
                            }
                            for(let k = 0; k < node.geometry.faces.length; k++)
                            {
                                meshData.normals.push(node.geometry.faces[k].normal.clone());
                            }
                        }
                        else if(node.geometry && node.geometry instanceof THREE.BufferGeometry)
                        {
                            let geo = new THREE.Geometry().fromBufferGeometry(node.geometry);
                            for(let k = 0; k < geo.vertices.length; k++)
                            {
                                let vertex = geo.vertices[k].clone();
                                let addVertex = true;
                                for(let index2 = 0; index2 < meshData.vertices.length; index2++)
                                {
                                    if(meshData.vertices[index2].x == vertex.x &&
                                        meshData.vertices[index2].y == vertex.y &&
                                        meshData.vertices[index2].z == vertex.z)
                                    {
                                        addVertex = false;
                                        break;
                                    }
                                }
                                if(addVertex)
                                    meshData.vertices.push(vertex);
                            }
                            for(let k = 0; k < geo.faces.length; k++)
                            {
                                let normal = geo.faces[k].normal.clone();
                                let addNormal = true;
                                for(let index2 = 0; index2 < meshData.normals.length; index2++)
                                {
                                    if(meshData.normals[index2].x == normal.x &&
                                        meshData.normals[index2].y == normal.y &&
                                        meshData.normals[index2].z == normal.z)
                                    {
                                        addNormal = false;
                                        break;
                                    }
                                }
                                if(addNormal)
                                    meshData.normals.push(normal);
                            }

                        }
                    }


                    let isFloor = node.name.toLowerCase().includes('_floor');
                    if(node.name.toLowerCase().includes('_fullhitbox'))
                    {
                        this._hitboxes.push(
                            new Hitbox(this, meshCenter, bb.min.x, bb.min.y, bb.min.z, bb.max.x, bb.max.y, bb.max.z, node.position, node.rotation, node.scale, isFloor, meshData, node.name)
                        );
                    }
                    else
                    {
                        this._hitboxes.push(
                            new Hitbox(this, meshCenter, bb.min.x, bb.min.y, bb.min.z, bb.max.x, bb.max.y, bb.max.z, node.position, node.rotation, node.scale, isFloor, null, node.name)
                        );
                    }
                    
                }
            }
        }
        */
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
        this.updateHitbox();
    }

    public moveOffset(x:number, y:number, z:number):void
    {
        this._stateCurrent._position.x += x;
        this._stateCurrent._position.y += y;
        this._stateCurrent._position.z += z;
        this.updateHitbox();
    }

    public moveOffsetByVector(vec:Vector3):void
    {
        this._stateCurrent._position.x += vec.x;
        this._stateCurrent._position.y += vec.y;
        this._stateCurrent._position.z += vec.z;
        this.updateHitbox();
    }

    public addRotationX(degrees:number):void
    {
        let addedRotation:Quaternion = HelperGeneral.quaternionFromAxisAngle("x", degrees);
        this._stateCurrent._rotation.multiply(addedRotation);
        this.updateHitbox();
    }

    public addRotationY(degrees:number):void
    {
        let addedRotation:Quaternion = HelperGeneral.quaternionFromAxisAngle("y", degrees);
        this._stateCurrent._rotation.multiply(addedRotation);
        this.updateHitbox();
    }

    public addRotationZ(degrees:number):void
    {
        let addedRotation:Quaternion = HelperGeneral.quaternionFromAxisAngle("z", degrees);
        this._stateCurrent._rotation.multiply(addedRotation);
        this.updateHitbox();
    }

    private updateHitbox():void
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
            let result = this._hitboxes[i].update();
            if(result[0] < left)
                left = result[0];

            if(result[1] > right)
                right = result[1];

            if(result[2] < bottom)
                bottom = result[2];

            if(result[3] > top)
                top = result[3];

            if(result[4] < back)
                back = result[4];

            if(result[5] > front)
                front = result[5];

            center.x += result[6].x; 
            center.y += result[6].y; 
            center.z += result[6].z; 
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

    public getExtentsForAxis(a:number):number[]
    {
        if (a == 1)
            return this._bottomtopmost;
        else if (a == 2)
            return this._backfrontmost;
        else
            return this._leftrightmost;
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
    }
}

export default GameObject;