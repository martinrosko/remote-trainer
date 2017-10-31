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
                _this.breaks = [];
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
                }, _this);
                _this.series.valueHasMutated();
                return _this;
            }
            Set.prototype.startBreak = function (index) {
                this.breaks[index](0);
                this.m_timer = window.setInterval(function (breakStart) {
                    var now = Math.round(new Date().getTime() / 1000);
                    this.breaks[index](now - breakStart);
                }.bind(this), 1000, Math.round(new Date().getTime() / 1000));
            };
            Set.prototype.stopBreak = function (index) {
                if (this.m_timer) {
                    window.clearInterval(this.m_timer);
                    this.m_timer = 0;
                }
            };
            Set.prototype.onContinueClicked = function () {
                //if (Program.instance.index < Program.instance.m_setTemplates.length - 1) {
                //    var set = new Set(Program.instance.m_setTemplates[++Program.instance.index]);
                //    Program.instance.set(set);
                //    set.series()[0].uiStatus(Data.SerieStatus.Ready);
                //}
            };
            return Set;
        }(SetTemplate));
        Data.Set = Set;
    })(Data = RemoteTrainer.Data || (RemoteTrainer.Data = {}));
})(RemoteTrainer || (RemoteTrainer = {}));
//# sourceMappingURL=set.js.map