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
        public uiStatus: KnockoutComputed<SerieStatus>;
        public uiAverageDifficulty: KnockoutComputed<string>;
        public duration: KnockoutComputed<number>; 
        public uiDurationLabel: KnockoutComputed<string>;
        public exercising: KnockoutComputed<number>;
        public uiExercisingLabel: KnockoutComputed<string>;
        public series: KnockoutObservableArray<Serie>;
        public exercises: KnockoutObservableArray<Exercise>;
        public breaks: KnockoutObservable<number>[];
        public startedTimeSpan: KnockoutObservable<number>;
        public finishedTimeSpan: KnockoutObservable<number>;
        public parent: Workout;
        public next: Set;
        public previous: Set;

        constructor(template: SetTemplate) {
            super();
            template.copyTo(this);

            this.exercises = ko.observableArray<Exercise>();

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

                if (this.exercises().indexOf(serie.exercise) < 0)
                    this.exercises().push(serie.exercise);

                this.breaks.push(ko.observable<number>(-1));
            }, this);
            this.series.valueHasMutated();

            this.uiStatus = ko.computed(() => {
                let serieStatuses = this.series().map(s => s.uiStatus());

                if (serieStatuses.every(status => status === SerieStatus.Queued))
                    return SerieStatus.Queued;
                else if (serieStatuses.every(status => status === SerieStatus.Finished))
                    return SerieStatus.Finished;
                else if (serieStatuses.some(status => status === SerieStatus.Paused))
                    return SerieStatus.Paused;

                return SerieStatus.Running;
            }, this);

            this.uiAverageDifficulty = ko.computed(() => {
                if (this.uiStatus() === SerieStatus.Finished && this.series().length > 0) {
                    var total = 0;
                    this.series().forEach(s => total += s.difficulty());
                    return (total / this.series().length).toFixed(2);
                }
                return "";
            }, this);

            this.startedTimeSpan = ko.observable<number>(0);
            this.finishedTimeSpan = ko.observable<number>(0);

            this.duration = ko.computed(() => {
                return Math.round((this.finishedTimeSpan() - this.startedTimeSpan()) / 1000);
            }, this);

            this.uiDurationLabel = ko.computed(() => {
                var duration = this.duration();
                return Program.instance.spanToTimeLabel(duration);
            }, this);

            this.exercising = ko.computed(() => {
                let total = 0;
                this.series().forEach(s => total += s.uiDuration());
                return total;
            }, this);

            this.uiExercisingLabel = ko.computed(() => {
                var exercising = this.exercising();
                return Program.instance.spanToTimeLabel(exercising);
            }, this);

            this.m_breakTimer = new GlobalTimer();
            this.m_breakTimer.fn = this._onBreakTick.bind(this);
        }

        private _onBreakTick(context: any): void {
            var now = Math.round(new Date().getTime() / 1000);
            this.breaks[context.index](now - context.breakStart);
        }

        public startBreak(index: number): void {
            this.breaks[index](0);
            // subscribe to global timer
            this.m_breakTimer.context = { index: index, breakStart: Math.round(new Date().getTime() / 1000) }
            Program.instance.GlobalTimer.push(this.m_breakTimer);
        }

        public stopBreak(index: number): void {
            // unsubscribe to global timer
            let timerIndex = Program.instance.GlobalTimer.indexOf(this.m_breakTimer);
            if (timerIndex >= 0)
                Program.instance.GlobalTimer.splice(timerIndex, 1);
        }

        public serieStatusChanged(serie: Serie, status: SerieStatus): void {
            var index = this.series().indexOf(serie) + 1;
            if (status === SerieStatus.Finished) {
                this.startBreak(index);
                //this.parent.updateCompletionStatus();
            }
            else if (status === SerieStatus.Running)
                this.stopBreak(index);
        }


        public onContinueClicked(): void {
            if (this.next)
                this.next.start();
        }

        public start(): void {
            (<Workout>this.parent).activeSet(this);
            this.series()[0].uiStatus(SerieStatus.Ready);
            this.startedTimeSpan(Date.now());
            this.startBreak(0);
        }

        public stop(): void {
            this.finishedTimeSpan(Date.now());
        }

        private m_timer: number;
        private m_breakTimer: GlobalTimer;
    }
}