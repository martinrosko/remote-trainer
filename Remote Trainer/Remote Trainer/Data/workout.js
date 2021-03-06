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
        var WorkoutTemplate = /** @class */ (function () {
            function WorkoutTemplate() {
                this.setTemplates = [];
                this.name = ko.observable();
                this.description = ko.observable();
            }
            WorkoutTemplate.prototype.addSet = function (set) {
                this.setTemplates.push(set);
                set.parent = this;
                set.order(this.setTemplates.length);
            };
            WorkoutTemplate.prototype.copyTo = function (dst) {
                dst.name(this.name());
                dst.description(this.description());
            };
            return WorkoutTemplate;
        }());
        Data.WorkoutTemplate = WorkoutTemplate;
        var Workout = /** @class */ (function (_super) {
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
                _this.estimatedEnd = ko.computed(function () {
                    var estDuration = 0;
                    _this.sets().forEach(function (set) {
                        if (set.status() !== Data.SetStatus.Finished) {
                            set.series().forEach(function (serie) {
                                if (serie.status() === Data.SerieStatus.Ready || serie.status() === Data.SerieStatus.Queued)
                                    estDuration += serie.exercise.averageDurationPerRep + 75; // 75 seconds is estimated length of average break
                            }, _this);
                        }
                    }, _this);
                    return new Date(Date.now() + (estDuration * 1000));
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
                if (this.displayedSet())
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
                    // serie is restarted explicitly by user (it has its own countdown timer...)
                    // if workout was loaded in paused state, this timer was not created yet
                    if (!this.m_durationTimer) {
                        this.m_durationTimer = new RemoteTrainer.GlobalTimer();
                        this.m_durationTimer.fn = this._onDurationTimer.bind(this);
                        RemoteTrainer.Program.instance.GlobalTimer.push(this.m_durationTimer);
                    }
                    var pausedSet = this.sets().firstOrDefault(function (set) { return set.status() === Data.SetStatus.Paused; });
                    if (pausedSet)
                        pausedSet.resume(false);
                }
            };
            Workout.prototype.stop = function () {
                var _this = this;
                var unfinishedSet = this.sets().firstOrDefault(function (set) { return set.status() !== Data.SetStatus.Finished; });
                if (unfinishedSet) {
                    var confirm_1 = new RemoteTrainer.MessageBox("Do you want to complete the workout? All unfinished sets will be removed.", ["Complete"], "Cancel");
                    confirm_1.closed.add(this, function (sender, e) { return _this._completeWorkout(); });
                    confirm_1.show();
                }
                else {
                    this._completeWorkout();
                }
            };
            Workout.prototype._completeWorkout = function () {
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
            };
            Workout.prototype.addNewSet = function () {
                var _this = this;
                var set = new Data.Set();
                var dialog = new Data.ModifySetDialog(set);
                dialog.closing.add(this, function (sender, e) {
                    if (set.series().length === 0) {
                        var alert_1 = new RemoteTrainer.MessageBox("Set cannot be empty");
                        alert_1.show();
                        e.cancel = true;
                    }
                });
                dialog.closed.add(this, function (sender, e) {
                    if (dialog.dialogResult) {
                        _this.addSet(set);
                        if ((_this.status() === WorkoutStatus.Running || _this.status() === WorkoutStatus.Paused) && (!set.previous() || set.previous().status() === Data.SetStatus.Finished))
                            set.status(Data.SetStatus.Ready);
                    }
                });
                RemoteTrainer.Program.instance.showDialog(dialog);
            };
            Workout.prototype.onSortUpdated = function (event, droppedSet) {
                var sets = this.sets();
                sets.forEach(function (set, index) {
                    set.order(index + 1);
                    set.previous(index > 0 ? sets[index - 1] : null);
                    set.next(index < sets.length - 1 ? sets[index + 1] : null);
                });
            };
            Workout.prototype._onDurationTimer = function (context) {
                this.duration(this.duration() + 1);
            };
            return Workout;
        }(WorkoutTemplate));
        Data.Workout = Workout;
        var ModifyWorkoutDialog = /** @class */ (function (_super) {
            __extends(ModifyWorkoutDialog, _super);
            function ModifyWorkoutDialog(workoutTemplate) {
                var _this = _super.call(this) || this;
                _this.name("Modify Workout");
                _this.uiContentTemplateName("tmplModifyWorkoutTemplateDialog");
                _this.selectedTemplate = workoutTemplate;
                _this.workout = ko.observable(new Data.Workout(_this.selectedTemplate));
                return _this;
            }
            return ModifyWorkoutDialog;
        }(RemoteTrainer.Dialog));
        Data.ModifyWorkoutDialog = ModifyWorkoutDialog;
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