module RemoteTrainer.Data {
    export class SetTemplate {
        public id: string;
        public name: string;
        public order: KnockoutObservable<number>;
        public serieTemplates: SerieTemplate[];
        public parent: WorkoutTemplate;

        constructor() {
            this.serieTemplates = [];
            this.order = ko.observable<number>();
        }

        public addSerie(serie: SerieTemplate): void {
            this.serieTemplates.push(serie);
            serie.parent = this;
            serie.order(this.serieTemplates.length);
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
        public exercises: KnockoutComputed<Exercise[]>;
        public breaks: KnockoutObservable<string>[];
        public parent: Workout;
        public next: KnockoutObservable<Set>;
        public previous: KnockoutObservable<Set>;
        public uiOptionsContentTemplate: KnockoutObservable<string>;
        public uiOptionsPanelState: KnockoutObservable<OptionPanelState>;

        constructor(template?: SetTemplate) {
            super();

            this.next = ko.observable<Set>(null);
            this.previous = ko.observable<Set>(null);

            this.breaks = [ko.observable("")];
            this.series = ko.observableArray<Serie>();

            this.exercises = ko.computed(() => {
                let series = this.series();
                let result: Exercise[] = [];

                series.forEach(serie => {
                    if (result.indexOf(serie.exercise) < 0)
                        result.push(serie.exercise);
                });

                return result;
            }, this);

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

            this.uiOptionsContentTemplate = ko.observable<string>("tmplOptionsSetSettings");
            this.uiOptionsPanelState = ko.observable<OptionPanelState>(OptionPanelState.Closed);
        }

        public addSerie(serie: Serie): void {
            let index = this.series().length;
            serie.parent = this;
            serie.order(index);

            this.series.push(serie);
            if (index > 0) {
                this.series()[index - 1].next(serie);
                serie.previous(this.series()[index - 1]);
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

                    if (this.previous())
                        this.previous().stopBreak(this.previous().breaks.length - 1);
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
            if (this.previous())
                (<Workout>this.parent).displayedSet(this.previous());
        }

        public showNext(): void {
            if (this.next())
                (<Workout>this.parent).displayedSet(this.next());
        }

        public showRunningSet(): void {
            let set = (<Workout>this.parent).sets().filter(s => s.uiStatus() === SerieStatus.Running || s.uiStatus() === SerieStatus.Ready);
            if (set.length > 0)
                (<Workout>this.parent).displayedSet(set[0]);
        }

        public showHideSettings(): void {
            this.uiOptionsPanelState(this.uiOptionsPanelState() === OptionPanelState.Closed ? OptionPanelState.Opened : OptionPanelState.Closed);
        }

        public moveDown(): void {
            if (this.next()) {
                let sets = this.parent.sets();
                sets.splice(this.order(), 1);
                sets.splice(this.order() + 1, 0, this);
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

                this.parent.sets.valueHasMutated();
            }
        }

        public moveUp(): void {
            if (this.previous()) {
                let sets = this.parent.sets();
                sets.splice(this.order(), 1);
                sets.splice(this.order() - 1, 0, this);
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

                this.parent.sets.valueHasMutated();

                if (this.next().uiStatus() === SerieStatus.Ready) {
                    // FIXME: create postpone method that  handles breaks and uiStatus in separate method
                    this.next().series()[0].uiStatus(SerieStatus.Queued);
                    this.start();
                }
            }
        }

        public remove(): void {
            if (confirm("Remove the entire set?")) {
                this.parent.sets.splice(this.order(), 1);

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

        public modifySet(set: Set): void {
            //todo: clone set and modify it only if dialogresult = true
            let dialog = new ModifySetDialog(set);
            dialog.closed.add(this, (sender, e) => {
                if (dialog.dialogResult) {
                    alert('modified');
                }
            });
            Program.instance.showDialog(dialog);
        }

        public showAddSerieDialog(): void {
            let dialog = new AddSerieDialog(Program.instance.categories, Program.instance.exercises);
            dialog.closed.add(this, (sender, e) => {
                if (dialog.dialogResult) {
                    let serie = new Serie();
                    serie.exercise = dialog.selectedExercise();
                    this.addSerie(serie);
                }
            });
            Program.instance.showDialog(dialog);
        }

        private m_timer: number;
        private m_breakTimer: GlobalTimer;
        private m_runningTimer: GlobalTimer;

        public entityWriter: Service.IEntityWriter;
    }

    export class ModifySetDialog extends Dialog {
        public modifiedSet: Set;

        constructor(set: Set) {
            super();

            this.name("Modify Set");
            this.uiContentTemplateName("tmplModifySetDialog");

            this.modifiedSet = set;
        }
    }

    export class AddSerieDialog extends Dialog {
        public categories: Category[];
        public exercises: KnockoutComputed<Exercise[]>;
        public selectedCategory: KnockoutObservable<Category>;
        public selectedExercise: KnockoutObservable<Exercise>;

        private m_exercises: Exercise[];

        constructor(categories: Category[], exercises: Exercise[]) {
            super();

            this.name("Add Serie");
            this.uiContentTemplateName("tmplAddSerieDialog");

            this.categories = categories;
            this.m_exercises = exercises;

            this.selectedCategory = ko.observable<Category>(this.categories && this.categories.length > 0 ? this.categories[0] : undefined);

            this.exercises = ko.computed(() => {
                let cat = this.selectedCategory();
                return this.m_exercises.filter(exc => exc.category === cat);
            }, this);

            this.selectedExercise = ko.observable<Exercise>(this.exercises() && this.exercises().length > 0 ? this.exercises()[0] : undefined);
        }
    }

}