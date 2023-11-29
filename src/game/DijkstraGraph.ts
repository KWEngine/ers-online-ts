import { Group, InstancedMesh, Matrix4, Mesh, MeshStandardMaterial, Vector3 } from "three";
import GameScene from "../scene/GameScene";
import DijkstraNode from "./DijkstraNode";
import HelperScene from "../helpers/HelperScene";
import HelperGeneral from "../helpers/HelperGeneral";

class DijkstraGraph
{
    private _nodes:DijkstraNode[];
    private _chips:Matrix4[];

    constructor()
    {
        this._nodes = [];
        this._chips = [];
    }

    public add(n:DijkstraNode)
    {
        this._nodes.push(n);
    }

    public generateChips():InstancedMesh[]
    {
        let meshlist:InstancedMesh[] = [];
        for(let i:number = 0; i < this._nodes.length; i++)
        {
            let currentNode:DijkstraNode = this._nodes[i];
            let currentNodeLocation:Vector3 = currentNode.getLocationInstance();
            for(let j:number = 0; j < currentNode.getNeighbourIndices().length; j++)
            {
                let neighbourNode:DijkstraNode = this._nodes[currentNode.getNeighbourIndices()[j]];
                let neighbourNodeLocation:Vector3 = neighbourNode.getLocationInstance();

                let delta:Vector3 = new Vector3();
                delta.subVectors(currentNodeLocation, neighbourNodeLocation);
                let deltaLength:number = Math.floor(delta.length());
                delta.normalize();

                // Generiere InstancedMesh-Instanzen für den Weg:
                let mesh:Group = GameScene.instance.getModel("ers-dijkstrachip.glb");
                let iMesh:InstancedMesh = new InstancedMesh((mesh.children[0] as Mesh).geometry, new MeshStandardMaterial({color: 0xffffff, emissive: 0xffff00, emissiveIntensity: 0.25}), deltaLength);
                for(let k:number = 0; k < deltaLength; k++)
                {
                    let mat4:Matrix4 = new Matrix4();
                    mat4.setPosition(new Vector3(currentNodeLocation.x - delta.x * k, currentNodeLocation.y - delta.y * k,currentNodeLocation.z - delta.z * k));
                    mat4.scale(new Vector3(0.25, 0.25, 0.25));
                    iMesh.setMatrixAt(k, mat4);
                }
                //meshlist.push(iMesh);
            }
        }
        return meshlist;
    }

    public setNeighboursForAllNodes():void
    {
        for(let i:number = 0; i < this._nodes.length; i++)
        {
            let currentNode:DijkstraNode = this._nodes[i];
            for(let j:number = 0; j < currentNode.getNeighbourIndices().length; j++)
            {
                let neighbourNode:DijkstraNode = this._nodes[currentNode.getNeighbourIndices()[j]];
                let cost:number = currentNode.getNeighbourIndicesCosts()[j];
                currentNode.addNeighbour(neighbourNode, cost);
            }
        }
    }

    public getNearestDijkstraNode():DijkstraNode|null
    {
        let minDist:number = Number.MAX_SAFE_INTEGER;
        let minIndex:number = -1;
        
        for(let i:number = 0; i < this._nodes.length; i++)
        {
            let diffX:number = GameScene.instance.getPlayer().getPositionInstance().x - this._nodes[i].getLocationInstance().x;
            let diffY:number = GameScene.instance.getPlayer().getPositionInstance().y - this._nodes[i].getLocationInstance().y;
            let diffZ:number = GameScene.instance.getPlayer().getPositionInstance().z - this._nodes[i].getLocationInstance().z;
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