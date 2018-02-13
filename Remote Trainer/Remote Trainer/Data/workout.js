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
                set.order(this.setTemplates.length);
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
                _this.uiStatus = ko.observable(WorkoutStatus.Ready);
                _this.uiStartedOn = ko.observable();
                _this.uiFinishedOn = ko.observable();
                _this.sets = ko.observableArray();
                if (template) {
                    template.copyTo(_this);
                    template.setTemplates.forEach(function (setTemplate) { return _this.addSet(new Data.Set(setTemplate)); }, _this);
                }
                _this.duration = ko.observable(0);
                _this.uiDuration = ko.computed(function () {
                    var duration = _this.duration();
                    return duration >= 0 ? RemoteTrainer.Program.instance.spanToTimeLabel(duration) : "";
                }, _this);
                _this.completition = ko.computed(function () {
                    var numSeries = 0;
                    var finishedSeries = 0;
                    _this.sets().forEach(function (set) {
                        set.series().forEach(function (serie) {
                            numSeries++;
                            if (serie.uiStatus() === Data.SerieStatus.Finished)
                                finishedSeries++;
                        });
                    });
                    return Math.round((finishedSeries / numSeries) * 100);
                }, _this);
                _this.averageDifficulty = ko.computed(function () {
                    var difficulty = 0;
                    var finishedSeries = 0;
                    _this.sets().forEach(function (set) {
                        set.series().forEach(function (serie) {
                            if (serie.uiStatus() === Data.SerieStatus.Finished) {
                                finishedSeries++;
                                difficulty += serie.difficulty();
                            }
                        });
                    });
                    return finishedSeries > 0 ? (difficulty / finishedSeries) : 0;
                }, _this);
                _this.displayedSet = ko.observable();
                return _this;
            }
            Workout.prototype.addSet = function (set) {
                var index = this.sets().length;
                set.parent = this;
                set.order(index);
                this.sets.push(set);
                if (index > 0) {
                    this.sets()[index - 1].next(set);
                    set.previous(this.sets()[index - 1]);
                }
            };
            Workout.prototype.start = function () {
                this.uiStatus(WorkoutStatus.Running);
                this.uiStartedOn(new Date());
                this.duration(0);
                // subscribe duration timer to global timer
                this.m_durationTimer = new RemoteTrainer.GlobalTimer();
                this.m_durationTimer.fn = this._onDurationTimer.bind(this);
                RemoteTrainer.Program.instance.GlobalTimer.push(this.m_durationTimer);
                this.displayedSet = ko.observable(this.sets()[0]);
                this.displayedSet().start();
            };
            Workout.prototype.stop = function () {
                // unsubscribe the duration timer
                var timerIndex = RemoteTrainer.Program.instance.GlobalTimer.indexOf(this.m_durationTimer);
                if (timerIndex >= 0)
                    RemoteTrainer.Program.instance.GlobalTimer.splice(timerIndex, 1);
                this.uiFinishedOn(new Date());
                this.uiStatus(WorkoutStatus.Finished);
            };
            Workout.prototype.addNewSet = function () {
                var _this = this;
                var set = new Data.Set();
                var dialog = new Data.ModifySetDialog(set);
                dialog.closed.add(this, function (sender, e) {
                    if (dialog.dialogResult) {
                        if (set.series().length > 0)
                            _this.addSet(set);
                    }
                });
                RemoteTrainer.Program.instance.showDialog(dialog);
            };
            Workout.prototype._onDurationTimer = function (context) {
                this.duration(this.duration() + 1);
            };
            return Workout;
        }(WorkoutTemplate));
        Data.Workout = Workout;
        var WorkoutStatus;
        (function (WorkoutStatus) {
            WorkoutStatus[WorkoutStatus["Ready"] = 1] = "Ready";
            WorkoutStatus[WorkoutStatus["Finished"] = 2] = "Finished";
            WorkoutStatus[WorkoutStatus["Running"] = 10000] = "Running";
            WorkoutStatus[WorkoutStatus["Paused"] = 10001] = "Paused";
        })(WorkoutStatus = Data.WorkoutStatus || (Data.WorkoutStatus = {}));
    })(Data = RemoteTrainer.Data || (RemoteTrainer.Data = {}));
})(RemoteTrainer || (RemoteTrainer = {}));
//# sourceMappingURL=workout.js.map