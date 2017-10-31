interface Bridge {
	command(command: string, params, success, failed, scope: Object);
	alert(msg: string);
}

interface MobileCRMStatic {
    bridge: Bridge;
}

declare module "jsbridge" {
    export = MobileCRM;
} 
declare var MobileCRM: MobileCRMStatic;