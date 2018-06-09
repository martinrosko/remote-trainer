module Resco.Controls {
    export class SelectBox<T> {
        public items: KnockoutObservableArray<T>;
        public itemLabel: KnockoutObservable<string>;
        public itemValue: KnockoutObservable<string>;
        public selectedItem: KnockoutObservable<T>;
        public isExpanded: KnockoutObservable<boolean>;
        public selectText: KnockoutObservable<string>;

        public selecteItemChanged: Resco.Event<SelectBoxItemChangedArgs<T>>;
        
        constructor() {
            this.items = ko.observableArray<T>();
            this.itemLabel = ko.observable<string>();
            this.itemValue = ko.observable<string>();
            this.selectedItem = ko.observable<T>();
            this.isExpanded = ko.observable<boolean>(false);
            this.selectText = ko.observable<string>("Please Select...");
            this.selecteItemChanged = new Resco.Event<SelectBoxItemChangedArgs<T>>(this);
        }

        public expand(): void {
            this.isExpanded(true);
        }

        public collapse(): void {
            this.isExpanded(false);
        }

        public itemSelected(item: T, index: number): void {
            this.selectedItem(item);
            this.selecteItemChanged.raise(new SelectBoxItemChangedArgs(item, index), this);
            this.isExpanded(false);
        }
    }

    export class SelectBoxItemChangedArgs<T> extends EventArgs {
        public item: T;
        public index: number;

        constructor(item?: T, index?: number) {
            super();
            this.item = item;
            this.index = index;
        }
    }
}