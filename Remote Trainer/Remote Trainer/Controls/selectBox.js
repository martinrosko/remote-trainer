var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var Resco;
(function (Resco) {
    var Controls;
    (function (Controls) {
        var SelectBox = /** @class */ (function () {
            function SelectBox() {
                this.items = ko.observableArray();
                this.itemLabel = ko.observable();
                this.itemValue = ko.observable();
                this.selectedItem = ko.observable();
                this.isExpanded = ko.observable(false);
                this.selectText = ko.observable("Please Select...");
                this.selecteItemChanged = new Resco.Event(this);
            }
            SelectBox.prototype.expand = function () {
                this.isExpanded(true);
            };
            SelectBox.prototype.collapse = function () {
                this.isExpanded(false);
            };
            SelectBox.prototype.itemSelected = function (item, index) {
                this.selectedItem(item);
                this.selecteItemChanged.raise(new SelectBoxItemChangedArgs(item, index), this);
                this.isExpanded(false);
            };
            return SelectBox;
        }());
        Controls.SelectBox = SelectBox;
        var SelectBoxItemChangedArgs = /** @class */ (function (_super) {
            __extends(SelectBoxItemChangedArgs, _super);
            function SelectBoxItemChangedArgs(item, index) {
                var _this = _super.call(this) || this;
                _this.item = item;
                _this.index = index;
                return _this;
            }
            return SelectBoxItemChangedArgs;
        }(Resco.EventArgs));
        Controls.SelectBoxItemChangedArgs = SelectBoxItemChangedArgs;
    })(Controls = Resco.Controls || (Resco.Controls = {}));
})(Resco || (Resco = {}));
//# sourceMappingURL=selectBox.js.map