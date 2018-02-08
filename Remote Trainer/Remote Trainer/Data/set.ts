module RemoteTrainer.Data {
    export class SetTemplate {
        public id: string;
        public name: string;
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
        public duration: KnockoutObservable<number>; 
        public uiDurationLabel: KnockoutComputed<string>;
        public exercising: KnockoutComputed<number>;
        public uiExercisingLabel: KnockoutComputed<string>;
        public series: KnockoutObservableArray<Serie>;
        public exercises: KnockoutObservableArray<Exercise>;
        public breaks: KnockoutObservable<string>[];
        public parent: Workout;
        public next: Set;
        public previous: Set;

        constructor(template?: SetTemplate) {
            super();

            this.exercises = ko.observableArray<Exercise>();
            this.next = null;
            this.previous = null;

            this.breaks = [ko.observable("")];
            this.series = ko.observableArray<Serie>();

            if (template) {
                template.copyTo(this);
                template.serieTemplates.forEach(serieTemplate => this.addSerie(new Serie(serieTemplate)), this);
            }

            this.uiStatus = ko.computed(() => {
                let series = this.series();
                let serieStatuses = series.map(s => s.uiStatus());

                if (serieStatuses.every(status => status === SerieStatus.Queued))
                    return SerieStatus.Queued;
                else if (serieStatuses.every(status => status === SerieStatus.Finished))
                    return SerieStatus.Finished;
                else if (serieStatuses.some(status => status === SerieStatus.Paused))
                    return SerieStatus.Paused;
                else if (serieStatuses[0] === SerieStatus.Ready)
                    return SerieStatus.Ready;

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

            this.duration = ko.observable(0);

            this.uiDurationLabel = ko.computed(() => {
                var duration = this.duration();
                return Program.instance.spanToTimeLabel(duration);
            }, this);

            this.exercising = ko.computed(() => {
                let total = 0;
                this.series().forEach(s => total += s.duration());
                return total;
            }, this);

            this.uiExercisingLabel = ko.computed(() => {
                var exercising = this.exercising();
                return Program.instance.spanToTimeLabel(exercising);
            }, this);

            this.m_breakTimer = new GlobalTimer();
            this.m_breakTimer.fn = this._onBreakTick.bind(this);
        }

        public addSerie(serie: Serie): void {
            let index = this.series().length;
            serie.parent = this;
            serie.order = index;

            this.series().push(serie);
            if (index > 0) {
                this.series()[index - 1].next = serie;
                serie.previous = this.series()[index - 1];
            }

            if (this.exercises().indexOf(serie.exercise) < 0)
                this.exercises().push(serie.exercise);

            this.breaks.push(ko.observable(""));
        }

        private _onBreakTick(context: any): void {
            var now = Math.round(new Date().getTime() / 1000);
            this.breaks[context.index](Program.instance.spanToTimeLabel(now - context.breakStart));
        }

        private _onRunningTick(context: any): void {
            var now = Math.round(new Date().getTime() / 1000);
            this.duration(now - context);
        }

        public startBreak(index: number): void {
            this.breaks[index](Program.instance.spanToTimeLabel(0));
            // subscribe to global timer
            this.m_breakTimer.context = { index: index, breakStart: Math.round(new Date().getTime() / 1000) }
            Program.instance.GlobalTimer.push(this.m_breakTimer);
        }

        public stopBreak(index: number): void {
            // unsubscribe to global timer
            let timerIndex = Program.instance.GlobalTimer.indexOf(this.m_breakTimer);
            if (timerIndex >= 0) {
                Program.instance.GlobalTimer.splice(timerIndex, 1);

                // if stopping first break it means that we are starting exercising in this set
                // -> start the duration timer
                // -> stop the last break in previous set (it was showing the break on previous page)
                if (index === 0) {
                    this.m_runningTimer = new GlobalTimer();
                    this.m_runningTimer.context = Math.round(Date.now() / 1000);
                    this.m_runningTimer.fn = this._onRunningTick.bind(this);
                    Program.instance.GlobalTimer.push(this.m_runningTimer);

                    if (this.previous)
                        this.previous.stopBreak(this.previous.breaks.length - 1);
                }
            }
        }

        public serieStatusChanged(serie: Serie, status: SerieStatus): void {
            var index = this.series().indexOf(serie) + 1;
            if (status === SerieStatus.Finished) {
                this.startBreak(index);
                //this.parent.updateCompletionStatus();
            }
            else if (status === SerieStatus.Running)
                this.stopBreak(index - 1);
        }

        public start(): void {
            this.series()[0].uiStatus(SerieStatus.Ready);
            this.startBreak(0);
        }

        public stop(): void {
            let runningTimerIndex = Program.instance.GlobalTimer.indexOf(this.m_runningTimer);
            if (runningTimerIndex >= 0)
                Program.instance.GlobalTimer.splice(runningTimerIndex, 1);
        }

        public show(): void {
            this.parent.displayedSet(this);
            Program.instance.onTabItemClicked("Set");
        }

        public showPrevious(): void {
            if (this.previous)
                (<Workout>this.parent).displayedSet(this.previous);
        }

        public showNext(): void {
            if (this.next)
                (<Workout>this.parent).displayedSet(this.next);
        }

        public showRunningSet(): void {
            let set = (<Workout>this.parent).sets().filter(s => s.uiStatus() === SerieStatus.Running || s.uiStatus() === SerieStatus.Ready);
            if (set.length > 0)
                (<Workout>this.parent).displayedSet(set[0]);
        }

        private m_timer: number;
        private m_breakTimer: GlobalTimer;
        private m_runningTimer: GlobalTimer;

        public entityWriter: Service.IEntityWriter;
    }
}