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
            }
            SetTemplate.prototype.addSerie = function (serie) {
                this.serieTemplates.push(serie);
                serie.parent = this;
                serie.order = this.serieTemplates.length;
            };
            SetTemplate.prototype.copyTo = function (dst) {
                dst.order = this.order;
            };
            return SetTemplate;
        }());
        Data.SetTemplate = SetTemplate;
        var Set = (function (_super) {
            __extends(Set, _super);
            function Set(template) {
                var _this = _super.call(this) || this;
                template.copyTo(_this);
                _this.exercises = ko.observableArray();
                _this.breaks = [ko.observable(-1)];
                _this.series = ko.observableArray();
                var series = _this.series();
                template.serieTemplates.forEach(function (serieTemplate, index) {
                    var serie = new Data.Serie(serieTemplate);
                    serie.parent = _this;
                    serie.order = index;
                    series.push(serie);
                    if (index > 0) {
                        series[index - 1].next = serie;
                        serie.previous = series[index - 1];
                    }
                    if (_this.exercises().indexOf(serie.exercise) < 0)
                        _this.exercises().push(serie.exercise);
                    _this.breaks.push(ko.observable(-1));
                }, _this);
                _this.series.valueHasMutated();
                _this.uiStatus = ko.computed(function () {
                    var serieStatuses = _this.series().map(function (s) { return s.uiStatus(); });
                    if (serieStatuses.every(function (status) { return status === Data.SerieStatus.Queued; }))
                        return Data.SerieStatus.Queued;
                    else if (serieStatuses.every(function (status) { return status === Data.SerieStatus.Finished; }))
                        return Data.SerieStatus.Finished;
                    else if (serieStatuses.some(function (status) { return status === Data.SerieStatus.Paused; }))
                        return Data.SerieStatus.Paused;
                    return Data.SerieStatus.Running;
                }, _this);
                _this.uiAverageDifficulty = ko.computed(function () {
                    if (_this.uiStatus() === Data.SerieStatus.Finished && _this.series().length > 0) {
                        var total = 0;
                        _this.series().forEach(function (s) { return total += s.difficulty(); });
                        return (total / _this.series().length).toFixed(2);
                    }
                    return "";
                }, _this);
                _this.startedTimeSpan = ko.observable(0);
                _this.finishedTimeSpan = ko.observable(0);
                _this.duration = ko.computed(function () {
                    return Math.round((_this.finishedTimeSpan() - _this.startedTimeSpan()) / 1000);
                }, _this);
                _this.uiDurationLabel = ko.computed(function () {
                    var duration = _this.duration();
                    return RemoteTrainer.Program.instance.spanToTimeLabel(duration);
                }, _this);
                _this.exercising = ko.computed(function () {
                    var total = 0;
                    _this.series().forEach(function (s) { return total += s.uiDuration(); });
                    return total;
                }, _this);
                _this.uiExercisingLabel = ko.computed(function () {
                    var exercising = _this.exercising();
                    return RemoteTrainer.Program.instance.spanToTimeLabel(exercising);
                }, _this);
                _this.m_breakTimer = new RemoteTrainer.GlobalTimer();
                _this.m_breakTimer.fn = _this._onBreakTick.bind(_this);
                return _this;
            }
            Set.prototype._onBreakTick = function (context) {
                var now = Math.round(new Date().getTime() / 1000);
                this.breaks[context.index](now - context.breakStart);
            };
            Set.prototype.startBreak = function (index) {
                this.breaks[index](0);
                // subscribe to global timer
                this.m_breakTimer.context = { index: index, breakStart: Math.round(new Date().getTime() / 1000) };
                RemoteTrainer.Program.instance.GlobalTimer.push(this.m_breakTimer);
            };
            Set.prototype.stopBreak = function (index) {
                // unsubscribe to global timer
                var timerIndex = RemoteTrainer.Program.instance.GlobalTimer.indexOf(this.m_breakTimer);
                if (timerIndex >= 0)
                    RemoteTrainer.Program.instance.GlobalTimer.splice(timerIndex, 1);
            };
            Set.prototype.serieStatusChanged = function (serie, status) {
                var index = this.series().indexOf(serie) + 1;
                if (status === Data.SerieStatus.Finished) {
                    this.startBreak(index);
                    //this.parent.updateCompletionStatus();
                }
                else if (status === Data.SerieStatus.Running)
                    this.stopBreak(index);
            };
            Set.prototype.onContinueClicked = function () {
                if (this.next)
                    this.next.start();
            };
            Set.prototype.start = function () {
                this.parent.activeSet(this);
                this.series()[0].uiStatus(Data.SerieStatus.Ready);
                this.startedTimeSpan(Date.now());
                this.startBreak(0);
            };
            Set.prototype.stop = function () {
                this.finishedTimeSpan(Date.now());
            };
            return Set;
        }(SetTemplate));
        Data.Set = Set;
    })(Data = RemoteTrainer.Data || (RemoteTrainer.Data = {}));
})(RemoteTrainer || (RemoteTrainer = {}));
//# sourceMappingURL=set.js.map