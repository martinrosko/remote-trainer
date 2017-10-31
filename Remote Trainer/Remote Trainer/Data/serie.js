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
                template.copyTo(_this);
                _this.uiAmount = ko.observable(template.amount);
                _this.uiReps = ko.observable(template.reps);
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
                _this.uiDuration = ko.computed(function () {
                    var started = _this.uiStartedOn();
                    var finished = _this.uiFinishedOn();
                    if (started && finished) {
                        return Math.round((finished.getTime() - started.getTime()) / 1000);
                    }
                    return -1;
                });
                return _this;
            }
            Serie.prototype.activate = function () {
                this.uiStatus(SerieStatus.Ready);
            };
            Serie.prototype.start = function () {
                this.uiStatus(SerieStatus.Running);
            };
            Serie.prototype.onStatusClicked = function () {
                var _this = this;
                var status = this.uiStatus();
                switch (status) {
                    case SerieStatus.Queued:
                        this.uiOptionsPanelState(this.uiOptionsPanelState() === OptionPanelState.Closing ? OptionPanelState.Opening : OptionPanelState.Closing);
                        this.uiOptionsContentTemplate("tmplOptionsSerieSettings");
                        break;
                    case SerieStatus.Ready:
                        this.uiStatus(SerieStatus.Running);
                        this.uiOptionsContentTemplate("tmplOptionsRunningSerie");
                        this.uiOptionsPanelState(OptionPanelState.Opening);
                        var now = new Date();
                        this.uiStartedOn(now);
                        this.uiFinishedOn(now);
                        this.m_timer = window.setInterval(function () {
                            _this.uiFinishedOn(new Date());
                        }, 1000);
                        break;
                    case SerieStatus.Running:
                        this.uiStatus(SerieStatus.Finished);
                        this.uiOptionsPanelState(OptionPanelState.Closing);
                        this.uiOptionsContentTemplate("tmplOptionsSerieComplete");
                        this.uiFinishedOn(new Date());
                        window.clearInterval(this.m_timer);
                        if (this.next) {
                            this.next.uiStatus(SerieStatus.Ready);
                        }
                        else {
                            // finish set
                        }
                        break;
                    case SerieStatus.Finished:
                        this.uiOptionsPanelState(this.uiOptionsPanelState() === OptionPanelState.Closing ? OptionPanelState.Opening : OptionPanelState.Closing);
                        break;
                }
            };
            return Serie;
        }(SerieTemplate));
        Serie.difficulties = ["Very Easy", "Easy", "Medium", "Hard", "Very Hard"];
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