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
        var SerieTemplate = (function () {
            function SerieTemplate(exercise, reps, amount) {
                this.exercise = exercise;
                this.reps = reps;
                this.amount = amount;
                this.order = ko.observable();
                if (RemoteTrainer.DEMODATA)
                    this.id = Math.floor(Math.random() * Math.floor(1000)).toString();
            }
            SerieTemplate.prototype.copyTo = function (dst) {
                dst.id = this.id;
                dst.exercise = this.exercise;
                dst.order(this.order());
                dst.amount = this.amount;
                dst.reps = this.reps;
            };
            SerieTemplate.prototype.clone = function () {
                var result = new SerieTemplate();
                this.copyTo(result);
                return result;
            };
            return SerieTemplate;
        }());
        Data.SerieTemplate = SerieTemplate;
        var Serie = (function (_super) {
            __extends(Serie, _super);
            function Serie(template) {
                var _this = _super.call(this) || this;
                if (template)
                    template.copyTo(_this);
                _this.uiAmount = ko.observable(template ? template.amount : 0);
                _this.uiAmountHasFocus = ko.observable(false);
                _this.uiAmountHasFocus.subscribe(function (hasFocus) {
                    // FIXME: validate value
                }, _this);
                _this.uiReps = ko.observable(template ? template.reps : 0);
                _this.uiRepsHasFocus = ko.observable(false);
                _this.uiRepsHasFocus.subscribe(function (hasFocus) {
                    // FIXME: validate value
                }, _this);
                _this.uiDifficulty = ko.observable(Serie.difficulties[3]);
                _this.countDownTimer = ko.observable();
                _this.countDownTimer.subscribe(function (value) {
                    if (value) {
                        _this.uiCountDown(10); // FIXME: take value from db
                        _this.uiOptionsContentTemplate("tmplOptionsRunningSerie");
                        _this.uiOptionsPanelState(OptionPanelState.Opened);
                    }
                    else {
                        _this.uiCountDown(null);
                        _this.uiOptionsPanelState(OptionPanelState.Closed);
                    }
                });
                _this.uiCountDown = ko.observable();
                // if countdown reached zero -> start or resume exercise
                _this.uiCountDown.subscribe(function (value) {
                    if (value === 0) {
                        // unsubscribe countdown timer
                        if (_this.countDownTimer() && RemoteTrainer.Program.instance.clearTimer(_this.countDownTimer()))
                            _this.countDownTimer(undefined);
                        // if exercise did not start yet start it. otherwise just resume
                        if (!_this.uiStartedOn()) {
                            // stop current break;
                            RemoteTrainer.Program.instance.clearTimer(_this.m_breakTimer);
                            // first exercise of the set -> set the sets status to running
                            if (_this.order() === 1)
                                _this.parent.status(Data.SetStatus.Running);
                            _this.uiStartedOn(new Date());
                        }
                        _this.m_durationTimer = new RemoteTrainer.GlobalTimer();
                        _this.m_durationTimer.fn = _this._onDurationTimer.bind(_this);
                        RemoteTrainer.Program.instance.GlobalTimer.push(_this.m_durationTimer);
                        _this.status(SerieStatus.Running);
                        _this.uiOptionsPanelState(OptionPanelState.Opened);
                    }
                }, _this);
                _this.status = ko.observable(SerieStatus.Queued);
                _this.status.subscribe(function (value) {
                    switch (value) {
                        case SerieStatus.Ready:
                            RemoteTrainer.Program.instance.GlobalTimer.push(_this.m_breakTimer);
                            break;
                        case SerieStatus.Queued: {
                            RemoteTrainer.Program.instance.clearTimer(_this.m_breakTimer);
                            _this.break(0);
                            break;
                        }
                        case SerieStatus.Paused:
                            RemoteTrainer.Program.instance.clearTimer(_this.m_durationTimer);
                    }
                }, _this);
                _this.uiButtonImage = ko.computed(function () {
                    var status = _this.status();
                    if (status === SerieStatus.Running)
                        return "url(\'Images/serieStatusRunning.png\')";
                    else if (status === SerieStatus.Finished)
                        return "url(\'Images/serieStatusFinished.png\')";
                    return "url(\'Images/serieStatusReady.png\')";
                }, _this);
                _this.uiStartedOn = ko.observable();
                _this.uiFinishedOn = ko.observable();
                _this.uiOptionsContentTemplate = ko.observable("tmplOptionsQueuedSerie");
                _this.uiOptionsPanelState = ko.observable();
                _this.duration = ko.observable(0);
                _this.uiDuration = ko.computed(function () {
                    var duration = _this.duration();
                    return duration >= 0 ? RemoteTrainer.Program.instance.spanToTimeLabel(duration) : "";
                });
                _this.difficulty = ko.computed(function () {
                    var diffLabel = _this.uiDifficulty();
                    return Serie.difficulties.indexOf(diffLabel) + 1;
                }, _this);
                _this.break = ko.observable(0);
                _this.uiBreakLabel = ko.computed(function () {
                    var b = _this.break();
                    return RemoteTrainer.Program.instance.spanToTimeLabel(b);
                });
                _this.m_breakTimer = new RemoteTrainer.GlobalTimer();
                _this.m_breakTimer.fn = _this._onBreakTick.bind(_this);
                _this.next = ko.observable();
                _this.previous = ko.observable();
                _this.canMoveUp = ko.computed(function () {
                    var previous = _this.previous();
                    return (previous && (previous.status() === SerieStatus.Queued || previous.status() === SerieStatus.Ready));
                });
                return _this;
            }
            Serie.prototype.pause = function () {
                if (this.countDownTimer() && RemoteTrainer.Program.instance.clearTimer(this.countDownTimer()))
                    this.countDownTimer(undefined);
                if (this.status() === SerieStatus.Running)
                    this.status(SerieStatus.Paused);
            };
            Serie.prototype._onBreakTick = function (context) {
                this.break(this.break() + 1);
            };
            Serie.prototype.showExerciseHistory = function () {
                var _this = this;
                RemoteTrainer.Program.instance.dataProvider.getExerciseSeries(this.exercise, function (series) { return RemoteTrainer.Program.instance.showDialog(new ExerciseHistoryDialog(_this.exercise, series)); });
                //var series: Serie[] = [];
                //var serie = new Serie();
                //serie.uiAmount(50);
                //serie.uiReps(10);
                //serie.uiStartedOn(new Date(2018, 1, 1, 10, 0, 0));
                //serie.uiFinishedOn(new Date(2018, 1, 1, 10, 1, 0));
                //serie.duration(60);
                //serie.uiDifficulty(Serie.difficulties[3]);
                //serie.order(1);
                //serie.parentid = "1";
                //series.push(serie);
                //serie = new Serie();
                //serie.uiAmount(50);
                //serie.uiReps(10);
                //serie.uiStartedOn(new Date(2018, 1, 1, 10, 2, 30));
                //serie.uiFinishedOn(new Date(2018, 1, 1, 10, 3, 40));
                //serie.duration(70);
                //serie.uiDifficulty(Serie.difficulties[3]);
                //serie.order(2);
                //serie.parentid = "1";
                //series.push(serie);
                //serie = new Serie();
                //serie.uiAmount(50);
                //serie.uiReps(8);
                //serie.uiStartedOn(new Date(2018, 1, 1, 10, 5, 0));
                //serie.uiFinishedOn(new Date(2018, 1, 1, 10, 6, 20));
                //serie.duration(80);
                //serie.uiDifficulty(Serie.difficulties[4]);
                //serie.order(3);
                //serie.parentid = "1";
                //series.push(serie);
                //serie = new Serie();
                //serie.uiAmount(50);
                //serie.uiReps(10);
                //serie.uiStartedOn(new Date(2018, 1, 8, 10, 0, 0));
                //serie.uiFinishedOn(new Date(2018, 1, 8, 10, 1, 0));
                //serie.duration(60);
                //serie.uiDifficulty(Serie.difficulties[3]);
                //serie.order(1);
                //serie.parentid = "2";
                //series.push(serie);
                //serie = new Serie();
                //serie.uiAmount(50);
                //serie.uiReps(10);
                //serie.uiStartedOn(new Date(2018, 1, 8, 10, 2, 30));
                //serie.uiFinishedOn(new Date(2018, 1, 8, 10, 3, 40));
                //serie.duration(70);
                //serie.uiDifficulty(Serie.difficulties[3]);
                //serie.order(2);
                //serie.parentid = "2";
                //series.push(serie);
                //serie = new Serie();
                //serie.uiAmount(50);
                //serie.uiReps(9);
                //serie.uiStartedOn(new Date(2018, 1, 8, 10, 5, 0));
                //serie.uiFinishedOn(new Date(2018, 1, 8, 10, 6, 20));
                //serie.duration(80);
                //serie.uiDifficulty(Serie.difficulties[3]);
                //serie.order(3);
                //serie.parentid = "2";
                //series.push(serie);
                //Program.instance.showDialog(new ExerciseHistoryDialog(this.exercise, series))
            };
            Serie.prototype.onStatusClicked = function () {
                var status = this.status();
                switch (status) {
                    case SerieStatus.Ready:
                    case SerieStatus.Paused:
                        this.parent.resume(true);
                        this._startCountDown();
                        break;
                    case SerieStatus.Running: {
                        this.status(SerieStatus.Finished);
                        this.uiOptionsPanelState(OptionPanelState.Closed);
                        this.uiOptionsContentTemplate("tmplOptionsSerieComplete");
                        this.uiFinishedOn(new Date());
                        // unsubscribe the duration timer
                        RemoteTrainer.Program.instance.clearTimer(this.m_durationTimer);
                        if (this.next()) {
                            this.next().status(SerieStatus.Ready);
                        }
                        else {
                            // finish set
                            this.parent.status(Data.SetStatus.Finished);
                            if (this.parent.next())
                                this.parent.next().status(Data.SetStatus.Ready);
                        }
                        break;
                    }
                    case SerieStatus.Finished:
                        this.uiOptionsContentTemplate("tmplOptionsSerieComplete");
                        this._toggleOptionsPanel();
                        break;
                }
            };
            Serie.prototype.onAmountClicked = function () {
                this.uiAmountHasFocus(true);
            };
            Serie.prototype.onRepsClicked = function () {
                this.uiRepsHasFocus(true);
            };
            Serie.prototype.moveDown = function () {
                if (this.next()) {
                    var series = this.parent.series();
                    series.splice(this.order() - 1, 1);
                    series.splice(this.order(), 0, this);
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
                    this.parent.series.valueHasMutated();
                    if (this.status() === SerieStatus.Ready) {
                        var currentBreak = this.break();
                        this.status(SerieStatus.Queued);
                        this.previous().status(SerieStatus.Ready);
                        this.previous().break(currentBreak);
                    }
                }
            };
            Serie.prototype.moveUp = function () {
                if (this.canMoveUp()) {
                    var series = this.parent.series();
                    series.splice(this.order() - 1, 1);
                    series.splice(this.order() - 2, 0, this);
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
                    this.parent.series.valueHasMutated();
                    if (this.next().status() === SerieStatus.Ready) {
                        var currentBreak = this.next().break();
                        this.next().status(SerieStatus.Queued);
                        this.status(SerieStatus.Ready);
                        this.break(currentBreak);
                    }
                }
            };
            Serie.prototype.remove = function (bAskConfirm) {
                var _this = this;
                if (bAskConfirm === void 0) { bAskConfirm = true; }
                if (bAskConfirm) {
                    var confirm_1 = new RemoteTrainer.MessageBox("Do you want to remove only this serie or whole exercise?", ["Just the Serie", "Whole Exercise"], "Cancel");
                    confirm_1.closed.add(this, function (sender, e) {
                        if (e.button === 0) {
                            _this._removeSerie();
                        }
                        else if (e.button === 1) {
                            var exercise = _this.exercise;
                            var series = _this.parent.series();
                            for (var i = series.length - 1; i >= 0; i--) {
                                if (series[i].exercise === exercise && (series[i].status() === SerieStatus.Ready || series[i].status() === SerieStatus.Queued))
                                    series[i].remove(false);
                            }
                        }
                    });
                    confirm_1.show();
                }
                else {
                    this._removeSerie();
                }
            };
            Serie.prototype._removeSerie = function () {
                this.parent.series.splice(this.order() - 1, 1);
                if (this.id && !this.parent.removedSeries.containsKey(this.id))
                    this.parent.removedSeries.set(this.id, this);
                if (this.previous())
                    this.previous().next(this.next());
                if (this.next())
                    this.next().previous(this.previous());
                var next = this.next();
                while (next) {
                    next.order(next.order() - 1);
                    next = next.next();
                }
            };
            Serie.prototype.copyTo = function (dst, bAsTemplate) {
                if (bAsTemplate === void 0) { bAsTemplate = false; }
                _super.prototype.copyTo.call(this, dst);
                if (dst instanceof Serie) {
                    dst.uiAmount(this.uiAmount());
                    dst.uiReps(this.uiReps());
                    dst.uiStartedOn(this.uiStartedOn());
                    dst.uiFinishedOn(this.uiFinishedOn());
                    dst.duration(this.duration());
                    dst.status(this.status());
                    dst.break(this.break());
                }
            };
            Serie.prototype.clone = function () {
                var result = new Serie();
                this.copyTo(result);
                return result;
            };
            Serie.prototype.addClone = function () {
                var clone = new Serie();
                this.copyTo(clone);
                this.parent.addSerie(clone);
            };
            Serie.prototype._toggleOptionsPanel = function () {
                this.uiOptionsPanelState(this.uiOptionsPanelState() === OptionPanelState.Closed ? OptionPanelState.Opened : OptionPanelState.Closed);
            };
            Serie.prototype._startCountDown = function () {
                this.uiOptionsPanelState(OptionPanelState.Opened);
                // if not counting down already -> start countdown
                if (!this.countDownTimer()) {
                    this.countDownTimer(new RemoteTrainer.GlobalTimer());
                    this.countDownTimer().fn = this._onCountDownTimer.bind(this);
                    RemoteTrainer.Program.instance.GlobalTimer.push(this.countDownTimer());
                }
                else {
                    // if already in countdown skip countdown and run immediately
                    this.uiCountDown(0);
                }
            };
            Serie.prototype._onCountDownTimer = function (context) {
                this.uiCountDown(this.uiCountDown() - 1);
            };
            Serie.prototype._onDurationTimer = function (context) {
                this.duration(this.duration() + 1);
            };
            Serie.difficulties = ["Very Easy", "Easy", "Medium", "Hard", "Very Hard"];
            return Serie;
        }(SerieTemplate));
        Data.Serie = Serie;
        var ExerciseHistoryDialog = (function (_super) {
            __extends(ExerciseHistoryDialog, _super);
            function ExerciseHistoryDialog(exercise, series) {
                var _this = _super.call(this) || this;
                _this.name(exercise.name);
                _this.uiContentTemplateName("tmplExerciseHistoryDialog");
                series = series.sort(function (a, b) { return b.uiFinishedOn().getTime() - a.uiFinishedOn().getTime(); });
                _this.items = [];
                var parentId = "";
                var prevSerie;
                while (series.length > 0) {
                    var item;
                    var serie = series.pop();
                    if (parentId !== serie.parentid) {
                        // new set, new day => create date separator
                        _this.items.push(new DateHistoryItem(exercise, serie.uiFinishedOn()));
                        parentId = serie.parentid;
                        prevSerie = null;
                    }
                    // if not first serie of a set, add break item
                    if (prevSerie)
                        _this.items.push(new BreakHistoryItem(exercise, Math.round((serie.uiStartedOn().getTime() - prevSerie.uiFinishedOn().getTime()) / 1000)));
                    // add serie item
                    _this.items.push(new SerieHistoryItem(exercise, serie));
                    prevSerie = serie;
                }
                return _this;
            }
            return ExerciseHistoryDialog;
        }(RemoteTrainer.Dialog));
        Data.ExerciseHistoryDialog = ExerciseHistoryDialog;
        var HistoryItemType;
        (function (HistoryItemType) {
            HistoryItemType[HistoryItemType["Date"] = 0] = "Date";
            HistoryItemType[HistoryItemType["Serie"] = 1] = "Serie";
            HistoryItemType[HistoryItemType["Break"] = 2] = "Break";
        })(HistoryItemType = Data.HistoryItemType || (Data.HistoryItemType = {}));
        var ExerciseHistoryItem = (function () {
            function ExerciseHistoryItem(exercise) {
                this.exercise = exercise;
            }
            return ExerciseHistoryItem;
        }());
        var SerieHistoryItem = (function (_super) {
            __extends(SerieHistoryItem, _super);
            function SerieHistoryItem(exercise, serie) {
                var _this = _super.call(this, exercise) || this;
                _this.type = HistoryItemType.Serie;
                _this.serie = serie;
                return _this;
            }
            return SerieHistoryItem;
        }(ExerciseHistoryItem));
        var BreakHistoryItem = (function (_super) {
            __extends(BreakHistoryItem, _super);
            function BreakHistoryItem(exercise, duration) {
                var _this = _super.call(this, exercise) || this;
                _this.type = HistoryItemType.Break;
                _this.durationLabel = RemoteTrainer.Program.instance.spanToTimeLabel(duration);
                return _this;
            }
            return BreakHistoryItem;
        }(ExerciseHistoryItem));
        var DateHistoryItem = (function (_super) {
            __extends(DateHistoryItem, _super);
            function DateHistoryItem(exercise, date) {
                var _this = _super.call(this, exercise) || this;
                _this.type = HistoryItemType.Date;
                _this.dateLabel = moment(date).format("dddd, D.M.YYYY");
                return _this;
            }
            return DateHistoryItem;
        }(ExerciseHistoryItem));
        var SerieStatus;
        (function (SerieStatus) {
            SerieStatus[SerieStatus["Queued"] = 1] = "Queued";
            SerieStatus[SerieStatus["Finished"] = 2] = "Finished";
            SerieStatus[SerieStatus["Ready"] = 10000] = "Ready";
            SerieStatus[SerieStatus["Running"] = 10001] = "Running";
            SerieStatus[SerieStatus["Paused"] = 10002] = "Paused";
        })(SerieStatus = Data.SerieStatus || (Data.SerieStatus = {}));
        var OptionPanelState;
        (function (OptionPanelState) {
            OptionPanelState[OptionPanelState["Closing"] = 0] = "Closing";
            OptionPanelState[OptionPanelState["Closed"] = 1] = "Closed";
            OptionPanelState[OptionPanelState["Opening"] = 2] = "Opening";
            OptionPanelState[OptionPanelState["Opened"] = 3] = "Opened";
        })(OptionPanelState = Data.OptionPanelState || (Data.OptionPanelState = {}));
    })(Data = RemoteTrainer.Data || (RemoteTrainer.Data = {}));
})(RemoteTrainer || (RemoteTrainer = {}));
//# sourceMappingURL=serie.js.map