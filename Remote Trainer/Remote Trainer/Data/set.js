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
        var SetTemplate = /** @class */ (function () {
            function SetTemplate() {
                this.serieTemplates = [];
                this.order = ko.observable();
                if (RemoteTrainer.DEMODATA)
                    this.id = Resco.createGuid(); //Math.floor(Math.random() * Math.floor(1000)).toString();
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
        var Set = /** @class */ (function (_super) {
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
                            RemoteTrainer.Program.instance.clearTimer(_this.m_runningTimer);
                            if (_this.series().length > 0)
                                _this.series()[0].status(Data.SerieStatus.Queued);
                            break;
                        case SetStatus.Finished:
                            RemoteTrainer.Program.instance.clearTimer(_this.m_runningTimer);
                            _this.uiOptionsPanelState(Data.OptionPanelState.Closed);
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
                var activeSerie = this.series().firstOrDefault(function (serie) { return serie.status() === Data.SerieStatus.Running; });
                if (activeSerie) {
                    activeSerie.pause();
                    if (this.status() === SetStatus.Running)
                        this.status(SetStatus.Paused);
                }
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
                    if (this.status() === SetStatus.Ready) {
                        var currentBreak = this.series().length > 0 ? this.series()[0].break() : 0;
                        this.status(SetStatus.Queued);
                        if (this.previous().series().length > 0 && currentBreak > 0) {
                            this.previous().status(SetStatus.Ready);
                            this.previous().series()[0].break(currentBreak);
                        }
                    }
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
                    if (this.next().status() === SetStatus.Ready) {
                        var currentBreak = this.next().series().length > 0 ? this.next().series()[0].break() : 0;
                        this.next().status(SetStatus.Queued);
                        if (this.series().length > 0 && currentBreak > 0) {
                            this.status(SetStatus.Ready);
                            this.series()[0].break(currentBreak);
                        }
                    }
                }
            };
            Set.prototype.onSortUpdated = function (event, droppedSerie) {
                var series = this.series();
                series.forEach(function (serie, index) {
                    serie.order(index + 1);
                    serie.previous(index > 0 ? series[index - 1] : null);
                    serie.next(index < series.length - 1 ? series[index + 1] : null);
                });
            };
            Set.prototype.remove = function (bAskConfirm) {
                var _this = this;
                if (bAskConfirm === void 0) { bAskConfirm = true; }
                if (bAskConfirm) {
                    var confirm_1 = new RemoteTrainer.MessageBox("Do you want to remove the entire set?", ["Yes"], "No");
                    confirm_1.closed.add(this, function (sender, e) { return _this._removeSet(); });
                    confirm_1.show();
                }
                else {
                    this._removeSet();
                }
            };
            Set.prototype._removeSet = function () {
                this.parent.sets.splice(this.order() - 1, 1);
                if (this.id && !this.parent.removedSets.containsKey(this.id))
                    this.parent.removedSets.set(this.id, this);
                this.series().forEach(function (serie) { return serie.remove(false); }, this);
                if (this.previous())
                    this.previous().next(this.next());
                var next = this.next();
                if (next) {
                    next.previous(this.previous());
                    if (this.status() === SetStatus.Ready) {
                        next.status(SetStatus.Ready);
                        this.parent.displayedSet(next);
                    }
                }
                while (next) {
                    next.order(next.order() - 1);
                    next = next.next();
                }
            };
            Set.prototype.copyTo = function (dst) {
                _super.prototype.copyTo.call(this, dst);
                dst.duration(this.duration());
                dst.series([]);
                dst.next(this.next());
                dst.previous(this.previous());
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
                set.pause();
                var clonedSet = set.clone();
                var dialog = new ModifySetDialog(clonedSet);
                dialog.closing.add(this, function (sender, e) {
                    if (clonedSet.series().length === 0) {
                        var alert_1 = new RemoteTrainer.MessageBox("Set cannot be empty");
                        alert_1.show();
                        e.cancel = true;
                    }
                });
                dialog.closed.add(this, function (sender, e) {
                    if (dialog.dialogResult) {
                        var series = set.series();
                        series.forEach(function (oldSerie) {
                            // if there is not a serie with old id in new set of series, add it to deleted series, it must be removed from
                            if (!clonedSet.series().firstOrDefault(function (clonedSerie) { return clonedSerie.id === oldSerie.id; }) && oldSerie.id && !set.removedSeries.containsKey(oldSerie.id))
                                set.removedSeries.set(oldSerie.id, oldSerie);
                        }, _this);
                        clonedSet.copyTo(set);
                        series = set.series();
                        set.uiOptionsPanelState(Data.OptionPanelState.Closed);
                        // if we removed all active series. then complete this st and ready the next one
                        if (set.series()[set.series().length - 1].status() === Data.SerieStatus.Finished) {
                            set.status(SetStatus.Finished);
                            if (set.next())
                                set.next().status(SetStatus.Ready);
                        }
                        // if this is running set and we removed serie that was ready, make ready first queued serie
                        if (set.status() !== SetStatus.Finished && set.status() !== SetStatus.Queued && !series.some(function (s) { return s.status() === Data.SerieStatus.Ready; })) {
                            for (var i = 0; i < series.length; i++) {
                                if (series[i].status() === Data.SerieStatus.Queued)
                                    series[i].status(Data.SerieStatus.Ready);
                            }
                        }
                    }
                });
                RemoteTrainer.Program.instance.showDialog(dialog);
            };
            Set.prototype.showAddSerieDialog = function () {
                var _this = this;
                var dialog = new AddSerieDialog(RemoteTrainer.Program.instance.dataProvider.categories, RemoteTrainer.Program.instance.dataProvider.exercises);
                dialog.closed.add(this, function (sender, e) {
                    if (dialog.dialogResult) {
                        var serie = new Data.Serie();
                        serie.exercise = dialog.selectedExercise();
                        serie.amount = 0;
                        serie.reps = 0;
                        _this.addSerie(serie);
                    }
                });
                RemoteTrainer.Program.instance.showDialog(dialog);
            };
            return Set;
        }(SetTemplate));
        Data.Set = Set;
        var ModifySetDialog = /** @class */ (function (_super) {
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
        var AddSerieDialog = /** @class */ (function (_super) {
            __extends(AddSerieDialog, _super);
            function AddSerieDialog(categories, exercises) {
                var _this = _super.call(this) || this;
                _this.name("Add Serie");
                _this.uiContentTemplateName("tmplAddSerieDialog");
                _this.selectBoxCategory = new Resco.Controls.SelectBox();
                _this.selectBoxCategory.items(categories);
                _this.selectBoxCategory.itemLabel("name");
                _this.selectBoxCategory.selectText("Please select a category...");
                _this.selectBoxCategory.selecteItemChanged.add(_this, function (sender, args) {
                    _this.selectedCategory(args.item);
                    if (args.item)
                        _this.selectBoxExercise.items(_this.m_exercises.filter(function (exc) { return exc.category === args.item; }));
                    else
                        _this.selectBoxExercise.items([]);
                    _this.selectBoxExercise.selectedItem(null);
                    _this.selectBoxExercise.isExpanded(false);
                    _this.selectedExercise(null);
                });
                _this.selectBoxExercise = new Resco.Controls.SelectBox();
                _this.selectBoxExercise.itemLabel("name");
                _this.selectBoxExercise.selectText("Please select an exercise...");
                _this.selectBoxExercise.selecteItemChanged.add(_this, function (sender, args) {
                    _this.selectedExercise(args.item);
                });
                _this.categories = categories;
                _this.m_exercises = exercises;
                _this.selectedCategory = ko.observable();
                _this.selectedExercise = ko.observable();
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