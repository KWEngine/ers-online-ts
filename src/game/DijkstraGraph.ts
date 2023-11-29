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

    public getCount():number
    {
        return this._nodes.length;
    }


}
export default DijkstraGraph;