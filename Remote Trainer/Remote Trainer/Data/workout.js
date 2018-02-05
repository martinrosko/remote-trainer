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
var RemoteTrainer;
(function (RemoteTrainer) {
    var Data;
    (function (Data) {
        var WorkoutTemplate = (function () {
            function WorkoutTemplate() {
                this.setTemplates = [];
            }
            WorkoutTemplate.prototype.addSet = function (set) {
                this.setTemplates.push(set);
                set.parent = this;
                set.order = this.setTemplates.length;
            };
            WorkoutTemplate.prototype.copyTo = function (dst) {
                dst.name = this.name;
                dst.description = this.description;
            };
            return WorkoutTemplate;
        }());
        Data.WorkoutTemplate = WorkoutTemplate;
        var Workout = (function (_super) {
            __extends(Workout, _super);
            function Workout(template) {
                var _this = _super.call(this) || this;
                _this.uiState = ko.observable(WorkoutState.Ready);
                _this.uiStartedOn = ko.observable();
                _this.uiFinishedOn = ko.observable();
                _this.sets = ko.observableArray();
                if (template) {
                    template.copyTo(_this);
                    template.setTemplates.forEach(function (setTemplate) { return _this.addSet(new Data.Set(setTemplate)); }, _this);
                }
                _this.displayedSet = ko.observable();
                return _this;
            }
            Workout.prototype.addSet = function (set) {
                var index = this.sets().length;
                set.parent = this;
                set.order = index;
                this.sets().push(set);
                if (index > 0) {
                    this.sets()[index - 1].next = set;
                    set.previous = this.sets()[index - 1];
                }
            };
            Workout.prototype.start = function () {
                this.uiStartedOn(Date.now());
                this.displayedSet = ko.observable(this.sets()[0]);
                this.displayedSet().start();
            };
            Workout.prototype.stop = function () {
                this.uiFinishedOn(Date.now());
            };
            return Workout;
        }(WorkoutTemplate));
        Data.Workout = Workout;
        var WorkoutState;
        (function (WorkoutState) {
            WorkoutState[WorkoutState["Ready"] = 0] = "Ready";
            WorkoutState[WorkoutState["Running"] = 1] = "Running";
            WorkoutState[WorkoutState["Finished"] = 2] = "Finished";
        })(WorkoutState = Data.WorkoutState || (Data.WorkoutState = {}));
    })(Data = RemoteTrainer.Data || (RemoteTrainer.Data = {}));
})(RemoteTrainer || (RemoteTrainer = {}));
//# sourceMappingURL=workout.js.map