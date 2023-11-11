import HelperGeneral from "./HelperGeneral";

class HelperControls
{
    public static _keys:Map<string, boolean> = new Map<string, boolean>();
    public static _motionRotation:number[] = [0, 0];
    public static _motionMove:number[] = [0, 0];
    public static _pointerLocked:boolean = false;
    public static _hasFocus:boolean = true;
    public static _camMoveStrafeId = -1;
    public static _camPitchYawId = -1;
 
    public static updatePlayerControlsForDesktop():void
    {
        if(HelperControls._pointerLocked)
        {
            if(HelperGeneral.isMobileDevice() == false)
            {
                HelperControls._motionMove[0] = 0;
                HelperControls._motionMove[1] = 0;

                if(HelperControls._keys.get("w"))
                {
                    HelperControls._motionMove[0] = HelperGeneral.clamp(HelperControls._motionMove[0] + 1, -1, +1);
                }
                if(HelperControls._keys.get("s"))
                {
                    HelperControls._motionMove[0] = HelperGeneral.clamp(HelperControls._motionMove[0] - 1, -1, +1);
                }
                if(HelperControls._keys.get("a"))
                {
                    HelperControls._motionMove[1] = HelperGeneral.clamp(HelperControls._motionMove[1] - 1, -1, +1);
                }
                if(HelperControls._keys.get("d"))
                {
                    HelperControls._motionMove[1] = HelperGeneral.clamp(HelperControls._motionMove[1] + 1, -1, +1);
                }
            }
        }
    }
}
export default HelperControls;