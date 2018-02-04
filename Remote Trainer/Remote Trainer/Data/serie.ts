module RemoteTrainer.Data {
    export class SerieTemplate {
        public id: string;
        public order: number;
        public amount: number;
        public reps: number;
        public parent: SetTemplate;
        public exercise: Exercise;

        constructor(exercise?: Exercise, reps?: number, amount?: number) {
            this.exercise = exercise;
            this.reps = reps;
            this.amount = amount;
        }

        public copyTo(dst: SerieTemplate): void {
            dst.exercise = this.exercise;
            dst.order = this.order;
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
        public uiStatus: KnockoutObservable<SerieStatus>;
        public uiStartedOn: KnockoutObservable<Date>;
        public uiFinishedOn: KnockoutObservable<Date>;
        public duration: KnockoutComputed<number>;
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
        public exercise: Exercise;
		public parent: Set;
        public next: Serie;
        public previous: Serie;

        static difficulties: string[] = ["Very Easy", "Easy", "Medium", "Hard", "Very Hard"];

        constructor(template: SerieTemplate) {
            super();
            template.copyTo(this);

            this.uiAmount = ko.observable<number>(template.amount);
            this.uiAmountHasFocus = ko.observable<boolean>(false);
            this.uiAmountHasFocus.subscribe(hasFocus => {
                // FIXME: validate value
            }, this);

            this.uiReps = ko.observable<number>(template.reps);
            this.uiRepsHasFocus = ko.observable<boolean>(false);
            this.uiRepsHasFocus.subscribe(hasFocus => {
                // FIXME: validate value
            }, this);

            this.uiDifficulty = ko.observable<string>(Serie.difficulties[3]);
			this.uiStatus = ko.observable(SerieStatus.Queued);
			this.uiStatus.subscribe(value => {
				if (this.parent)
					this.parent.serieStatusChanged(this, value);
			}, this);

            this.uiStartedOn = ko.observable<Date>();
            this.uiFinishedOn = ko.observable<Date>();
            this.uiOptionsContentTemplate = ko.observable<string>("tmplOptionsSerieSettings");
            this.uiOptionsPanelState = ko.observable<OptionPanelState>();
            this.uiCountDown = ko.observable<number>();

            this.duration = ko.computed<number>(() => {
                var started = this.uiStartedOn();
                var finished = this.uiFinishedOn();
                if (started && finished) {
                    return Math.round((finished.getTime() - started.getTime()) / 1000);
                }
                return -1;
            });

            this.uiDuration = ko.computed(() => {
                let duration = this.duration();
                return duration >= 0 ? Program.instance.spanToTimeLabel(duration) : "";
            })

            this.difficulty = ko.computed(() => {
                var diffLabel = this.uiDifficulty();
                return Serie.difficulties.indexOf(diffLabel) + 1;
            }, this);

            this.exercise = template.exercise;
        }

		public activate(): void {
			this.uiStatus(SerieStatus.Ready);
		}

		public start(): void {
			this.uiStatus(SerieStatus.Running);
		}

        public onStatusClicked(): void {
            var status = this.uiStatus();

            switch (status) {
                case SerieStatus.Queued:
                    //this.uiOptionsPanelState(OptionPanelState.Closed);
                    //this.uiOptionsContentTemplate("tmplOptionsSerieSettings");
                    break;

                case SerieStatus.Ready: {
                    this.uiOptionsPanelState(OptionPanelState.Opened);
                    // if not counting down already -> start countdown
                    let timerIndex = Program.instance.GlobalTimer.indexOf(this.m_countDownTimer);
                    if (timerIndex < 0) {
                        this.uiCountDown(5);
                        this.uiOptionsContentTemplate("tmplOptionsRunningSerie");

                        this.m_countDownTimer = new GlobalTimer();
                        this.m_countDownTimer.fn = this._onCountDownTimer.bind(this);
                        Program.instance.GlobalTimer.push(this.m_countDownTimer);
                    }
                    else {
                        // otherwise skip countdown and start exercising immediately (second click on 'start' button)
                        this._stopCountDown();
                    }
                    break;
                }

                case SerieStatus.Running: {
                    this.uiStatus(SerieStatus.Finished);
                    this.uiOptionsPanelState(OptionPanelState.Closed);
                    this.uiOptionsContentTemplate("tmplOptionsSerieComplete");
                    this.uiFinishedOn(new Date());

                    // unsubscribe the duration timer
                    let timerIndex = Program.instance.GlobalTimer.indexOf(this.m_durationTimer);
                    if (timerIndex >= 0)
                        Program.instance.GlobalTimer.splice(timerIndex, 1);

                    if (this.next) {
                        this.next.uiStatus(SerieStatus.Ready);
                    }
                    else {
                        // finish set
                        let set = (<Set>this.parent);
                        set.stop();

                        if (set.next)
                            set.next.start();
                        else
                            (<Workout>set.parent).stop();
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

        private _toggleOptionsPanel(): void {
            this.uiOptionsPanelState(this.uiOptionsPanelState() === OptionPanelState.Closed ? OptionPanelState.Opened : OptionPanelState.Closed);
        }

        private _stopCountDown(): void {
            if (this.uiCountDown() > 0)
                this.uiCountDown(0)

            // unsubscribe countdown timer
            let timerIndex = Program.instance.GlobalTimer.indexOf(this.m_countDownTimer);
            if (timerIndex >= 0)
                Program.instance.GlobalTimer.splice(timerIndex, 1);

            // start the exercise
            this.uiStatus(SerieStatus.Running);
            var now = new Date();
            this.uiStartedOn(now);
            this.uiFinishedOn(now);

            // stop current break;
            (<Set>this.parent).stopBreak(this.order);

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
            this.uiFinishedOn(new Date());
        }

        private m_countDownTimer: GlobalTimer;
        private m_durationTimer: GlobalTimer;
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