import { getCookie, getCookies, setCookie } from 'typescript-cookie'

class HelperCookie
{
    public static addTargetRoom(key:string, value:string, expMinutes:number)
    {
        console.log("adding room to cookie: " + value);
        setCookie(key, value, { expires: expMinutes * 60 * 1000});
    }

    public static getCookie(key:string):string
    {
        return getCookie(key)!;
    }

}
export default HelperCookie;