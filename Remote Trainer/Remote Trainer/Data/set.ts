module RemoteTrainer.Data {
    export class SetTemplate {
        public order: number;
        public serieTemplates: SerieTemplate[];
        public parent: WorkoutTemplate;

        public addSerie(serie: SerieTemplate): void {
            this.serieTemplates.push(serie);
            serie.parent = this;
            serie.order = this.serieTemplates.length;
        }

        public copyTo(dst: SetTemplate): void {
            dst.order = this.order;
        }
    }

    export class Set extends SetTemplate {
        public series: KnockoutObservableArray<Serie>;
        public breaks: KnockoutObservable<number>[];

        constructor(template: SetTemplate) {
            super();
            template.copyTo(this);

            this.breaks = [];
            this.series = ko.observableArray<Serie>();
            var series = this.series();
            template.serieTemplates.forEach((serieTemplate, index) => {
                var serie = new Serie(serieTemplate);
                serie.parent = this;
                serie.order = index;                
                series.push(serie);
                if (index > 0)
                    series[index - 1].next = serie;

                this.breaks.push(ko.observable<number>(-1));
            }, this);
            this.series.valueHasMutated();
        }

        public startBreak(index: number): void {
            this.breaks[index](0);
            this.m_timer = window.setInterval(function(breakStart,) {
                var now = Math.round(new Date().getTime() / 1000);
                this.breaks[index](now - breakStart);
            }.bind(this), 1000, Math.round(new Date().getTime() / 1000));
        }

        public stopBreak(index: number): void {
            if (this.m_timer) {
                window.clearInterval(this.m_timer);
                this.m_timer = 0;
            }
        }

        public onContinueClicked(): void {
            if (Program.instance.index < Program.instance.m_setTemplates.length - 1) {
                var set = new Set(Program.instance.m_setTemplates[++Program.instance.index]);
                Program.instance.set(set);
                set.series()[0].uiStatus(Data.SerieStatus.Ready);
            }
        }

        private m_timer: number;
    }
}