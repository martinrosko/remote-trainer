module RemoteTrainer.Data {
    export class SerieTemplate {
        public id: string;
        public order: KnockoutObservable<number>;
        public amount: number;
        public reps: number;
        public parent: SetTemplate;
        public exercise: Exercise;

        constructor(exercise?: Exercise, reps?: number, amount?: number) {
            this.exercise = exercise;
            this.reps = reps;
            this.amount = amount;
            this.order = ko.observable<number>();
            if (DEMODATA)
                this.id = Math.floor(Math.random() * Math.floor(1000)).toString();
        }

        public copyTo(dst: SerieTemplate): void {
            dst.id = this.id;
            dst.exercise = this.exercise;
            dst.order(this.order());
            dst.amount = this.amount;
            dst.reps = this.reps;
        }

        public clone(): SerieTemplate {
            var result = new SerieTemplate();
            this.copyTo(result);
            return result;
        }
    }

    export class Serie extends SerieTemplate {
        public status: KnockoutObservable<SerieStatus>;
        public uiStartedOn: KnockoutObservable<Date>;
        public uiFinishedOn: KnockoutObservable<Date>;
        public duration: KnockoutObservable<number>;
        public uiDurations: KnockoutComputed<string>;  //help
        public uiAmount: KnockoutObservable<number>;
        public uiAmountHasFocus: KnockoutObservable<boolean>
        public uiReps: KnockoutObservable<number>;
        public uiRepsHasFocus: KnockoutObservable<boolean>
        public uiDifficulty: KnockoutObservable<string>;
        public difficulty: KnockoutComputed<number>;
        public uiOptionsContentTemplate: KnockoutObservable<string>;
        public uiOptionsPanelState: KnockoutObservable<OptionPanelState>;
        public uiButtonImage: KnockoutComputed<string>;
        public uiCountDown: KnockoutObservable<number>;
        public break: KnockoutObservable<number>;
        public uiBreakLabel: KnockoutComputed<string>;
        public exercise: Exercise;
		public parent: Set;
        public next: KnockoutObservable<Serie>;
        public previous: KnockoutObservable<Serie>;
        public countDownTimer: KnockoutObservable<GlobalTimer>;

        static difficulties: string[] = ["Very Easy", "Easy", "Medium", "Hard", "Very Hard"];

        constructor(template?: SerieTemplate) {
            super();
            if (template)
                template.copyTo(this);

            this.uiAmount = ko.observable<number>(template ? template.amount : 0);
 
            this.uiAmountHasFocus = ko.observable<boolean>(false);
            this.uiAmountHasFocus.subscribe(hasFocus => {
                // FIXME: validate value
            }, this);

            this.uiReps = ko.observable<number>(template ? template.reps : 0);

            this.uiRepsHasFocus = ko.observable<boolean>(false);
            this.uiRepsHasFocus.subscribe(hasFocus => {
                // FIXME: validate value
            }, this);

            this.uiDifficulty = ko.observable<string>(Serie.difficulties[3]);

            this.countDownTimer = ko.observable<GlobalTimer>();
            this.countDownTimer.subscribe(value => {
                if (value) {
                    this.uiCountDown(10);    // FIXME: take value from db
                    this.uiOptionsContentTemplate("tmplOptionsRunningSerie");
                    this.uiOptionsPanelState(OptionPanelState.Opened);
                }
                else {
                    this.uiCountDown(null);
                    this.uiOptionsPanelState(OptionPanelState.Closed);
                }
            });

            this.uiCountDown = ko.observable<number>();
            // if countdown reached zero -> start or resume exercise
            this.uiCountDown.subscribe(value => {
                if (value === 0) {
                    // unsubscribe countdown timer
                    if (this.countDownTimer() && Program.instance.clearTimer(this.countDownTimer()))
                        this.countDownTimer(undefined);

                    // if exercise did not start yet start it. otherwise just resume
                    if (!this.uiStartedOn()) {
                        // stop current break;
                        Program.instance.clearTimer(this.m_breakTimer);

                        // first exercise of the set -> set the sets status to running
                        if (this.order() === 1)
                            this.parent.status(SetStatus.Running);

                        this.uiStartedOn(new Date());

                    }

                    this.m_durationTimer = new GlobalTimer();
                    this.m_durationTimer.fn = this._onDurationTimer.bind(this);
                    Program.instance.GlobalTimer.push(this.m_durationTimer);

                    this.status(SerieStatus.Running);
                    this.uiOptionsPanelState(OptionPanelState.Opened);
                }
            }, this);

            this.status = ko.observable<SerieStatus>();
            this.status.subscribe(value => {
                switch (value) {
                    case SerieStatus.Ready:
                        Program.instance.GlobalTimer.push(this.m_breakTimer);
                        break;
                     
                    case SerieStatus.Queued: {
                        Program.instance.clearTimer(this.m_breakTimer);
                        this.break(0);
                        break;
                    }

                    case SerieStatus.Paused:
                        Program.instance.clearTimer(this.m_durationTimer);
                }
            }, this);

            this.uiButtonImage = ko.computed(() => {
                var status = this.status();

                if (status === SerieStatus.Running)
                    return "url(\'Images/serieStatusRunning.png\')";
                
                return "url(\'Images/serieStatusReady.png\')";
            }, this);

            this.uiStartedOn = ko.observable<Date>();
            this.uiFinishedOn = ko.observable<Date>();
            this.uiOptionsContentTemplate = ko.observable<string>("tmplOptionsSerieSettings");
            this.uiOptionsPanelState = ko.observable<OptionPanelState>();

            this.duration = ko.observable<number>(0);

            this.uiDuration = ko.computed(() => {
                let duration = this.duration();
                return duration >= 0 ? Program.instance.spanToTimeLabel(duration) : "";
            })

            this.difficulty = ko.computed(() => {
                var diffLabel = this.uiDifficulty();
                return Serie.difficulties.indexOf(diffLabel) + 1;
            }, this);

            this.break = ko.observable<number>(0);

            this.uiBreakLabel = ko.computed(() => {
                let b = this.break();
                return Program.instance.spanToTimeLabel(b);
            });

            this.m_breakTimer = new GlobalTimer();
            this.m_breakTimer.fn = this._onBreakTick.bind(this);

            this.next = ko.observable<Serie>();
            this.previous = ko.observable<Serie>();
        }

        public pause(): void {
            if (this.countDownTimer() && Program.instance.clearTimer(this.countDownTimer()))
                this.countDownTimer(undefined);

            if (this.status() === SerieStatus.Running)
                this.status(SerieStatus.Paused);
        }

        private _onBreakTick(context: any): void {
            this.break(this.break() + 1);
        }

        public onStatusClicked(): void {
            var status = this.status();

            switch (status) {
                case SerieStatus.Ready:
                case SerieStatus.Paused:
                    this.parent.resume(true);
                    this._startCountDown();
                    break;

                case SerieStatus.Running: {
                    this.status(SerieStatus.Finished);
                    this.uiOptionsPanelState(OptionPanelState.Closed);
                    this.uiOptionsContentTemplate("tmplOptionsSerieComplete");
                    this.uiFinishedOn(new Date());

                    // unsubscribe the duration timer
                    Program.instance.clearTimer(this.m_durationTimer);

                    if (this.next()) {
                        this.next().status(SerieStatus.Ready);
                    }
                    else {
                        // finish set
                        this.parent.status(SetStatus.Finished);

                        if (this.parent.next())
                            this.parent.next().status(SetStatus.Ready);
                    }
                    break;
                }

                case SerieStatus.Finished:
                    this._toggleOptionsPanel();
                    break;
            }
        }

        public onAmountClicked(): void {
            this.uiAmountHasFocus(true);
        }

        public onRepsClicked(): void {
            this.uiRepsHasFocus(true);
        }

        public moveDown(): void {
            if (this.next()) {
                let series = this.parent.series();
                series.splice(this.order() - 1, 1);
                series.splice(this.order(), 0, this);
                this.next().order(this.order());
                this.order(this.order() + 1);

                let nextSet = this.next();
                this.next(nextSet.next());
                nextSet.next(this);
                if (this.next())
                    this.next().previous(this);

                let previousSet = this.previous();
                this.previous(nextSet);
                nextSet.previous(previousSet);
                if (previousSet)
                    previousSet.next(this.previous());

                this.parent.series.valueHasMutated();
            }
        }

        public moveUp(): void {
            if (this.previous()) {
                let series = this.parent.series();
                series.splice(this.order() - 1, 1);
                series.splice(this.order() - 2, 0, this);
                this.previous().order(this.order());
                this.order(this.order() - 1);

                let previousSet = this.previous();
                this.previous(previousSet.previous());
                previousSet.previous(this);
                if (this.previous())
                    this.previous().next(this);

                let nextSet = this.next();
                this.next(previousSet);
                previousSet.next(nextSet);
                if (nextSet)
                    nextSet.previous(this.next());

                this.parent.series.valueHasMutated();

                //if (this.next().uiStatus() === SerieStatus.Ready) {
                //    // FIXME: create postpone method that  handles breaks and uiStatus in separate method
                //    this.next().series()[0].uiStatus(SerieStatus.Queued);
                //    this.start();
                //}
            }
        }

        public remove(bAskConfirm: boolean = true): void {
            if (!bAskConfirm || confirm("Remove the serie?")) {
                this.parent.series.splice(this.order() - 1, 1);
                if (this.id && !this.parent.removedSeries.containsKey(this.id))
                    this.parent.removedSeries.set(this.id, this);

                if (this.previous())
                    this.previous().next(this.next());
                if (this.next())
                    this.next().previous(this.previous());

                let next = this.next();
                while (next) {
                    next.order(next.order() - 1);
                    next = next.next();
                }
            }
        }

        public copyTo(dst: Serie): void {
            super.copyTo(dst);
            dst.uiAmount(this.uiAmount());
            dst.uiReps(this.uiReps());
            dst.uiStartedOn(this.uiStartedOn());
            dst.uiFinishedOn(this.uiFinishedOn());
            dst.duration(this.duration());
            dst.status(this.status());
        }

        public clone(): Serie {
            let result = new Serie();
            this.copyTo(result);
            return result;
        }

        public addClone(): void {
            // FIXME: clone self, not template
            this.parent.addSerie(new Serie(this.clone()));
        }

        private _toggleOptionsPanel(): void {
            this.uiOptionsPanelState(this.uiOptionsPanelState() === OptionPanelState.Closed ? OptionPanelState.Opened : OptionPanelState.Closed);
        }

        private _startCountDown(): void {
            this.uiOptionsPanelState(OptionPanelState.Opened);
            // if not counting down already -> start countdown
            if (!this.countDownTimer()) {
                this.countDownTimer(new GlobalTimer());
                this.countDownTimer().fn = this._onCountDownTimer.bind(this);
                Program.instance.GlobalTimer.push(this.countDownTimer());
            }
            else {
                // if already in countdown skip countdown and run immediately
                this.uiCountDown(0);
            }
        }

        private _onCountDownTimer(context: any): void {
            this.uiCountDown(this.uiCountDown() - 1);
        }

        private _onDurationTimer(context: any): void {
            this.duration(this.duration() + 1);
        }

        private m_durationTimer: GlobalTimer;
        private m_breakTimer: GlobalTimer;
    }

    export enum SerieStatus {
        Queued = 1,
        Finished = 2,
        Ready = 10000,
        Running = 10001,
        Paused = 10002,
    }

    export enum OptionPanelState {
        Closing,
        Closed,
        Opening,
        Opened
    }
}
