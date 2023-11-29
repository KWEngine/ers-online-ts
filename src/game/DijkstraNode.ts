import { Vector3 } from "three";

class DijkstraNode
{
    private _name:string;
    private _neighbours:Map<DijkstraNode, number>;
    private _neighbourIndices:number[];
    private _neighbourIndicesCosts:number[];
    private _location:Vector3;


    constructor(name:string, location:Vector3)
    {
        this._name = name;
        this._neighbours = new Map<DijkstraNode, number>();
        this._neighbourIndices = [];
        this._neighbourIndicesCosts = [];
        this._location = location;
    }

    public getLocationInstance():Vector3
    {
        return this._location;
    }

    public addNeighbourIndex(index:number, cost:number)
    {
        this._neighbourIndices.push(index);
        this._neighbourIndicesCosts.push(cost);
    }

    public getNeighbourIndices():number[]
    {
        return this._neighbourIndices;
    }

    public getNeighbourIndicesCosts():number[]
    {
        return this._neighbourIndicesCosts;
    }

    public addNeighbour(n:DijkstraNode, cost:number)
    {
        this._neighbours.set(n, cost);
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