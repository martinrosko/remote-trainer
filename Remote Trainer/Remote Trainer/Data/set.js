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
        var SetTemplate = (function () {
            function SetTemplate() {
                this.serieTemplates = [];
                this.order = ko.observable();
                if (RemoteTrainer.DEMODATA)
                    this.id = Math.floor(Math.random() * Math.floor(1000)).toString();
            }
            SetTemplate.prototype.addSerie = function (serie) {
                this.serieTemplates.push(serie);
                serie.parent = this;
                serie.order(this.serieTemplates.length);
            };
            SetTemplate.prototype.copyTo = function (dst) {
                dst.id = this.id;
                dst.order(this.order());
                dst.name = this.name;
            };
            return SetTemplate;
        }());
        Data.SetTemplate = SetTemplate;
        var Set = (function (_super) {
            __extends(Set, _super);
            function Set(template) {
                var _this = _super.call(this) || this;
                _this.next = ko.observable(null);
                _this.previous = ko.observable(null);
                _this.series = ko.observableArray();
                _this.removedSeries = new Resco.Dictionary();
                _this.exercises = ko.computed(function () {
                    var series = _this.series();
                    var result = [];
                    series.forEach(function (serie) {
                        if (result.indexOf(serie.exercise) < 0)
                            result.push(serie.exercise);
                    });
                    return result;
                }, _this);
                if (template) {
                    template.copyTo(_this);
                    template.serieTemplates.forEach(function (serieTemplate) { return _this.addSerie(new Data.Serie(serieTemplate)); }, _this);
                }
                _this.status = ko.observable(SetStatus.Queued);
                _this.status.subscribe(function (value) {
                    switch (value) {
                        case SetStatus.Queued:
                        case SetStatus.Finished:
                            RemoteTrainer.Program.instance.clearTimer(_this.m_runningTimer);
                            break;
                        case SetStatus.Running:
                            if (!_this.m_runningTimer) {
                                _this.m_runningTimer = new RemoteTrainer.GlobalTimer();
                                _this.m_runningTimer.fn = _this._onRunningTick.bind(_this);
                                RemoteTrainer.Program.instance.GlobalTimer.push(_this.m_runningTimer);
                            }
                            break;
                        case SetStatus.Ready:
                            if (_this.series().length > 0)
                                _this.series()[0].status(Data.SerieStatus.Ready);
                            break;
                    }
                }, _this);
                _this.uiAverageDifficulty = ko.computed(function () {
                    if (_this.status() === SetStatus.Finished && _this.series().length > 0) {
                        var total = 0;
                        _this.series().forEach(function (s) { return total += s.difficulty(); });
                        return (total / _this.series().length).toFixed(2);
                    }
                    return "";
                }, _this);
                _this.duration = ko.observable(0);
                _this.uiDurationLabel = ko.computed(function () {
                    var duration = _this.duration();
                    return RemoteTrainer.Program.instance.spanToTimeLabel(duration);
                }, _this);
                _this.exercising = ko.computed(function () {
                    var total = 0;
                    _this.series().forEach(function (s) { return total += s.duration(); });
                    return total;
                }, _this);
                _this.uiExercisingLabel = ko.computed(function () {
                    var exercising = _this.exercising();
                    return RemoteTrainer.Program.instance.spanToTimeLabel(exercising);
                }, _this);
                _this.uiOptionsContentTemplate = ko.observable("tmplOptionsSetSettings");
                _this.uiOptionsPanelState = ko.observable(Data.OptionPanelState.Closed);
                return _this;
            }
            Set.prototype.pause = function () {
                var activeSerie = this.series().firstOrDefault(function (serie) { return serie.status() === Data.SerieStatus.Running || serie.status() === Data.SerieStatus.Ready; });
                if (activeSerie)
                    activeSerie.pause();
                if (this.status() === SetStatus.Running)
                    this.status(SetStatus.Paused);
            };
            Set.prototype.resume = function (bIgnorePaused) {
                if (this.status() === SetStatus.Paused && (bIgnorePaused || !this.series().firstOrDefault(function (serie) { return serie.status() === Data.SerieStatus.Paused; })))
                    this.status(SetStatus.Running);
                this.parent.resume();
            };
            Set.prototype.addSerie = function (serie) {
                var index = this.series().length;
                serie.parent = this;
                serie.order(index + 1);
                this.series.push(serie);
                if (index > 0) {
                    this.series()[index - 1].next(serie);
                    serie.previous(this.series()[index - 1]);
                }
                if (this.exercises().indexOf(serie.exercise) < 0)
                    this.exercises().push(serie.exercise);
            };
            Set.prototype._onRunningTick = function (context) {
                this.duration(this.duration() + 1);
            };
            Set.prototype.show = function () {
                this.parent.displayedSet(this);
                RemoteTrainer.Program.instance.onTabItemClicked("Set");
            };
            Set.prototype.showPrevious = function () {
                if (this.previous())
                    this.parent.displayedSet(this.previous());
            };
            Set.prototype.showNext = function () {
                if (this.next())
                    this.parent.displayedSet(this.next());
            };
            Set.prototype.showRunningSet = function () {
                var set = this.parent.sets().filter(function (s) { return s.status() === SetStatus.Running || s.status() === SetStatus.Ready; });
                if (set.length > 0)
                    this.parent.displayedSet(set[0]);
            };
            Set.prototype.showHideSettings = function () {
                this.uiOptionsPanelState(this.uiOptionsPanelState() === Data.OptionPanelState.Closed ? Data.OptionPanelState.Opened : Data.OptionPanelState.Closed);
            };
            Set.prototype.moveDown = function () {
                if (this.next()) {
                    var sets = this.parent.sets();
                    sets.splice(this.order() - 1, 1);
                    sets.splice(this.order(), 0, this);
                    this.next().order(this.order());
                    this.order(this.order() + 1);
                    var nextSet = this.next();
                    this.next(nextSet.next());
                    nextSet.next(this);
                    if (this.next())
                        this.next().previous(this);
                    var previousSet = this.previous();
                    this.previous(nextSet);
                    nextSet.previous(previousSet);
                    if (previousSet)
                        previousSet.next(this.previous());
                    this.parent.sets.valueHasMutated();
                    //if (this.uiStatus() === SetStatus.Ready) {
                    //    this.previous().ready(this.series()[0].break());    // set the actual lenght of current break to new set that is ready
                    //    this.queue();
                    //}
                }
            };
            Set.prototype.moveUp = function () {
                if (this.previous() && (this.previous().status() === SetStatus.Queued || this.previous().status() === SetStatus.Ready)) {
                    var sets = this.parent.sets();
                    sets.splice(this.order() - 1, 1);
                    sets.splice(this.order() - 2, 0, this);
                    this.previous().order(this.order());
                    this.order(this.order() - 1);
                    var previousSet = this.previous();
                    this.previous(previousSet.previous());
                    previousSet.previous(this);
                    if (this.previous())
                        this.previous().next(this);
                    var nextSet = this.next();
                    this.next(previousSet);
                    previousSet.next(nextSet);
                    if (nextSet)
                        nextSet.previous(this.next());
                    this.parent.sets.valueHasMutated();
                    //if (this.next().uiStatus() === SetStatus.Ready) {
                    //    this.ready(this.next().series()[0].break());
                    //    this.next().queue();
                    //}
                }
            };
            Set.prototype.remove = function (askConfirm) {
                if (askConfirm === void 0) { askConfirm = true; }
                if (!askConfirm || confirm("Remove the entire set?")) {
                    this.parent.sets.splice(this.order() - 1, 1);
                    if (this.id && !this.parent.removedSets.containsKey(this.id))
                        this.parent.removedSets.set(this.id, this);
                    this.series().forEach(function (serie) { return serie.remove(false); }, this);
                    if (this.previous())
                        this.previous().next(this.next());
                    if (this.next())
                        this.next().previous(this.previous());
                    var next = this.next();
                    while (next) {
                        next.order(next.order() - 1);
                        next = next.next();
                    }
                }
            };
            Set.prototype.copyTo = function (dst) {
                _super.prototype.copyTo.call(this, dst);
                dst.duration(this.duration());
                dst.series([]);
                this.series().forEach(function (serie) { return dst.addSerie(serie.clone()); });
            };
            Set.prototype.clone = function () {
                var result = new Set();
                this.copyTo(result);
                return result;
            };
            Set.prototype.modifySet = function (set) {
                var _this = this;
                //todo: clone set and modify it only if dialogresult = true
                var clonedSet = set.clone();
                var dialog = new ModifySetDialog(clonedSet);
                dialog.closed.add(this, function (sender, e) {
                    if (dialog.dialogResult) {
                        var series = set.series();
                        series.forEach(function (oldSerie) {
                            // if there is not a serie with old id in new set of series, add it to deleted series, it must be removed from
                            if (!clonedSet.series().firstOrDefault(function (clonedSerie) { return clonedSerie.id === oldSerie.id; }) && oldSerie.id && !set.removedSeries.containsKey(oldSerie.id))
                                set.removedSeries.set(oldSerie.id, oldSerie);
                        }, _this);
                        clonedSet.copyTo(set);
                    }
                });
                RemoteTrainer.Program.instance.showDialog(dialog);
            };
            Set.prototype.showAddSerieDialog = function () {
                var _this = this;
                var dialog = new AddSerieDialog(RemoteTrainer.Program.instance.categories, RemoteTrainer.Program.instance.exercises);
                dialog.closed.add(this, function (sender, e) {
                    if (dialog.dialogResult) {
                        var serie = new Data.Serie();
                        serie.exercise = dialog.selectedExercise();
                        _this.addSerie(serie);
                    }
                });
                RemoteTrainer.Program.instance.showDialog(dialog);
            };
            return Set;
        }(SetTemplate));
        Data.Set = Set;
        var ModifySetDialog = (function (_super) {
            __extends(ModifySetDialog, _super);
            function ModifySetDialog(set) {
                var _this = _super.call(this) || this;
                _this.name("Modify Set");
                _this.uiContentTemplateName("tmplModifySetDialog");
                _this.modifiedSet = set;
                return _this;
            }
            return ModifySetDialog;
        }(RemoteTrainer.Dialog));
        Data.ModifySetDialog = ModifySetDialog;
        var AddSerieDialog = (function (_super) {
            __extends(AddSerieDialog, _super);
            function AddSerieDialog(categories, exercises) {
                var _this = _super.call(this) || this;
                _this.name("Add Serie");
                _this.uiContentTemplateName("tmplAddSerieDialog");
                _this.categories = categories;
                _this.m_exercises = exercises;
                _this.selectedCategory = ko.observable(_this.categories && _this.categories.length > 0 ? _this.categories[0] : undefined);
                _this.exercises = ko.computed(function () {
                    var cat = _this.selectedCategory();
                    return _this.m_exercises.filter(function (exc) { return exc.category === cat; });
                }, _this);
                _this.selectedExercise = ko.observable(_this.exercises() && _this.exercises().length > 0 ? _this.exercises()[0] : undefined);
                return _this;
            }
            return AddSerieDialog;
        }(RemoteTrainer.Dialog));
        Data.AddSerieDialog = AddSerieDialog;
        var SetStatus;
        (function (SetStatus) {
            SetStatus[SetStatus["Queued"] = 1] = "Queued";
            SetStatus[SetStatus["Finished"] = 2] = "Finished";
            SetStatus[SetStatus["Ready"] = 10000] = "Ready";
            SetStatus[SetStatus["Running"] = 10001] = "Running";
            SetStatus[SetStatus["Paused"] = 10002] = "Paused";
        })(SetStatus = Data.SetStatus || (Data.SetStatus = {}));
    })(Data = RemoteTrainer.Data || (RemoteTrainer.Data = {}));
})(RemoteTrainer || (RemoteTrainer = {}));
//# sourceMappingURL=set.js.map