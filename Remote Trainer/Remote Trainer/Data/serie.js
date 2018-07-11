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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var RemoteTrainer;
(function (RemoteTrainer) {
    var Data;
    (function (Data) {
        var SerieTemplate = /** @class */ (function () {
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
        var Serie = /** @class */ (function (_super) {
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
                return __awaiter(this, void 0, void 0, function () {
                    var series;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, RemoteTrainer.Program.instance.dataProvider.getExerciseSeries(this.exercise)];
                            case 1:
                                series = _a.sent();
                                RemoteTrainer.Program.instance.showDialog(new ExerciseHistoryDialog(this.exercise, series));
                                return [2 /*return*/];
                        }
                    });
                });
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
        var ExerciseHistoryDialog = /** @class */ (function (_super) {
            __extends(ExerciseHistoryDialog, _super);
            function ExerciseHistoryDialog(exercise, series) {
                var _this = _super.call(this) || this;
                _this.dateGrupping = ko.observable(true);
                _this.dateGrupping.subscribe(function (value) { return _this._updateItems(); }, _this);
                _this.name(exercise.name);
                _this.uiContentTemplateName("tmplExerciseHistoryDialog");
                series = series.sort(function (a, b) { return b.uiFinishedOn().getTime() - a.uiFinishedOn().getTime(); });
                _this.m_series = series;
                _this.m_exercise = exercise;
                _this.items = ko.observableArray();
                _this._updateItems();
                return _this;
            }
            ExerciseHistoryDialog.prototype._updateItems = function () {
                var items = this.items();
                items.splice(0);
                if (this.dateGrupping()) {
                    var parentId = "";
                    var prevSerie;
                    var dateItem;
                    for (var _i = 0, _a = this.m_series; _i < _a.length; _i++) {
                        var serie = _a[_i];
                        var item;
                        if (parentId !== serie.parentid) {
                            // new set, new day => create date separator
                            dateItem = new GroupHistoryItem(this.m_exercise, moment(serie.uiFinishedOn()).format("dddd, D.M.YYYY"));
                            items.push(dateItem);
                            parentId = serie.parentid;
                            prevSerie = null;
                        }
                        // if not first serie of a set, add break item
                        if (prevSerie)
                            dateItem.items.splice(0, 0, new BreakHistoryItem(this.m_exercise, Math.round((prevSerie.uiStartedOn().getTime() - serie.uiFinishedOn().getTime()) / 1000)));
                        // add serie item
                        dateItem.items.splice(0, 0, new SerieHistoryItem(this.m_exercise, serie));
                        prevSerie = serie;
                    }
                }
                else {
                    var groupItem = new GroupHistoryItem(this.m_exercise, "Difficulty");
                    for (var _b = 0, _c = this.m_series; _b < _c.length; _b++) {
                        var serie = _c[_b];
                        groupItem.items.splice(0, 0, new SerieHistoryItem(this.m_exercise, serie));
                    }
                    items.push(groupItem);
                }
                this.items.valueHasMutated();
            };
            return ExerciseHistoryDialog;
        }(RemoteTrainer.Dialog));
        Data.ExerciseHistoryDialog = ExerciseHistoryDialog;
        var HistoryItemType;
        (function (HistoryItemType) {
            HistoryItemType[HistoryItemType["Group"] = 0] = "Group";
            HistoryItemType[HistoryItemType["Serie"] = 1] = "Serie";
            HistoryItemType[HistoryItemType["Break"] = 2] = "Break";
        })(HistoryItemType = Data.HistoryItemType || (Data.HistoryItemType = {}));
        var ExerciseHistoryItem = /** @class */ (function () {
            function ExerciseHistoryItem(exercise) {
                this.exercise = exercise;
            }
            return ExerciseHistoryItem;
        }());
        var SerieHistoryItem = /** @class */ (function (_super) {
            __extends(SerieHistoryItem, _super);
            function SerieHistoryItem(exercise, serie) {
                var _this = _super.call(this, exercise) || this;
                _this.type = HistoryItemType.Serie;
                _this.serie = serie;
                return _this;
            }
            return SerieHistoryItem;
        }(ExerciseHistoryItem));
        var BreakHistoryItem = /** @class */ (function (_super) {
            __extends(BreakHistoryItem, _super);
            function BreakHistoryItem(exercise, duration) {
                var _this = _super.call(this, exercise) || this;
                _this.type = HistoryItemType.Break;
                _this.durationLabel = RemoteTrainer.Program.instance.spanToTimeLabel(duration);
                return _this;
            }
            return BreakHistoryItem;
        }(ExerciseHistoryItem));
        var GroupHistoryItem = /** @class */ (function (_super) {
            __extends(GroupHistoryItem, _super);
            function GroupHistoryItem(exercise, label) {
                var _this = _super.call(this, exercise) || this;
                _this.items = [];
                _this.label = label;
                _this.type = HistoryItemType.Group;
                return _this;
            }
            return GroupHistoryItem;
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