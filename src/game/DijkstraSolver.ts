import GameScene from "../scene/GameScene";
import DijkstraGraph from "./DijkstraGraph";
import DijkstraNode from "./DijkstraNode";

class DijkstraSolver
{
    //private readonly MAX_INT:number = 1000000;

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
        this.resetDistances();
        this.resetRoutes();

    }

    private resetDistances():void
    {
        this._distances.clear();
        for(let i:number = 0; i < this._graph.getNodes().length; i++)
        {
            this._distances.set(this._graph.getNodes()[i], Number.MAX_SAFE_INTEGER);
        }
    }

    private resetRoutes():void
    {
        this._routes.clear();
        for(let i:number = 0; i < this._graph.getNodes().length; i++)
        {
            this._routes.set(this._graph.getNodes()[i], null);
        }
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

    public calculate(source:DijkstraNode, destination:DijkstraNode):DijkstraNode[]
    {
        this._distances.set(source, 0);
        while(this._allNodes.length > 0)
        {
            let leastExpensiveNode:DijkstraNode = this.getLeastExpensiveNode();
            this.examineConnections(leastExpensiveNode);
            this._allNodes.splice(this._allNodes.indexOf(leastExpensiveNode), 1);
        }
        return this.getRoute(source, destination);
    }

    private getRoute(source:DijkstraNode, destination:DijkstraNode):DijkstraNode[]
    {
        let route:DijkstraNode[] = [];
        this.gatherRoute(source, destination, route);
        return route;
    }

    private gatherRoute(s:DijkstraNode, d:DijkstraNode, route:DijkstraNode[]):void
    {
        if(this._routes.get(d) == null)
        {
            route.push(d);
            return;
        }
        route.push(d);
        this.gatherRoute(s, this._routes.get(d)!, route);
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