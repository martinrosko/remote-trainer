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
        public uiDuration: KnockoutComputed<string>;  //help
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
        public parentid: string;
        public next: KnockoutObservable<Serie>;
        public previous: KnockoutObservable<Serie>;
        public countDownTimer: KnockoutObservable<GlobalTimer>;
        public canMoveUp: KnockoutComputed<boolean>;

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

            this.status = ko.observable<SerieStatus>(SerieStatus.Queued);
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
                else if (status === SerieStatus.Finished)
                    return "url(\'Images/serieStatusFinished.png\')";

                return "url(\'Images/serieStatusReady.png\')";
            }, this);

            this.uiStartedOn = ko.observable<Date>();
            this.uiFinishedOn = ko.observable<Date>();
            this.uiOptionsContentTemplate = ko.observable<string>("tmplOptionsQueuedSerie");
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

            this.canMoveUp = ko.computed(() => {
                let previous = this.previous();
                return (previous && (previous.status() === SerieStatus.Queued || previous.status() === SerieStatus.Ready));
            });
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

        public async showExerciseHistory(): Promise<void> {
			var series = await Program.instance.dataProvider.getExerciseSeries(this.exercise);
			Program.instance.showDialog(new ExerciseHistoryDialog(this.exercise, series));
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
                    this.uiOptionsContentTemplate("tmplOptionsSerieComplete");
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

                if (this.status() === SerieStatus.Ready) {
                    let currentBreak = this.break();
                    this.status(SerieStatus.Queued);
                    this.previous().status(SerieStatus.Ready);
                    this.previous().break(currentBreak);
                }
            }
        }

        public moveUp(): void {
            if (this.canMoveUp()) {
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

                if (this.next().status() === SerieStatus.Ready) {
                    let currentBreak = this.next().break();
                    this.next().status(SerieStatus.Queued);
                    this.status(SerieStatus.Ready);
                    this.break(currentBreak);
                }
            }
        }

        public remove(bAskConfirm: boolean = true): void {
            if (bAskConfirm) {
                let confirm = new MessageBox("Do you want to remove only this serie or whole exercise?", ["Just the Serie", "Whole Exercise"], "Cancel");
                confirm.closed.add(this, (sender, e) => {
                    if (e.button === 0) {
                        this._removeSerie();
                    }
                    else if (e.button === 1) {
                        let exercise = this.exercise;
                        let series = this.parent.series();

                        for (let i = series.length - 1; i >= 0; i--) {
                            if (series[i].exercise === exercise && (series[i].status() === SerieStatus.Ready || series[i].status() === SerieStatus.Queued))
                                series[i].remove(false);
                        }
                    }
                });
                confirm.show();
            }
            else {
                this._removeSerie();
            }
        }

        private _removeSerie(): void {
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

        public copyTo(dst: SerieTemplate, bAsTemplate: boolean = false): void {
            super.copyTo(dst);
            if (dst instanceof Serie) {
                dst.uiAmount(this.uiAmount());
                dst.uiReps(this.uiReps());
                dst.uiStartedOn(this.uiStartedOn());
                dst.uiFinishedOn(this.uiFinishedOn());
                dst.duration(this.duration());
                dst.status(this.status());
                dst.break(this.break());
            }
        }

        public clone(): Serie {
            let result = new Serie();
            this.copyTo(result);
            return result;
        }

        public addClone(): void {
            var clone = new Serie();
            this.copyTo(clone);
            this.parent.addSerie(clone);
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

    export class ExerciseHistoryDialog extends Dialog {
		public items: KnockoutObservableArray<ExerciseHistoryItem>;
		public dateGrupping: KnockoutObservable<boolean>;

        constructor(exercise: Exercise, series: Serie[]) {
			super();

			this.dateGrupping = ko.observable(true);
			this.dateGrupping.subscribe(value => this._updateItems(), this);

            this.name(exercise.name);
            this.uiContentTemplateName("tmplExerciseHistoryDialog");

            series = series.sort((a, b) => b.uiFinishedOn().getTime() - a.uiFinishedOn().getTime());
			this.m_series = series;
			this.m_exercise = exercise;

			this.items = ko.observableArray<ExerciseHistoryItem>();
			this._updateItems();
		}

		private _updateItems(): void {
			var items = this.items();
				items.splice(0);

			if (this.dateGrupping()) {
				var parentId = "";
				var prevSerie: Serie;
				var dateItem: GroupHistoryItem;
				for (var serie of this.m_series) {
					var item: ExerciseHistoryItem;

					if (parentId !== serie.parentid) {
						// new set, new day => create date separator
						dateItem = new GroupHistoryItem(this.m_exercise, moment(serie.uiFinishedOn()).format("dddd, D.M.YYYY"));
						items.push(dateItem);
						parentId = serie.parentid;
						prevSerie = null;
					}

					// if not first serie of a set, add break item
					if (prevSerie)
						dateItem.items.splice(0, 0, new BreakHistoryItem(this.m_exercise, Math.round((prevSerie.uiStartedOn().getTime() - serie.uiFinishedOn().getTime()) / 1000)));

					// add serie item
					dateItem.items.splice(0, 0, new SerieHistoryItem(this.m_exercise, serie));
					prevSerie = serie;
				}
			}
			else {
				var groupItem = new GroupHistoryItem(this.m_exercise, "Difficulty");
				for (var serie of this.m_series) {
					groupItem.items.splice(0, 0, new SerieHistoryItem(this.m_exercise, serie));
				}
				items.push(groupItem);
			}

			this.items.valueHasMutated();
		}

		private m_series: Data.Serie[];
		private m_exercise: Data.Exercise;
    }

    export enum HistoryItemType {
        Group,
        Serie,
        Break
    }

    class ExerciseHistoryItem {
        public type: HistoryItemType;
        public exercise: Exercise;

        constructor(exercise: Exercise) {
            this.exercise = exercise;
        }
    }

    class SerieHistoryItem extends ExerciseHistoryItem {
        public serie: Serie;

        constructor(exercise: Exercise, serie: Serie) {
            super(exercise);
            this.type = HistoryItemType.Serie;
            this.serie = serie;
        }
    }

    class BreakHistoryItem extends ExerciseHistoryItem {
        public durationLabel: string;

        constructor(exercise: Exercise, duration: number) {
            super(exercise);
            this.type = HistoryItemType.Break;
            this.durationLabel = Program.instance.spanToTimeLabel(duration);
        }
	}

	class GroupHistoryItem extends ExerciseHistoryItem {
		public label: string;
		public items: ExerciseHistoryItem[];

		constructor(exercise: Exercise, label: string) {
			super(exercise);
			this.items = [];
			this.label = label;
			this.type = HistoryItemType.Group;
		}
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
