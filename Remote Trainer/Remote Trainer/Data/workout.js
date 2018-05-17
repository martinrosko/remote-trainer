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
                template.copyTo(_this);
                _this.uiStartedOn = ko.observable();
                _this.uiFinishedOn = ko.observable();
                _this.uiDuration = ko.observable();
                _this.uiDurationLabel = ko.computed(function () {
                    var duration = _this.uiDuration();
                    var mmntDur = moment.duration(duration, "seconds");
                    var hours = Math.floor(mmntDur.asHours());
                    var minutes = Math.floor(mmntDur.asMinutes());
                    var seconds = Math.floor(mmntDur.asSeconds());
                    return (hours < 10 ? "0" : "") + hours + ":" + (minutes < 10 ? "0" : "") + minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
                }, _this);
                _this.uiEstDurationLeft = ko.observable();
                _this.uiEstimatedEndLabel = ko.computed(function () {
                    var now = Date.now();
                    var estDuration = _this.uiEstDurationLeft();
                    var mmntEstEnd = moment(now + (estDuration * 1000));
                    return mmntEstEnd.format("HH:mm") + " (" + moment.duration(estDuration, "seconds").humanize(true) + ")";
                }, _this);
                _this.uiCompletion = ko.observable(0);
                _this.uiStatus = ko.observable(WorkoutStatus.Scheduled);
                _this.uiStatus.subscribe(function (value) {
                    if (_this.m_durationTimer) {
                        window.clearInterval(_this.m_durationTimer);
                        _this.m_durationTimer = 0;
                    }
                    if (value === WorkoutStatus.Running) {
                        _this.m_durationTimer = window.setInterval(function () {
                            _this.uiDuration(_this.uiDuration() + 1);
                        }, 1000);
                    }
                }, _this);
                _this.sets = ko.observableArray();
                var sets = _this.sets();
                template.setTemplates.forEach(function (setTemplate, index) {
                    var set = new Data.Set(setTemplate);
                    set.parent = _this;
                    set.order = index;
                    sets.push(set);
                    if (index > 0) {
                        sets[index - 1].next(set);
                        set.previous(sets[index - 1]);
                    }
                }, _this);
                _this.sets.valueHasMutated();
                _this.activeSet = ko.observable(sets[0]);
                _this.uiCategoriesInSet = ko.observableArray();
                _this.uiExercisesInSet = ko.observableArray();
                _this._updateWorkoutItems();
                return _this;
            }
            Workout.prototype.start = function () {
                this.uiDuration(0);
                this.uiStartedOn(new Date());
                if (this.sets().length > 0)
                    this.uiStatus(WorkoutStatus.Running);
                else
                    stop();
                this.updateCompletionStatus();
            };
            Workout.prototype.pause = function () {
                this.uiStatus(WorkoutStatus.Paused);
            };
            Workout.prototype.continueWorkout = function () {
                this.uiStatus(WorkoutStatus.Running);
            };
            Workout.prototype.stop = function () {
                this.uiFinishedOn(new Date());
                this.uiStatus(WorkoutStatus.Finished);
            };
            Workout.prototype.showPreviousSet = function () {
                var activeSet = this.activeSet();
                if (activeSet && activeSet.previous())
                    this.activeSet(activeSet.previous());
            };
            Workout.prototype.showNextSet = function () {
                var activeSet = this.activeSet();
                if (activeSet && activeSet.next())
                    this.activeSet(activeSet.next());
            };
            Workout.prototype.updateCompletionStatus = function () {
                var serieCount = 0;
                var completedCount = 0;
                var estDurationLeft = 0;
                this.sets().forEach(function (set) {
                    set.series().forEach(function (serie) {
                        serieCount++;
                        if (serie.uiStatus() === Data.SerieStatus.Finished)
                            completedCount++;
                        else
                            estDurationLeft += (serie.exercise.averageDurationPerRep * serie.reps) + 60; // 60 is average duration of the break
                    });
                }, this);
                this.uiCompletion(Math.round((completedCount * 100) / serieCount));
                this.uiEstDurationLeft(estDurationLeft);
            };
            Workout.prototype._updateWorkoutItems = function () {
                var _this = this;
                var sets = this.sets();
                var catsInSet = this.uiCategoriesInSet();
                var exInSet = this.uiExercisesInSet();
                sets.forEach(function (set) {
                    var series = set.series();
                    series.forEach(function (serie) {
                        if (!catsInSet.contains(serie.exercise.category))
                            catsInSet.push(serie.exercise.category);
                        if (!exInSet.contains(serie.exercise))
                            exInSet.push(serie.exercise);
                    }, _this);
                }, this);
                this.uiCategoriesInSet.valueHasMutated();
                this.uiExercisesInSet.valueHasMutated();
            };
            return Workout;
        }(WorkoutTemplate));
        Data.Workout = Workout;
        var WorkoutStatus;
        (function (WorkoutStatus) {
            WorkoutStatus[WorkoutStatus["Scheduled"] = 0] = "Scheduled";
            WorkoutStatus[WorkoutStatus["Ready"] = 1] = "Ready";
            WorkoutStatus[WorkoutStatus["Running"] = 2] = "Running";
            WorkoutStatus[WorkoutStatus["Paused"] = 3] = "Paused";
            WorkoutStatus[WorkoutStatus["Finished"] = 4] = "Finished";
        })(WorkoutStatus = Data.WorkoutStatus || (Data.WorkoutStatus = {}));
    })(Data = RemoteTrainer.Data || (RemoteTrainer.Data = {}));
})(RemoteTrainer || (RemoteTrainer = {}));
//# sourceMappingURL=workout.js.map