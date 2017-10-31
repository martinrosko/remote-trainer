module RemoteTrainer.Data {
    export class SetTemplate {
        public order: number;
        public serieTemplates: SerieTemplate[];
        public parent: WorkoutTemplate;

		constructor() {
			this.serieTemplates = [];
		}

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
		public parent: Workout;
		public next: Set;
		public previous: Set;

        constructor(template: SetTemplate) {
            super();
            template.copyTo(this);

            this.breaks = [ko.observable(-1)];
            this.series = ko.observableArray<Serie>();
            var series = this.series();
            template.serieTemplates.forEach((serieTemplate, index) => {
                var serie = new Serie(serieTemplate);
                serie.parent = this;
				serie.order = index;                

                series.push(serie);
				if (index > 0) {
					series[index - 1].next = serie;
					serie.previous = series[index - 1];
				}
                this.breaks.push(ko.observable<number>(-1));
            }, this);
            this.series.valueHasMutated();
		}

		public serieStatusChanged(serie: Serie, status: SerieStatus): void {
			var index = this.series().indexOf(serie);
			if (status === SerieStatus.Finished) {
				this.startBreak(index);
				this.parent.updateCompletionStatus();
			}
			else if (status === SerieStatus.Running)
				this.stopBreak(index);
		}

        public startBreak(index: number): void {
            this.breaks[index + 1](0);
            this.m_timer = window.setInterval(function(breakStart: number) {
                var now = Math.round(new Date().getTime() / 1000);
                this.breaks[index + 1](now - breakStart);
            }.bind(this), 1000, Math.round(new Date().getTime() / 1000));
        }

        public stopBreak(index: number): void {
            if (this.m_timer) {
                window.clearInterval(this.m_timer);
                this.m_timer = 0;
            }
		}

		public start(): void {
			this.series()[0].activate();
		}

        public onContinueClicked(): void {
            //if (Program.instance.index < Program.instance.m_setTemplates.length - 1) {
            //    var set = new Set(Program.instance.m_setTemplates[++Program.instance.index]);
            //    Program.instance.set(set);
            //    set.series()[0].uiStatus(Data.SerieStatus.Ready);
            //}
        }

        private m_timer: number;
    }
}