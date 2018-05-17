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
                _this.previous = ko.observable();
                _this.next = ko.observable();
                _this.breaks = [ko.observable(-1)];
                _this.activeBreakIndex = ko.observable(-1);
                _this.exercises = ko.observableArray();
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
                    _this.breaks.push(ko.observable(-1));
                    if (!_this.exercises().contains(serie.exercise))
                        _this.exercises().push(serie.exercise);
                }, _this);
                _this.series.valueHasMutated();
                return _this;
            }
            Set.prototype.serieStatusChanged = function (serie, status) {
                var index = this.series().indexOf(serie);
                if (index === 0 && status === Data.SerieStatus.Ready) {
                    this.startBreak(0);
                }
                if (status === Data.SerieStatus.Finished) {
                    this.startBreak(index + 1);
                    this.parent.updateCompletionStatus();
                }
                else if (status === Data.SerieStatus.Running)
                    this.stopBreak(index + 1);
            };
            Set.prototype.startBreak = function (index) {
                this.breaks[index](0);
                this.activeBreakIndex(index);
                this.m_timer = window.setInterval(function (breakStart) {
                    var now = Math.round(new Date().getTime() / 1000);
                    this.breaks[index](now - breakStart);
                }.bind(this), 1000, Math.round(new Date().getTime() / 1000));
            };
            Set.prototype.stopBreak = function (index) {
                this.activeBreakIndex(-1);
                if (this.m_timer) {
                    window.clearInterval(this.m_timer);
                    this.m_timer = 0;
                }
            };
            Set.prototype.start = function () {
                this.series()[0].activate();
            };
            Set.prototype.complete = function () {
            };
            return Set;
        }(SetTemplate));
        Data.Set = Set;
        var SetStatus;
        (function (SetStatus) {
            SetStatus[SetStatus["Ready"] = 0] = "Ready";
            SetStatus[SetStatus["Running"] = 1] = "Running";
            SetStatus[SetStatus["Finished"] = 2] = "Finished";
            SetStatus[SetStatus["Pending"] = 3] = "Pending";
        })(SetStatus = Data.SetStatus || (Data.SetStatus = {}));
    })(Data = RemoteTrainer.Data || (RemoteTrainer.Data = {}));
})(RemoteTrainer || (RemoteTrainer = {}));
//# sourceMappingURL=set.js.map