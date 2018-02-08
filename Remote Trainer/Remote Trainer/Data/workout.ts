module RemoteTrainer.Data {
    export class WorkoutTemplate {
        public id: string;
		public name: string;
		public description: string;
		public setTemplates: SetTemplate[];

		constructor() {
			this.setTemplates = [];
		}

        public addSet(set: SetTemplate): void {
            this.setTemplates.push(set);
            set.parent = this;
            set.order = this.setTemplates.length;
        }

        public copyTo(dst: WorkoutTemplate): void {
            dst.name = this.name;
            dst.description = this.description;
        }
    }

    export class Workout extends WorkoutTemplate {
        public sets: KnockoutObservableArray<Set>;
        public uiStatus: KnockoutObservable<WorkoutStatus>;
        public uiStartedOn: KnockoutObservable<Date>;
        public uiFinishedOn: KnockoutObservable<Date>;
        public duration: KnockoutObservable<number>;
        public uiDuration: KnockoutComputed<string>;
        public completition: KnockoutComputed<number>;
        public averageDifficulty: KnockoutComputed<number>;

        public displayedSet: KnockoutObservable<Data.Set>;

        constructor(template?: WorkoutTemplate) {
            super();

            this.uiStatus = ko.observable(WorkoutStatus.Ready);
            this.uiStartedOn = ko.observable<Date>();
            this.uiFinishedOn = ko.observable<Date>();
            this.sets = ko.observableArray<Set>();

            if (template) {
                template.copyTo(this);
                template.setTemplates.forEach(setTemplate => this.addSet(new Set(setTemplate)), this);
            }

            this.duration = ko.observable<number>(0);

            this.uiDuration = ko.computed(() => {
                let duration = this.duration();
                return duration >= 0 ? Program.instance.spanToTimeLabel(duration) : "";
            }, this)

            this.completition = ko.computed(() => {
                let numSeries = 0;
                let finishedSeries = 0;

                this.sets().forEach(set => {
                    set.series().forEach(serie => {
                        numSeries++;
                        if (serie.uiStatus() === Data.SerieStatus.Finished)
                            finishedSeries++;
                    });
                });
                return Math.round((finishedSeries / numSeries) * 100);
            }, this);

            this.averageDifficulty = ko.computed(() => {
                let difficulty = 0;
                let finishedSeries = 0;

                this.sets().forEach(set => {
                    set.series().forEach(serie => {
                        if (serie.uiStatus() === Data.SerieStatus.Finished) {
                            finishedSeries++;
                            difficulty += serie.difficulty();
                        }
                    });
                });
                return finishedSeries > 0 ? (difficulty / finishedSeries) : 0;
            }, this);
            this.displayedSet = ko.observable<Data.Set>();
        }

        public addSet(set: Set): void {
            let index = this.sets().length;
            set.parent = this;
            set.order = index;
            this.sets.push(set);

            if (index > 0) {
                this.sets()[index - 1].next = set;
                set.previous = this.sets()[index - 1];
            }
        }

        public start(): void {
            this.uiStatus(WorkoutStatus.Running);
            this.uiStartedOn(new Date());

            this.duration(0);

            // subscribe duration timer to global timer
            this.m_durationTimer = new GlobalTimer();
            this.m_durationTimer.fn = this._onDurationTimer.bind(this);
            Program.instance.GlobalTimer.push(this.m_durationTimer);

            this.displayedSet = ko.observable<Data.Set>(this.sets()[0])
            this.displayedSet().start();
        }

        public stop(): void {
            // unsubscribe the duration timer
            let timerIndex = Program.instance.GlobalTimer.indexOf(this.m_durationTimer);
            if (timerIndex >= 0)
                Program.instance.GlobalTimer.splice(timerIndex, 1);

            this.uiFinishedOn(new Date());
            this.uiStatus(WorkoutStatus.Finished);
        }

        private _onDurationTimer(context: any): void {
            this.duration(this.duration() + 1);
        }

        private m_durationTimer: GlobalTimer;
    }

    export enum WorkoutStatus {
        Ready = 1,
        Finished = 2,
        Running = 10000,
        Paused = 10001
    }
}