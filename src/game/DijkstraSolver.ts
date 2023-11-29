import DijkstraGraph from "./DijkstraGraph";
import DijkstraNode from "./DijkstraNode";

class DijkstraSolver
{
    private _distances:Map<DijkstraNode, number> = new Map();
    private _routes:Map<DijkstraNode, DijkstraNode|null> = new Map();
    private _graph:DijkstraGraph;
    private _allNodes:DijkstraNode[] = [];

    constructor(g:DijkstraGraph)
    {
        this._graph = g;
        this.reset();
    }

    public reset():void
    {
        this._allNodes = [];
        for(let i:number = 0; i < this._graph.getNodes().length; i++)
        {
            this._allNodes.push(this._graph.getNodes()[i]);
        }

        this._distances = this.resetDistances();
        this._routes = this.resetRoutes();

    }

    private resetDistances():Map<DijkstraNode, number>
    {
        let distances:Map<DijkstraNode, number> = new Map<DijkstraNode, number>();
        for(let i:number = 0; i < this._graph.getNodes().length; i++)
        {
            distances.set(this._graph.getNodes()[i], Number.MAX_SAFE_INTEGER);
        }
        return distances;
    }

    private resetRoutes():Map<DijkstraNode, DijkstraNode|null>
    {
        let routes:Map<DijkstraNode, DijkstraNode|null> = new Map<DijkstraNode, DijkstraNode|null>();
        for(let i:number = 0; i < this._graph.getNodes().length; i++)
        {
            routes.set(this._graph.getNodes()[i], null);
        }
        return routes;
    }

    private getLeastExpensiveNode():DijkstraNode
    {
        let leastExpensive:DijkstraNode = this._allNodes[0]; // TODO: Was ist wenn _allNodes leer ist?
        for(let i:number = 0; i < this._allNodes.length; i++)
        {
            if(this._distances.get(this._allNodes[i])! < this._distances.get(leastExpensive)!)
            {
                leastExpensive = this._allNodes[i];
            }
        }
        return leastExpensive;
    }

    public calculate(source:DijkstraNode, destination:DijkstraNode):void
    {
        this._distances.set(source, 0);

        while(this._allNodes.length > 0)
        {
            let leastExpensiveNode:DijkstraNode = this.getLeastExpensiveNode();
            this.examineConnections(leastExpensiveNode);
            this._allNodes.splice(this._allNodes.indexOf(leastExpensiveNode), 1);
        }
        this.printDebug(source, destination);
    }

    private printDebug(source:DijkstraNode, destination:DijkstraNode):void
    {
        console.log("shortest route for " + source.getName() + " to " + destination.getName() + ":");
        let output:string[] = [];
        this.gatherRoute(destination, output);

        for(let i:number = output.length - 1; i >= 0; i--)
        {
            console.log(output[i]);
        }
        console.log("------------");
        throw new Error("[DijkstraSolver] stopping...");
    }

    private gatherRoute(d:DijkstraNode, output:string[]):void
    {
        if(this._routes.has(d) == false)
        {
            output.push(d.getName());
            return;
        }
        output.push(d.getName());
        this.gatherRoute(this._routes.get(d)!, output);
    }

    private examineConnections(n:DijkstraNode):void
    {
        for(let neighbour of n.getNeighbours().keys())
        {
            let distanceOfN:number = this._distances.get(n)!;
            let neighbourValue:number = n.getNeighbours().get(neighbour)!;
            let distanceOfNeighbour = this._distances.get(neighbour)!;

            if(distanceOfN + neighbourValue < distanceOfNeighbour)
            {
                this._distances.set(neighbour, neighbourValue + distanceOfN);
                this._routes.set(neighbour, n);
            }
        }
    }


}
export default DijkstraSolver;