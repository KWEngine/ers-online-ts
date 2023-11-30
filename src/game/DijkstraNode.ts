import { InstancedMesh, Vector3 } from "three";

class DijkstraNode
{
    private _name:string;
    private _neighbours:Map<DijkstraNode, number>;
    private _neighboursChips:Map<DijkstraNode, number>;
    private _neighbourIndices:number[];
    private _location:Vector3;


    constructor(name:string, location:Vector3)
    {
        this._name = name;
        this._neighbours = new Map<DijkstraNode, number>();
        this._neighbourIndices = [];
        this._neighboursChips = new Map<DijkstraNode, number>();
        this._location = location;
    }

    public getLocationInstance():Vector3
    {
        return this._location;
    }

    public addNeighbourIndex(index:number)
    {
        this._neighbourIndices.push(index);
    }

    public getNeighbourIndices():number[]
    {
        return this._neighbourIndices;
    }

    public addNeighbour(n:DijkstraNode, cost:number, meshIndexInGraph:number)
    {
        this._neighbours.set(n, cost);
        this._neighboursChips.set(n, meshIndexInGraph);
    }

    public getNeighbourChipIndexInGraph(n:DijkstraNode):number
    {
        return this._neighboursChips.get(n)!;
    }

    public getName():string
    {
        return this._name;
    }

    public getNeighbours():Map<DijkstraNode, number>
    {
        return this._neighbours;
    }
}
export default DijkstraNode;