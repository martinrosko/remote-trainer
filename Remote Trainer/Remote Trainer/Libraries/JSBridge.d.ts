interface Bridge {
	alert(msg: string): void;
}

interface IEntity {
    new(entityName: string): IEntity;
    addAttributes(): void;
    orderBy(attribute: string, descending: boolean): void;
    filter: IFilter;
}

interface IFilter {
    new(): IFilter;
    where(attribute: string, operator: string, value: any): void;
}

interface IFetch {
    new(entity: IEntity, count?: number, page?: number): IFetch;

    execute(resultType: string, success: (result: any) => void, error: (err: string) => void, scope?: any): void;
}

interface IFetchXml {
    Entity: IEntity;
    Fetch: IFetch;
    Filter: IFilter;
}

interface IDynamicEntity {

}

interface MobileCRMStatic {
    bridge: Bridge;
    FetchXml: IFetchXml;
    DynamicEntity: IDynamicEntity;
}

declare module "jsbridge" {
    export = MobileCRM;
} 
declare var MobileCRM: MobileCRMStatic;