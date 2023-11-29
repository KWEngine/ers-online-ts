import GameScene from "../scene/GameScene";
import DijkstraNode from "./DijkstraNode";

class DijkstraGraph
{
    private _nodes:DijkstraNode[];

    constructor()
    {
        this._nodes = [];
    }

    public add(n:DijkstraNode)
    {
        this._nodes.push(n);
    }

    public addNeighbourToNode(index:number, neighbour:DijkstraNode, cost:number)
    {
        this._nodes[index].addNeighbour(neighbour, cost);
    }

    public setNeighboursForAllNodes():void
    {
        for(let i:number = 0; i < this._nodes.length; i++)
        {
            let currentNode:DijkstraNode = this._nodes[i];
            for(let j:number = 0; j < currentNode.getNeighbourIndices().length; j++)
            {
                let neighbourNode:DijkstraNode = this._nodes[currentNode.getNeighbourIndices()[j]];

                let cost:number = currentNode.getLocationInstance().x * neighbourNode.getLocationInstance().x +
                    currentNode.getLocationInstance().y * neighbourNode.getLocationInstance().y +
                    currentNode.getLocationInstance().z * neighbourNode.getLocationInstance().z;

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