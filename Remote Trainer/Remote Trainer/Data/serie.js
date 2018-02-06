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
            }
            SerieTemplate.prototype.copyTo = function (dst) {
                dst.exercise = this.exercise;
                dst.order = this.order;
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
                _this.uiStatus = ko.observable(SerieStatus.Queued);
                _this.uiStatus.subscribe(function (value) {
                    if (_this.parent)
                        _this.parent.serieStatusChanged(_this, value);
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
                return _this;
            }
            Serie.prototype.activate = function () {
                this.uiStatus(SerieStatus.Ready);
            };
            Serie.prototype.start = function () {
                this.uiStatus(SerieStatus.Running);
            };
            Serie.prototype.onStatusClicked = function () {
                var status = this.uiStatus();
                switch (status) {
                    case SerieStatus.Queued:
                        //this.uiOptionsPanelState(OptionPanelState.Closed);
                        //this.uiOptionsContentTemplate("tmplOptionsSerieSettings");
                        break;
                    case SerieStatus.Ready: {
                        this.uiOptionsPanelState(OptionPanelState.Opened);
                        // if not counting down already -> start countdown
                        var timerIndex = RemoteTrainer.Program.instance.GlobalTimer.indexOf(this.m_countDownTimer);
                        if (timerIndex < 0) {
                            this.uiCountDown(10);
                            this.uiOptionsContentTemplate("tmplOptionsRunningSerie");
                            this.m_countDownTimer = new RemoteTrainer.GlobalTimer();
                            this.m_countDownTimer.fn = this._onCountDownTimer.bind(this);
                            RemoteTrainer.Program.instance.GlobalTimer.push(this.m_countDownTimer);
                        }
                        else {
                            // otherwise skip countdown and start exercising immediately (second click on 'start' button)
                            this._stopCountDown();
                        }
                        break;
                    }
                    case SerieStatus.Running: {
                        this.uiStatus(SerieStatus.Finished);
                        this.uiOptionsPanelState(OptionPanelState.Closed);
                        this.uiOptionsContentTemplate("tmplOptionsSerieComplete");
                        this.uiFinishedOn(moment(this.uiStartedOn()).add(this.duration(), "second").toDate());
                        // unsubscribe the duration timer
                        var timerIndex = RemoteTrainer.Program.instance.GlobalTimer.indexOf(this.m_durationTimer);
                        if (timerIndex >= 0)
                            RemoteTrainer.Program.instance.GlobalTimer.splice(timerIndex, 1);
                        if (this.next) {
                            this.next.uiStatus(SerieStatus.Ready);
                        }
                        else {
                            // finish set
                            var set = this.parent;
                            set.stop();
                            if (set.next)
                                set.next.start();
                            else
                                set.parent.stop();
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
            Serie.prototype._toggleOptionsPanel = function () {
                this.uiOptionsPanelState(this.uiOptionsPanelState() === OptionPanelState.Closed ? OptionPanelState.Opened : OptionPanelState.Closed);
            };
            Serie.prototype._stopCountDown = function () {
                if (this.uiCountDown() > 0)
                    this.uiCountDown(0);
                // unsubscribe countdown timer
                var timerIndex = RemoteTrainer.Program.instance.GlobalTimer.indexOf(this.m_countDownTimer);
                if (timerIndex >= 0)
                    RemoteTrainer.Program.instance.GlobalTimer.splice(timerIndex, 1);
                // start the exercise
                this.uiStatus(SerieStatus.Running);
                var now = new Date();
                this.uiStartedOn(now);
                this.duration(0);
                // stop current break;
                this.parent.stopBreak(this.order);
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