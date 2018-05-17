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
		public activeBreakIndex: KnockoutObservable<number>;
		public parent: Workout;
		public next: KnockoutObservable<Set>;
		public previous: KnockoutObservable<Set>;
		public exercises: KnockoutObservableArray<Exercise>;

        constructor(template: SetTemplate) {
            super();
			template.copyTo(this);

			this.previous = ko.observable<Set>();
			this.next = ko.observable<Set>();

			this.breaks = [ko.observable(-1)];
			this.activeBreakIndex = ko.observable(-1);

			this.exercises = ko.observableArray<Exercise>();

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

				if (!this.exercises().contains(serie.exercise))
					this.exercises().push(serie.exercise);
            }, this);
            this.series.valueHasMutated();
		}

		public serieStatusChanged(serie: Serie, status: SerieStatus): void {
			var index = this.series().indexOf(serie);
			if (index === 0 && status === SerieStatus.Ready) {
				this.startBreak(0);
			}
			if (status === SerieStatus.Finished) {
				this.startBreak(index + 1);
				this.parent.updateCompletionStatus();
			}
			else if (status === SerieStatus.Running)
				this.stopBreak(index + 1);
		}

        public startBreak(index: number): void {
			this.breaks[index](0);
			this.activeBreakIndex(index);
            this.m_timer = window.setInterval(function(breakStart: number) {
                var now = Math.round(new Date().getTime() / 1000);
                this.breaks[index](now - breakStart);
            }.bind(this), 1000, Math.round(new Date().getTime() / 1000));
        }

		public stopBreak(index: number): void {
			this.activeBreakIndex(-1);
            if (this.m_timer) {
                window.clearInterval(this.m_timer);
                this.m_timer = 0;
            }
		}

		public start(): void {
			this.series()[0].activate();
		}

		public complete(): void {

		}

        private m_timer: number;
	}

	export enum SetStatus {
		Ready = 0,
		Running = 1,
		Finished = 2,
		Pending = 3
	}

}