declare namespace MobileCRM {
    interface Bridge {
        alert(msg: string): void;
    }

    interface EntityStatic {
        new(entityName: string): EntityStatic;
        addAttributes(): void;
        orderBy(attribute: string, descending: boolean): void;
        filter: FilterStatic;
    }

    interface FilterStatic {
        new(): FilterStatic;
        where(attribute: string, operator: string, value: any): void;
    }

    interface FetchStatic {
        new(entity: EntityStatic, count?: number, page?: number): FetchStatic;

        execute(resultType: string, success: (result: any) => void, error: (err: string) => void, scope?: any): void;
    }

    interface FetchXmlStatic {
        Entity: EntityStatic;
        Filter: FilterStatic;
        Fetch: FetchStatic;
    }

    interface DynamicEntityStatic {
        new(entityName: string): DynamicEntityStatic;
        id: string;
        properties: any;
        save(callback: (error: string) => void): void;
    }

    interface ReferenceStatic {
        new(target: string, id: string, name: string): ReferenceStatic;
    }

    export var FetchXml: FetchXmlStatic;
    export var DynamicEntity: DynamicEntityStatic;
    export interface DynamicEntity extends DynamicEntityStatic { }
    export var Reference: ReferenceStatic;
    export interface Reference extends ReferenceStatic { }

    export var bridge: Bridge;
}

declare module "jsbridge" {
    export = MobileCRM;
} 