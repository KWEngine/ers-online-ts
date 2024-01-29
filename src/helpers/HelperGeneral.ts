import CameraState from "../game/CameraState";
import DijkstraNode from "../game/DijkstraNode";
import State from "../game/State";
import { Vector3, Quaternion, Matrix4, Euler, Object3D, Mesh } from "three";
import GameScene from "../scene/GameScene";
import DijkstraGraph from "../game/DijkstraGraph";
import ERSPortal from "../game/ERSPortal";
import { getData } from "../inc";
import ERSDoorLib from "../game/ERSDoorLib";

class HelperGeneral
{
    private static readonly _zeroVector:Vector3 = new Vector3(0,0,0);
    private static readonly _qrI:Quaternion = new Quaternion(0, 0, 0, 1);
    private static readonly _qrS:Quaternion = new Quaternion(0, 0, 0, 1);
    private static readonly _qrTmp:Quaternion = new Quaternion(0, 0, 0, 1);
    private static readonly _unitX:Vector3 = new Vector3(1,0,0);
    private static readonly _unitY:Vector3 = new Vector3(0,1,0);
    private static readonly _unitZ:Vector3 = new Vector3(0,0,1);
    private static readonly _strafeVector:Vector3 = new Vector3(1, 0, 0);
    private static readonly _identityQuaternion = new Quaternion(0,0,0,1);
    public static readonly _mat4Identity = new Matrix4();
    public static readonly MAXNUM:number = 9999999.9;
    public static readonly RAYCASTOFFSET:number = 100;
    public static readonly PORTALCOOLDOWN:number = 5;
    public static readonly BASEURL:string = "/__rundgang";
    private static readonly ISMOBILE:boolean = HelperGeneral.checkIfMobileDevice();
    private static _infoScreenState:number = 0; // 0 = disabled, 1 = info, 2 = portal

    public static getSelectedBlockRoom():string
    {
        let blockSelect:HTMLSelectElement = (document.getElementById('blocksearch') as HTMLSelectElement);
        let roomSelect:HTMLSelectElement = (document.getElementById('roomsearch') as HTMLSelectElement);
        if(blockSelect && roomSelect && blockSelect.selectedIndex >= 0 && roomSelect.selectedIndex >= 0)
        {
            let room:string = roomSelect.options[roomSelect.selectedIndex].value;
            if(room.includes(";"))
            {
                room = room.split(';')[0];
            }
            return room;
        }
        else
        {
            return "";
        }
        
    }

    private static escapeRegExp(string:string) 
    {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
      
    private static replaceAll(str:string, find:string, replace:string) 
    {
        return str.replace(new RegExp(HelperGeneral.escapeRegExp(find), 'g'), replace);
    }

    public static setMobileControlsVisible(v:boolean):void
    {
        if(HelperGeneral.isMobileDevice())
        {
            if(v)
            {
                document.getElementById('navigation-mobile')!.style.opacity = "1";
                document.getElementById('navigation-mobile')!.style.display = "flex";
            }
            else
            {
                document.getElementById('navigation-mobile')!.style.opacity = "0";
                document.getElementById('navigation-mobile')!.style.display = "none";
            }
        }
    }

    public static roundTo2(n:number):number
    {
        return Math.round(n * 100) / 100;
    }

    public static setInfoSreenActive(state:number):void
    {
        this._infoScreenState = state;
    }

    public static isInfoScreenActive():boolean
    {
        return this._infoScreenState == 1;
    }

    public static isPortalScreenActive():boolean
    {
        return this._infoScreenState == 2;
    }

    public static rad2deg(radians:number):number
    {
      let deg = radians * (180.0 / Math.PI);
      return Math.round((deg + Number.EPSILON) * 100) / 100;
    }
    
    public static deg2rad(degrees:number):number
    {
        return degrees * (Math.PI / 180.0);
    }

    public static clamp(theValue:number, lowerBound:number, upperBound:number):number
    {
        return Math.max(lowerBound, Math.min(theValue, upperBound));
    }

    public static readonly DTFrameSize:number = 1.0 / 120.0;

    public static copyStates(src:State, dest:State):void
    {
        dest._position.x = src._position.x;
        dest._position.y = src._position.y;
        dest._position.z = src._position.z;

        dest._scale.x = src._scale.x;
        dest._scale.y = src._scale.y;
        dest._scale.z = src._scale.z;

        dest._rotation.x = src._rotation.x;
        dest._rotation.y = src._rotation.y;
        dest._rotation.z = src._rotation.z;
        dest._rotation.w = src._rotation.w;

        dest._lookAtVector.x = src._lookAtVector.x;
        dest._lookAtVector.y = src._lookAtVector.y;
        dest._lookAtVector.z = src._lookAtVector.z;
    }

    public static blendStates(a:State, b:State, alpha:number, renderState:State):void
    {
        renderState._position = this._zeroVector.lerpVectors(a._position, b._position, alpha).clone();
        renderState._scale = this._zeroVector.lerpVectors(a._scale, b._scale, alpha).clone();
        renderState._rotation = this._identityQuaternion.slerpQuaternions(a._rotation, b._rotation, alpha).clone();
        renderState._lookAtVector = this._zeroVector.lerpVectors(a._lookAtVector, b._lookAtVector, alpha).clone();
    }

    public static copyStatesCamera(src:CameraState, dest:CameraState)
    {
        dest._eulerInitial.x = src._eulerInitial.x;
        dest._eulerInitial.y = src._eulerInitial.y;
        dest._eulerInitial.z = src._eulerInitial.z;

        dest._euler.x = src._euler.x;
        dest._euler.y = src._euler.y;
        dest._euler.z = src._euler.z;
    }

    public static blendStatesCamera(a:CameraState, b:CameraState, alpha:number, renderState:CameraState)
    {
        renderState._euler.set(
            a._euler.x * (1.0 - alpha) + b._euler.x * alpha, 
            a._euler.y * (1.0 - alpha) + b._euler.y * alpha, 
            a._euler.z * (1.0 - alpha) + b._euler.z * alpha
        );
    }

    public static hexToIntColor(rrggbb:string):number // erwartet: "rrggbb"
    {
        let bbggrr:string = rrggbb.substring(4, 4+2) + rrggbb.substring(2, 2+2) + rrggbb.substring(0, 2);
        return parseInt(bbggrr, 16);
    }

    public static quaternionFromAxisAngle(axisInput:string, angleInDegrees:number):Quaternion
    {
        let axis:Vector3 = axisInput == "x" ? this._unitX : axisInput == "y" ? this._unitY : this._unitZ;
        let result:Quaternion = new Quaternion(0, 0, 0, 1);
        let angle:number = this.deg2rad(angleInDegrees);
        angle *= 0.5;

        result.x = axis.x * Math.sin(angle);
        result.y = axis.y * Math.sin(angle);
        result.z = axis.z * Math.sin(angle);
        result.w = Math.cos(angle);
        result.normalize();

        return result;
    }

    public static rotateVectorByQuaternion(source:Vector3, rotation:Quaternion):void
    {
        this._qrI.x = rotation.x;   
        this._qrI.y = rotation.y;
        this._qrI.z = rotation.z;
        this._qrI.w = rotation.w;

        this._qrI.invert();
        
        this._qrS.set(source.x, source.y, source.z, 0.0);
        this._qrTmp.multiplyQuaternions(rotation, this._qrS);
        this._qrTmp.multiplyQuaternions(this._qrTmp, this._qrI);

        source.set(this._qrTmp.x, this._qrTmp.y, this._qrTmp.z);
    }

    public static disableInvisibleMeshes(o:Object3D)
    {
        if(o instanceof Mesh)
        {
            if(o.name.includes("_fullhitbox") == true)
            {
                o.visible = false;
            }
        }
        else
        {
            for(let i:number = 0; i < o.children.length; i++)
            {
                this.disableInvisibleMeshes(o.children[i]);
            }
        }
    }

    public static addGlowToObject(o:Object3D, intensity:number):void
    {
        o.traverse((obj:Object3D) => 
        {
            if(obj instanceof Mesh)
            {
                (obj as any).material.emissiveIntensity = intensity;
            }
        })
    }

    public static quaternionFrom3Axes(x:number, y:number, z:number):Quaternion
    {
        let e:Euler = new Euler(this.deg2rad(x), this.deg2rad(y), this.deg2rad(z), 'YXZ');
        let result:Quaternion = new Quaternion(0, 0, 0, 1);
        result.setFromEuler(e);
        return result;
    }

    public static getStrafeVector(lav:Vector3, up:Vector3):Vector3
    {
        this._strafeVector.crossVectors(lav, up);
        this._strafeVector.normalize();
        return this._strafeVector;
    }

    public static multiplyVectorByScalar(v:Vector3, s:number, out:Vector3):void
    {
        out.x = v.x * s;
        out.y = v.y * s;
        out.z = v.z * s;
    }

    public static isMobileDevice():boolean
    {
        return this.ISMOBILE;
    }

    private static checkIfMobileDevice():boolean
    {
        return (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1);
        //return window.matchMedia("(any-pointer:coarse)").matches;
    }


    public static transformNormalInverse(norm:Vector3, invMat:Matrix4, result:Vector3):void
    {
        result.set(
            norm.x * invMat.elements[0] + norm.y * invMat.elements[1] + norm.z * invMat.elements[2], 
            norm.x * invMat.elements[4] + norm.y * invMat.elements[5] + norm.z * invMat.elements[6],
            norm.x * invMat.elements[8] + norm.y * invMat.elements[9] + norm.z * invMat.elements[10]
        );
        result.normalize();
    }

    public static transformPosition(pos:Vector3, mat:Matrix4, result:Vector3):void
    {
        result.set(
            pos.x * mat.elements[0] + pos.y * mat.elements[4] + pos.z * mat.elements[8] + mat.elements[12],
            pos.x * mat.elements[1] + pos.y * mat.elements[5] + pos.z * mat.elements[9] + mat.elements[13],
            pos.x * mat.elements[2] + pos.y * mat.elements[6] + pos.z * mat.elements[10] + mat.elements[14]
        );
    }

    public static isTargetInCurrentLocation(room:string, x:number, y:number, z:number):boolean
    {
        if(window.location.pathname == "/__rundgang" || window.location.pathname == "/__rundgang/")
        {
            return false;
        }
        else if(window.location.pathname == HelperGeneral.BASEURL + "/forum" || window.location.pathname == HelperGeneral.BASEURL + "/forum/")
        {
            return room.charAt(0) == 'a' || (room.charAt(0) == 'b' && room.charAt(1) == '1');
        }
        else if(window.location.pathname == HelperGeneral.BASEURL + "/c-block" || window.location.pathname == HelperGeneral.BASEURL + "/c-block/")
        {
            return room.charAt(0) == 'c' && y < 1;
        }
        else if(window.location.pathname == HelperGeneral.BASEURL + "/c-block/1" || window.location.pathname == HelperGeneral.BASEURL + "/c-block/1/")
        {
            return room.charAt(0) == 'c' && y > 1 && y < 4;
        }
        else if(window.location.pathname == HelperGeneral.BASEURL + "/b-block" || window.location.pathname == HelperGeneral.BASEURL + "/b-block/")
        {
            return room.charAt(0) == 'b' && y < 1;
        }
        else if(window.location.pathname == HelperGeneral.BASEURL + "/b-block/1" || window.location.pathname == HelperGeneral.BASEURL + "/b-block/1/")
        {
            return room.charAt(0) == 'b' && y > 1 && y < 4;
        }

        return false;
    }

    
    public static findNearestTraversalNode(room:string, playerLocation:Vector3):DijkstraNode|null
    {
        let graph:DijkstraGraph = GameScene.instance.getDijkstraGraph();
        let searchterm:string = "";
        let pathname:string = window.location.pathname;
        let tempPos:Vector3|null = null;
        room = room.toLowerCase();

        if(pathname.endsWith("/"))
        {
            pathname = pathname.substring(0, pathname.length - 1);
        }

        if(pathname == HelperGeneral.BASEURL)
        {
            searchterm = "exit-outside-front-to-forum";
        }
        else if(pathname == HelperGeneral.BASEURL + "/forum")
        {
            if(playerLocation.y > 2)
            {
                if(room.charAt(0) == 'b')
                {
                    if(room.charAt(1) == '1' || room.charAt(1) == '2')
                    {
                        searchterm = "exit-forum-high-to-b"; // bis 1. Etage des B-Blocks frei ist: Workaround ;-)
                    }
                    else
                    {
                        searchterm = "exit-forum-to-b-right";
                    }
                }
                else if(room.startsWith("c"))
                {
                    if(room.charAt(1) == '1' || room.charAt(1) == '2')
                    {
                        searchterm = "exit-forum-high-to-c";
                    }
                    else
                    {
                        searchterm = "exit-forum-to-c";
                    }
                }
            }
            else
            {
                if(room.charAt(0) == 'b')
                {
                    if(room.charAt(1) == '0')
                    {
                        searchterm = "exit-forum-to-b-right";
                    }
                    else
                    {
                        searchterm = "exit-forum-high-to-b";
                    }
                }
                else if(room.charAt(0) == 'c')
                {
                    if(room.charAt(1) == '0')
                        searchterm = "exit-forum-to-c";
                    else
                        searchterm = "exit-forum-to-c";
                }
            }
        }
        else
        {            
            tempPos = HelperGeneral.findNearestPortalInCurrentLocation(this.getTargetNameForRoom(pathname, room));
            if(tempPos != null)
            {
                let node:DijkstraNode|null = graph.getNearestDijkstraNodeForPosition(tempPos);
                if(node != null)
                {
                    searchterm = node.getName();
                }
            }
        }

        if(searchterm.length == 0)
        {
            return null;
        }
        else
        {
            let node:DijkstraNode|null = graph.getNodeByName(searchterm);
            if(node == null)
                console.log("[HelperGeneral::findNearestTraversalNode()] Node '" + searchterm + "' not found.");
            return node;
        }
    }
    
    private static getTargetNameForRoom(pathname:string, room:string):string
    {
        let result:string = "";
        if(pathname == HelperGeneral.BASEURL + "/forum")
        {
            if(room.startsWith('b'))
            {
                return '/b-block';
            }
            else if(room.startsWith('c'))
            {
                return '/c-block';
            }
        }
        else if(pathname == HelperGeneral.BASEURL + "/c-block")
        {
            if(room.startsWith('a') || room.startsWith('b'))
            {
                return '/forum';
            }
            else if(room.charAt(1) == '1')
            {
                return '/c-block/1'
            }
        }
        else if(pathname == HelperGeneral.BASEURL + "/c-block/1")
        {
            if(room.startsWith('a') || room.startsWith('b'))
            {
                return '/forum';
            }
            else if(room.charAt(1) == '0' || room.includes("sporthalle"))
            {
                return '/c-block'
            }
        }
        else if(pathname == HelperGeneral.BASEURL + "/b-block")
        {
            if(room.startsWith('a') || room.startsWith('c'))
            {
                return '/forum';
            }
            else if(room.charAt(1) == '1')
            {
                return '/b-block/1'
            }
        }

        return result;
    }

    public static findNearestPortalInCurrentLocation(target:string):Vector3|null
    {
        let playerPos:Vector3 = GameScene.instance.getPlayer().getPositionInstance();

        let portalList:ERSPortal[] = GameScene.instance.getPortals();
        let deltaMin:number = HelperGeneral.MAXNUM;
        let deltaIndex:number = -1;
        for(let i:number = 0; i < portalList.length; i++)
        {
            if(portalList[i].getTarget() == target)
            {
                let dX = portalList[i].getPositionInstance().x - playerPos.x;
                let dZ = portalList[i].getPositionInstance().z - playerPos.z;
                let dXZ = dX * dX + dZ * dZ;
                if(dXZ < deltaMin)
                {
                    deltaMin = dXZ;
                    deltaIndex = i;
                }
            }
        }
        if(deltaIndex >= 0)
        {
            return portalList[deltaIndex].getPosition();
        }
        return null;
    }

    private static async getRoomPosition(room:string, roomPos:Vector3):Promise<boolean>
    {
        room = room.toLowerCase();
        let doors:any = await getData('./doors/doors.json');
        let doorlib:ERSDoorLib = JSON.parse(doors);

        if(room.startsWith('a'))
        {
            console.log(doorlib.a);
        }
        else if(room.startsWith('b'))
        {
            console.log(doorlib.b);
        }
        else if(room.startsWith('c'))
        {
            console.log(doorlib.c);
        }
        
        return false;
    }

    public static toggleFullscreen(e:any)
    {
        if(document.fullscreenElement)
        {
            document.exitFullscreen();
        }
        else
        {
            document.body.requestFullscreen();
        }
        GameScene.instance.updateViewport();
    }
}

export default HelperGeneral;