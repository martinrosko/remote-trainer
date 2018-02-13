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
        }

        public copyTo(dst: SerieTemplate): void {
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
        public uiStatus: KnockoutObservable<SerieStatus>;
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
        public exercise: Exercise;
		public parent: Set;
        public next: KnockoutObservable<Serie>;
        public previous: KnockoutObservable<Serie>;

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

            this.duration = ko.observable<number>(0);

            this.uiDuration = ko.computed(() => {
                let duration = this.duration();
                return duration >= 0 ? Program.instance.spanToTimeLabel(duration) : "";
            })

            this.difficulty = ko.computed(() => {
                var diffLabel = this.uiDifficulty();
                return Serie.difficulties.indexOf(diffLabel) + 1;
            }, this);

            this.next = ko.observable<Serie>();
            this.previous = ko.observable<Serie>();
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
                        this.uiCountDown(10);
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
                    this.uiFinishedOn(moment(this.uiStartedOn()).add(this.duration(), "second").toDate());

                    // unsubscribe the duration timer
                    let timerIndex = Program.instance.GlobalTimer.indexOf(this.m_durationTimer);
                    if (timerIndex >= 0)
                        Program.instance.GlobalTimer.splice(timerIndex, 1);

                    if (this.next()) {
                        this.next().uiStatus(SerieStatus.Ready);
                    }
                    else {
                        // finish set
                        let set = (<Set>this.parent);
                        set.stop();

                        if (set.next())
                            set.next().start();
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

        public moveDown(): void {
            if (this.next()) {
                let series = this.parent.series();
                series.splice(this.order(), 1);
                series.splice(this.order() + 1, 0, this);
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
                series.splice(this.order(), 1);
                series.splice(this.order() - 1, 0, this);
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
                this.parent.series.splice(this.order(), 1);

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
            this.duration(0);

            // stop current break;
            (<Set>this.parent).stopBreak(this.order());

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