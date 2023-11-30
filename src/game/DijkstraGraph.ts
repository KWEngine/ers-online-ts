import { Group, InstancedMesh, Matrix4, Mesh, MeshPhysicalMaterial, Vector3 } from "three";
import GameScene from "../scene/GameScene";
import DijkstraNode from "./DijkstraNode";
import GameObject from "./GameObject";

class DijkstraGraph
{
    private _nodes:DijkstraNode[];
    private _meshes:InstancedMesh[];

    constructor()
    {
        this._nodes = [];
        this._meshes = [];
    }

    public add(n:DijkstraNode)
    {
        this._nodes.push(n);
    }

    private generateChipMeshFor(n1:DijkstraNode, n2:DijkstraNode):InstancedMesh
    {
        let delta:Vector3 = new Vector3();
        delta.subVectors(n1.getLocationInstance(), n2.getLocationInstance());
        let deltaLength:number = Math.floor(delta.length());
        delta.normalize();

        // Generiere InstancedMesh-Instanzen für den Weg:
        let mesh:Group = GameScene.instance.getModel("ers-dijkstrachip.glb");
        let iMesh:InstancedMesh = new InstancedMesh((mesh.children[0] as Mesh).geometry, new MeshPhysicalMaterial({specularColor: 0x000000, color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.5, opacity: 1}), deltaLength);
        for(let k:number = 0; k < deltaLength; k++)
        {
            let mat4:Matrix4 = new Matrix4();
            mat4.setPosition(new Vector3(
                n1.getLocationInstance().x - delta.x * k, 
                n1.getLocationInstance().y - delta.y * k,
                n1.getLocationInstance().z - delta.z * k));
            mat4.scale(new Vector3(0.25, 0.25, 0.25));
            iMesh.setMatrixAt(k, mat4);
        }
        return iMesh;
    }   

    public setNeighboursForAllNodes():void
    {
        for(let i:number = 0; i < this._nodes.length; i++)
        {
            let currentNode:DijkstraNode = this._nodes[i];
            for(let j:number = 0; j < currentNode.getNeighbourIndices().length; j++)
            {
                let neighbourNode:DijkstraNode = this._nodes[currentNode.getNeighbourIndices()[j]];
                let delta:Vector3 = new Vector3(
                    currentNode.getLocationInstance().x - neighbourNode.getLocationInstance().x,
                    currentNode.getLocationInstance().y - neighbourNode.getLocationInstance().y,
                    currentNode.getLocationInstance().z - neighbourNode.getLocationInstance().z,
                    );

                let cost:number = Math.round(Math.sqrt(delta.x * delta.x + delta.y * delta.y + delta.z * delta.z));

                let mesh:InstancedMesh = this.generateChipMeshFor(currentNode, neighbourNode);
                this._meshes.push(mesh);
                currentNode.addNeighbour(neighbourNode, cost, this._meshes.length - 1);
            }
        }
    }
    
    public getChipsMeshes():InstancedMesh[]
    {
        return this._meshes;
    }

    public getNearestDijkstraNode(g:GameObject):DijkstraNode|null
    {
        let minDist:number = Number.MAX_SAFE_INTEGER;
        let minIndex:number = -1;
        
        for(let i:number = 0; i < this._nodes.length; i++)
        {
            let diffX:number = g.getPositionInstance().x - this._nodes[i].getLocationInstance().x;
            let diffY:number = g.getPositionInstance().y - this._nodes[i].getLocationInstance().y;
            let diffZ:number = g.getPositionInstance().z - this._nodes[i].getLocationInstance().z;
            let distanceSq:number = diffX * diffX + diffY * diffY + diffZ * diffZ;
            if(distanceSq < minDist)
            {
                minDist = distanceSq;
                minIndex = i;
            }
        }
        if(minIndex >= 0)
        {
            return this._nodes[minIndex];
        }
        else
        {
            return null;
        }
    }

    public remove(n:DijkstraNode)
    {
        let index:number = this._nodes.indexOf(n);
        if(index >= 0)
        {
            this._nodes.splice(index, 1);
        }
    }

    public getNodes():DijkstraNode[]
    {
        return this._nodes;
    }

    public getNodeByName(name:string):DijkstraNode|null
    {
        for(let i:number = 0; i < this._nodes.length; i++)
        {
            if(this._nodes[i].getName() == name)
            {
                return this._nodes[i];
            }
        }
        return null;
    }

    public getCount():number
    {
        return this._nodes.length;
    }
}
export default DijkstraGraph;