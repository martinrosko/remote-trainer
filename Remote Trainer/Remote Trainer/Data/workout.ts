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
            set.order(this.setTemplates.length);
        }

        public copyTo(dst: WorkoutTemplate): void {
            dst.name = this.name;
            dst.description = this.description;
        }
    }

    export class Workout extends WorkoutTemplate {
        public sets: KnockoutObservableArray<Set>;
        public removedSets: Resco.Dictionary<string, Set>;
        public status: KnockoutObservable<WorkoutStatus>;
        public startedOn: KnockoutObservable<Date>;
        public finishedOn: KnockoutObservable<Date>;
        public duration: KnockoutObservable<number>;
        public uiDuration: KnockoutComputed<string>;
        public completition: KnockoutComputed<number>;
        public averageDifficulty: KnockoutComputed<number>;

        public displayedSet: KnockoutObservable<Data.Set>;

        constructor(template?: WorkoutTemplate) {
            super();

            this.status = ko.observable(WorkoutStatus.Ready);
            this.startedOn = ko.observable<Date>();
            this.finishedOn = ko.observable<Date>();
            this.sets = ko.observableArray<Set>();
            this.removedSets = new Resco.Dictionary<string, Set>();

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
                        if (serie.status() === Data.SerieStatus.Finished)
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
                        if (serie.status() === Data.SerieStatus.Finished) {
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
            set.order(index + 1);
            this.sets.push(set);

            if (index > 0) {
                this.sets()[index - 1].next(set);
                set.previous(this.sets()[index - 1]);
            }
        }

        public start(): void {
            this.status(WorkoutStatus.Running);

            this.startedOn(new Date());
            this.duration(0);

            // subscribe duration timer to global timer
            this.m_durationTimer = new GlobalTimer();
            this.m_durationTimer.fn = this._onDurationTimer.bind(this);
            Program.instance.GlobalTimer.push(this.m_durationTimer);

            this.displayedSet = ko.observable<Data.Set>(this.sets()[0])
            this.displayedSet().status(SetStatus.Ready);
        }

        public pause(): void {
            if (this.status() === WorkoutStatus.Running) {
                // pause global timers
                Program.instance.globalTimerPaused = true;
                this.status(WorkoutStatus.Paused);
                let activeSet = this.sets().firstOrDefault(set => set.status() === SetStatus.Running || set.status() === SetStatus.Ready);
                if (activeSet)
                    activeSet.pause();
            }
        }

        public resume(): void {
            if (this.status() === WorkoutStatus.Paused) {
                // resume global timers
                Program.instance.globalTimerPaused = false;
                this.status(WorkoutStatus.Running);
                // serie is restarted explicitly by user (it has countdown timer...)

                let pausedSet = this.sets().firstOrDefault(set => set.status() === SetStatus.Paused);
                if (pausedSet)
                    pausedSet.resume(false);
            }
        }

        public stop(): void {
            let unfinishedSet = this.sets().firstOrDefault(set => set.status() !== SetStatus.Finished);
            if (!unfinishedSet || confirm("Do you want to complete the workout? All unfinished sets will be removed")) {
                // clear all timers
                Program.instance.GlobalTimer.splice(0);
                this.finishedOn(new Date());
                this.status(WorkoutStatus.Finished);

                let sets = this.sets();
                for (let i = sets.length - 1; i >= 0; i--) {
                    let set = sets[i];
                    if (set.status() === SetStatus.Queued || set.status() === SetStatus.Ready) {
                        set.remove(false);
                    }
                    else if (set.status() !== SetStatus.Finished) {
                        // remove unfinished series of incomplete sets
                        let series = set.series();
                        for (let j = series.length - 1; j >= 0; j--) {
                            let serie = series[j];
                            if (serie.status() !== SerieStatus.Finished)
                                serie.remove(false);
                        }
                        set.status(SetStatus.Finished);
                    }
                }
            }
        }

        public addNewSet(): void {
            let set = new Set();
            let dialog = new ModifySetDialog(set);
            dialog.closed.add(this, (sender, e) => {
                if (dialog.dialogResult) {
                    if (set.series().length > 0)
                        this.addSet(set);
                }
            });
            Program.instance.showDialog(dialog);
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