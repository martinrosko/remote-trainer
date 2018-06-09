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
        new(entityName: string, id?: string): DynamicEntityStatic;
        id: string;
        properties: any;
        isNew: boolean;
        save(callback: (error: string) => void): void;
        deleteById(entityName: string, id: string, success: () => void, fail: (error: string) => void, scope?: any): void;
    }

    interface ReferenceStatic {
        new(target: string, id: string, name: string): ReferenceStatic;
    }

    interface UIStatic {
        EntityForm: EntityFormStatic;
        Form: FormStatic;
    }

    interface EntityFormStatic {
        requestObject(success: (result: EntityForm) => void, error: (err: string) => void, scope?: any): void;
        onSave(handler: (form: EntityForm) => void, bind: boolean, scope?: any): void;
        closeWithoutSaving: () => void;
    }

    interface EntityForm {
        isDirty: boolean;
        form: Form;
        entity: DynamicEntity;
        suspendSave(): any;
    }

    interface FormStatic {
    }

    interface Form {
        caption: string;
    }

    export var FetchXml: FetchXmlStatic;
    export var DynamicEntity: DynamicEntityStatic;
    export interface DynamicEntity extends DynamicEntityStatic { }
    export var Reference: ReferenceStatic;
    export interface Reference extends ReferenceStatic { }
    export var UI: UIStatic;
    export var bridge: Bridge;
}

declare module "jsbridge" {
    export = MobileCRM;
} 