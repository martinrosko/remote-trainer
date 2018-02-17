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
        public uiStatus: KnockoutComputed<SerieStatus>;
        public status: KnockoutObservable<SerieStatus>;
        public uiStartedOn: KnockoutObservable<Date>;
        public uiFinishedOn: KnockoutObservable<Date>;
        public duration: KnockoutObservable<number>;
        public uiDuration: KnockoutComputed<string>;
        public uiAmount: KnockoutObservable<number>;
        public uiAmountHasFocus: KnockoutObservable<boolean>
        public uiReps: KnockoutObservable<number>;
        public uiRepsHasFocus: KnockoutObservable<boolean>
        public uiDifficulty: KnockoutObservable<string>;
        public difficulty: KnockoutComputed<number>;
        public uiOptionsContentTemplate: KnockoutObservable<string>;
        public uiOptionsPanelState: KnockoutObservable<OptionPanelState>;
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

            this.status = ko.observable(SerieStatus.Queued);
            this.uiStatus = ko.computed(() => {
                let status = this.status();
                let countDownCounter = this.countDownTimer();

                if ((status === SerieStatus.Ready || status === SerieStatus.Running) && (this.parent && this.parent.parent && this.parent.parent.status() === WorkoutStatus.Paused))
                    return SerieStatus.Paused;
                else if (countDownCounter)
                    return SerieStatus.Countdown;

                return status;
            }, this);

            this.uiStatus.subscribe(value => {
                switch (value) {
                    case SerieStatus.Ready:
                        Program.instance.GlobalTimer.push(this.m_breakTimer);
                        break;

                    case SerieStatus.Queued: {
                        let index = Program.instance.GlobalTimer.indexOf(this.m_breakTimer);
                        if (index >= 0)
                            Program.instance.GlobalTimer.splice(index, 1);

                        this.break(0);
                        break;
                    }

                    case SerieStatus.Running: {
                        if (!this.m_bDoNotCountDown)
                            this._startCountDown();
                        else
                            this.m_bDoNotCountDown = false;
                        break;
                    }

                    case SerieStatus.Paused: {
                        this.status(SerieStatus.Ready);
                        break;
                    }
                }
            }, this);

            this.uiStartedOn = ko.observable<Date>();
            this.uiFinishedOn = ko.observable<Date>();
            this.uiOptionsContentTemplate = ko.observable<string>("tmplOptionsSerieSettings");
            this.uiOptionsPanelState = ko.observable<OptionPanelState>();
            this.uiCountDown = ko.observable<number>();

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

        private _onBreakTick(context: any): void {
            this.break(this.break() + 1);
        }

        public onStatusClicked(): void {
            var status = this.uiStatus();

            switch (status) {
                case SerieStatus.Paused:
                    this.parent.parent.resume();
                    this._startCountDown();
                    break;

                case SerieStatus.Ready:
                    this._startCountDown();
                    break;

                case SerieStatus.Countdown:
                    this._stopCountDown();
                    break;

                case SerieStatus.Running: {
                    this.status(SerieStatus.Finished);
                    this.uiOptionsPanelState(OptionPanelState.Closed);
                    this.uiOptionsContentTemplate("tmplOptionsSerieComplete");
                    this.uiFinishedOn(moment(this.uiStartedOn()).add(this.duration(), "second").toDate());

                    // unsubscribe the duration timer
                    let timerIndex = Program.instance.GlobalTimer.indexOf(this.m_durationTimer);
                    if (timerIndex >= 0)
                        Program.instance.GlobalTimer.splice(timerIndex, 1);

                    if (this.next()) {
                        this.next().status(SerieStatus.Ready);
                    }
                    else {
                        // finish set
                        let set = (<Set>this.parent);
                        set.status(SetStatus.Finished);

                        if (set.next())
                            set.next().status(SetStatus.Ready);
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

        public remove(): void {
            if (confirm("Remove the serie?")) {
                this.parent.series.splice(this.order() - 1, 1);

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
            let timerIndex = Program.instance.GlobalTimer.indexOf(this.countDownTimer());
            if (timerIndex < 0) {
                this.uiCountDown(10);
                this.uiOptionsContentTemplate("tmplOptionsRunningSerie");

                this.countDownTimer(new GlobalTimer());
                this.countDownTimer().fn = this._onCountDownTimer.bind(this);
                Program.instance.GlobalTimer.push(this.countDownTimer());
            }
        }

        private m_bDoNotCountDown: boolean;
        private _stopCountDown(): void {
            if (this.uiCountDown() > 0)
                this.uiCountDown(0)

            // unsubscribe countdown timer
            let timerIndex = Program.instance.GlobalTimer.indexOf(this.countDownTimer());
            if (timerIndex >= 0) {
                Program.instance.GlobalTimer.splice(timerIndex, 1);
                this.countDownTimer(null);
            }

            // stop current break;
            let breakTimerIndex = Program.instance.GlobalTimer.indexOf(this.m_breakTimer);
            if (breakTimerIndex >= 0)
                Program.instance.GlobalTimer.splice(breakTimerIndex, 1);

            this.m_bDoNotCountDown = true;
            this.status(SerieStatus.Running);
            if (this.order() === 1)
                this.parent.status(SetStatus.Running);

            var now = new Date();
            this.uiStartedOn(now);

            // subscribe duration timer to global timer
            this.m_durationTimer = new GlobalTimer();
            this.m_durationTimer.fn = this._onDurationTimer.bind(this);
            Program.instance.GlobalTimer.push(this.m_durationTimer);
        }

        private _onCountDownTimer(context: any): void {
            this.uiCountDown(this.uiCountDown() - 1);
            if (this.uiCountDown() == 0)
                this._stopCountDown();
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
        Countdown = 10003,
    }

    export enum OptionPanelState {
        Closing,
        Closed,
        Opening,
        Opened
    }
}