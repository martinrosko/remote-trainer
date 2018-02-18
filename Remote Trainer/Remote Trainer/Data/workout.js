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
                _this.status = ko.observable(WorkoutStatus.Ready);
                _this.startedOn = ko.observable();
                _this.finishedOn = ko.observable();
                _this.sets = ko.observableArray();
                _this.removedSets = new Resco.Dictionary();
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
                            if (serie.status() === Data.SerieStatus.Finished)
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
                            if (serie.status() === Data.SerieStatus.Finished) {
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
                set.order(index + 1);
                this.sets.push(set);
                if (index > 0) {
                    this.sets()[index - 1].next(set);
                    set.previous(this.sets()[index - 1]);
                }
            };
            Workout.prototype.start = function () {
                this.status(WorkoutStatus.Running);
                this.startedOn(new Date());
                this.duration(0);
                // subscribe duration timer to global timer
                this.m_durationTimer = new RemoteTrainer.GlobalTimer();
                this.m_durationTimer.fn = this._onDurationTimer.bind(this);
                RemoteTrainer.Program.instance.GlobalTimer.push(this.m_durationTimer);
                this.displayedSet = ko.observable(this.sets()[0]);
                this.displayedSet().status(Data.SetStatus.Ready);
            };
            Workout.prototype.pause = function () {
                if (this.status() === WorkoutStatus.Running) {
                    // pause global timers
                    RemoteTrainer.Program.instance.globalTimerPaused = true;
                    this.status(WorkoutStatus.Paused);
                    var activeSet = this.sets().firstOrDefault(function (set) { return set.status() === Data.SetStatus.Running || set.status() === Data.SetStatus.Ready; });
                    if (activeSet)
                        activeSet.pause();
                }
            };
            Workout.prototype.resume = function () {
                if (this.status() === WorkoutStatus.Paused) {
                    // resume global timers
                    RemoteTrainer.Program.instance.globalTimerPaused = false;
                    this.status(WorkoutStatus.Running);
                    // serie is restarted explicitly by user (it has countdown timer...)
                    var pausedSet = this.sets().firstOrDefault(function (set) { return set.status() === Data.SetStatus.Paused; });
                    if (pausedSet)
                        pausedSet.resume(false);
                }
            };
            Workout.prototype.stop = function () {
                var unfinishedSet = this.sets().firstOrDefault(function (set) { return set.status() !== Data.SetStatus.Finished; });
                if (!unfinishedSet || confirm("Do you want to complete the workout? All unfinished sets will be removed")) {
                    // clear all timers
                    RemoteTrainer.Program.instance.GlobalTimer.splice(0);
                    this.finishedOn(new Date());
                    this.status(WorkoutStatus.Finished);
                    var sets = this.sets();
                    for (var i = sets.length - 1; i >= 0; i--) {
                        var set = sets[i];
                        if (set.status() === Data.SetStatus.Queued || set.status() === Data.SetStatus.Ready) {
                            set.remove(false);
                        }
                        else if (set.status() !== Data.SetStatus.Finished) {
                            // remove unfinished series of incomplete sets
                            var series = set.series();
                            for (var j = series.length - 1; j >= 0; j--) {
                                var serie = series[j];
                                if (serie.status() !== Data.SerieStatus.Finished)
                                    serie.remove(false);
                            }
                            set.status(Data.SetStatus.Finished);
                        }
                    }
                }
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