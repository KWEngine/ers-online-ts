class ERSSceneInits
{
    public ambientLight:string = "0x000000";
    public background_image:string = "";
    public player:any = { "position": [0, 0, 0], "rotation": [0, 0, 0], "scale":[1, 1.8, 1] }
    public renderObjects:any[] = [];
    public hitboxes:any[] = [];
    public portals:any[] = [];
    public infospots:any[] = [];
}

export default ERSSceneInits;