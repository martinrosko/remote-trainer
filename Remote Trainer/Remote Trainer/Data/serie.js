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
                _this.status = ko.observable(SerieStatus.Queued);
                _this.uiStatus = ko.computed(function () {
                    var status = _this.status();
                    var countDownCounter = _this.countDownTimer();
                    if ((status === SerieStatus.Ready || status === SerieStatus.Running) && (_this.parent && _this.parent.parent && _this.parent.parent.status() === Data.WorkoutStatus.Paused))
                        return SerieStatus.Paused;
                    else if (countDownCounter)
                        return SerieStatus.Countdown;
                    return status;
                }, _this);
                _this.uiStatus.subscribe(function (value) {
                    switch (value) {
                        case SerieStatus.Ready:
                            RemoteTrainer.Program.instance.GlobalTimer.push(_this.m_breakTimer);
                            break;
                        case SerieStatus.Queued: {
                            var index = RemoteTrainer.Program.instance.GlobalTimer.indexOf(_this.m_breakTimer);
                            if (index >= 0)
                                RemoteTrainer.Program.instance.GlobalTimer.splice(index, 1);
                            _this.break(0);
                            break;
                        }
                        case SerieStatus.Running: {
                            if (!_this.m_bDoNotCountDown)
                                _this._startCountDown();
                            else
                                _this.m_bDoNotCountDown = false;
                            break;
                        }
                        case SerieStatus.Paused: {
                            // unsubscribe the duration timer
                            var timerIndex = RemoteTrainer.Program.instance.GlobalTimer.indexOf(_this.m_durationTimer);
                            if (timerIndex >= 0)
                                RemoteTrainer.Program.instance.GlobalTimer.splice(timerIndex, 1);
                            _this.status(SerieStatus.Ready);
                            break;
                        }
                    }
                }, _this);
                _this.uiStartedOn = ko.observable();
                _this.uiFinishedOn = ko.observable();
                _this.uiOptionsContentTemplate = ko.observable("tmplOptionsSerieSettings");
                _this.uiOptionsPanelState = ko.observable();
                _this.uiCountDown = ko.observable();
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
                return _this;
            }
            Serie.prototype._onBreakTick = function (context) {
                this.break(this.break() + 1);
            };
            Serie.prototype.onStatusClicked = function () {
                var status = this.uiStatus();
                switch (status) {
                    case SerieStatus.Paused:
                        this.parent.parent.resume();
                        this._startCountDown();
                        break;
                    case SerieStatus.Ready:
                        this._startCountDown();
                        break;
                    case SerieStatus.Countdown:
                        this._stopCountDown();
                        break;
                    case SerieStatus.Running: {
                        this.status(SerieStatus.Finished);
                        this.uiOptionsPanelState(OptionPanelState.Closed);
                        this.uiOptionsContentTemplate("tmplOptionsSerieComplete");
                        this.uiFinishedOn(moment(this.uiStartedOn()).add(this.duration(), "second").toDate());
                        // unsubscribe the duration timer
                        var timerIndex = RemoteTrainer.Program.instance.GlobalTimer.indexOf(this.m_durationTimer);
                        if (timerIndex >= 0)
                            RemoteTrainer.Program.instance.GlobalTimer.splice(timerIndex, 1);
                        if (this.next()) {
                            this.next().status(SerieStatus.Ready);
                        }
                        else {
                            // finish set
                            var set = this.parent;
                            set.status(Data.SetStatus.Finished);
                            if (set.next())
                                set.next().status(Data.SetStatus.Ready);
                        }
                        break;
                    }
                    case SerieStatus.Finished:
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
                }
            };
            Serie.prototype.moveUp = function () {
                if (this.previous()) {
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
                    //if (this.next().uiStatus() === SerieStatus.Ready) {
                    //    // FIXME: create postpone method that  handles breaks and uiStatus in separate method
                    //    this.next().series()[0].uiStatus(SerieStatus.Queued);
                    //    this.start();
                    //}
                }
            };
            Serie.prototype.remove = function () {
                if (confirm("Remove the serie?")) {
                    this.parent.series.splice(this.order() - 1, 1);
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
            Serie.prototype.copyTo = function (dst) {
                _super.prototype.copyTo.call(this, dst);
                dst.uiAmount(this.uiAmount());
                dst.uiReps(this.uiReps());
                dst.uiStartedOn(this.uiStartedOn());
                dst.uiFinishedOn(this.uiFinishedOn());
                dst.duration(this.duration());
                dst.status(this.status());
            };
            Serie.prototype.clone = function () {
                var result = new Serie();
                this.copyTo(result);
                return result;
            };
            Serie.prototype.addClone = function () {
                // FIXME: clone self, not template
                this.parent.addSerie(new Serie(this.clone()));
            };
            Serie.prototype._toggleOptionsPanel = function () {
                this.uiOptionsPanelState(this.uiOptionsPanelState() === OptionPanelState.Closed ? OptionPanelState.Opened : OptionPanelState.Closed);
            };
            Serie.prototype._startCountDown = function () {
                this.uiOptionsPanelState(OptionPanelState.Opened);
                // if not counting down already -> start countdown
                var timerIndex = RemoteTrainer.Program.instance.GlobalTimer.indexOf(this.countDownTimer());
                if (timerIndex < 0) {
                    this.uiCountDown(10);
                    this.uiOptionsContentTemplate("tmplOptionsRunningSerie");
                    this.countDownTimer(new RemoteTrainer.GlobalTimer());
                    this.countDownTimer().fn = this._onCountDownTimer.bind(this);
                    RemoteTrainer.Program.instance.GlobalTimer.push(this.countDownTimer());
                }
            };
            Serie.prototype._stopCountDown = function () {
                if (this.uiCountDown() > 0)
                    this.uiCountDown(0);
                // unsubscribe countdown timer
                var timerIndex = RemoteTrainer.Program.instance.GlobalTimer.indexOf(this.countDownTimer());
                if (timerIndex >= 0) {
                    RemoteTrainer.Program.instance.GlobalTimer.splice(timerIndex, 1);
                    this.countDownTimer(null);
                }
                // stop current break;
                var breakTimerIndex = RemoteTrainer.Program.instance.GlobalTimer.indexOf(this.m_breakTimer);
                if (breakTimerIndex >= 0)
                    RemoteTrainer.Program.instance.GlobalTimer.splice(breakTimerIndex, 1);
                this.m_bDoNotCountDown = true;
                this.status(SerieStatus.Running);
                if (this.order() === 1)
                    this.parent.status(Data.SetStatus.Running);
                var now = new Date();
                this.uiStartedOn(now);
                // subscribe duration timer to global timer
                this.m_durationTimer = new RemoteTrainer.GlobalTimer();
                this.m_durationTimer.fn = this._onDurationTimer.bind(this);
                RemoteTrainer.Program.instance.GlobalTimer.push(this.m_durationTimer);
            };
            Serie.prototype._onCountDownTimer = function (context) {
                this.uiCountDown(this.uiCountDown() - 1);
                if (this.uiCountDown() == 0)
                    this._stopCountDown();
            };
            Serie.prototype._onDurationTimer = function (context) {
                this.duration(this.duration() + 1);
            };
            Serie.difficulties = ["Very Easy", "Easy", "Medium", "Hard", "Very Hard"];
            return Serie;
        }(SerieTemplate));
        Data.Serie = Serie;
        var SerieStatus;
        (function (SerieStatus) {
            SerieStatus[SerieStatus["Queued"] = 1] = "Queued";
            SerieStatus[SerieStatus["Finished"] = 2] = "Finished";
            SerieStatus[SerieStatus["Ready"] = 10000] = "Ready";
            SerieStatus[SerieStatus["Running"] = 10001] = "Running";
            SerieStatus[SerieStatus["Paused"] = 10002] = "Paused";
            SerieStatus[SerieStatus["Countdown"] = 10003] = "Countdown";
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