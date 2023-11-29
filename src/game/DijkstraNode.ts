class DijkstraNode
{
    private _name:string;
    private _neighbours:Map<DijkstraNode, number>;


    constructor(name:string)
    {
        this._name = name;
        this._neighbours = new Map<DijkstraNode, number>();
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