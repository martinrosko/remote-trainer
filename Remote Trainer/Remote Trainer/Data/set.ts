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
            if (DEMODATA)
                this.id = Math.floor(Math.random() * Math.floor(1000)).toString();
        }

        public addSerie(serie: SerieTemplate): void {
            this.serieTemplates.push(serie);
            serie.parent = this;
            serie.order(this.serieTemplates.length);
        }

        public copyTo(dst: SetTemplate): void {
            dst.id = this.id;
            dst.order(this.order());
            dst.name = this.name;
        }
   }

    export class Set extends SetTemplate {
        public status: KnockoutObservable<SetStatus>;
        public uiAverageDifficulty: KnockoutComputed<string>;
        public duration: KnockoutObservable<number>; 
        public uiDurationLabel: KnockoutComputed<string>;
        public exercising: KnockoutComputed<number>;
        public uiExercisingLabel: KnockoutComputed<string>;
        public series: KnockoutObservableArray<Serie>;
        public removedSeries: Resco.Dictionary<string, Serie>;
        public exercises: KnockoutComputed<Exercise[]>;
        public parent: Workout;
        public next: KnockoutObservable<Set>;
        public previous: KnockoutObservable<Set>;
        public uiOptionsContentTemplate: KnockoutObservable<string>;
        public uiOptionsPanelState: KnockoutObservable<OptionPanelState>;

        constructor(template?: SetTemplate) {
            super();

            this.next = ko.observable<Set>(null);
            this.previous = ko.observable<Set>(null);

            this.series = ko.observableArray<Serie>();
            this.removedSeries = new Resco.Dictionary<string, Serie>();

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

            this.status = ko.observable<SetStatus>(SetStatus.Queued);
            this.status.subscribe(value => {
                switch (value) {
                    case SetStatus.Queued:
                        Program.instance.clearTimer(this.m_runningTimer);
                        if (this.series().length > 0)
                            this.series()[0].status(SerieStatus.Queued);
                        break;

                    case SetStatus.Finished:
                        Program.instance.clearTimer(this.m_runningTimer);
                        this.uiOptionsPanelState(OptionPanelState.Closed);
                        break;

                    case SetStatus.Running:
                        if (!this.m_runningTimer) {
                            this.m_runningTimer = new GlobalTimer();
                            this.m_runningTimer.fn = this._onRunningTick.bind(this);
                            Program.instance.GlobalTimer.push(this.m_runningTimer);
                        }
                        break;

                    case SetStatus.Ready:
                        if (this.series().length > 0)
                            this.series()[0].status(SerieStatus.Ready);
                        break;
                }
            }, this);

            this.uiAverageDifficulty = ko.computed(() => {
                if (this.status() === SetStatus.Finished && this.series().length > 0) {
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

            this.uiOptionsContentTemplate = ko.observable<string>("tmplOptionsSetSettings");
            this.uiOptionsPanelState = ko.observable<OptionPanelState>(OptionPanelState.Closed);
        }

        public pause(): void {
            let activeSerie = this.series().firstOrDefault(serie => serie.status() === SerieStatus.Running);
            if (activeSerie) {
                activeSerie.pause();
                if (this.status() === SetStatus.Running)
                    this.status(SetStatus.Paused);
            }
        }

        public resume(bIgnorePaused: boolean): void {
            if (this.status() === SetStatus.Paused && (bIgnorePaused || !this.series().firstOrDefault(serie => serie.status() === SerieStatus.Paused)))
                this.status(SetStatus.Running);

            this.parent.resume();
        }

        public addSerie(serie: Serie): void {
            let index = this.series().length;
            serie.parent = this;
            serie.order(index + 1);

            this.series.push(serie);
            if (index > 0) {
                this.series()[index - 1].next(serie);
                serie.previous(this.series()[index - 1]);
            }

            if (this.exercises().indexOf(serie.exercise) < 0)
                this.exercises().push(serie.exercise);
        }

        private _onRunningTick(context: any): void {
            this.duration(this.duration() + 1);
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
            let set = (<Workout>this.parent).sets().filter(s => s.status() === SetStatus.Running || s.status() === SetStatus.Ready);
            if (set.length > 0)
                (<Workout>this.parent).displayedSet(set[0]);
        }

        public showHideSettings(): void {
            this.uiOptionsPanelState(this.uiOptionsPanelState() === OptionPanelState.Closed ? OptionPanelState.Opened : OptionPanelState.Closed);
        }

        public moveDown(): void {
            if (this.next()) {
                let sets = this.parent.sets();
                sets.splice(this.order() - 1, 1);
                sets.splice(this.order(), 0, this);
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

                if (this.status() === SetStatus.Ready) {
                    let currentBreak = this.series().length > 0 ? this.series()[0].break() : 0;

                    this.status(SetStatus.Queued);
                    if (this.previous().series().length > 0 && currentBreak > 0) {
                        this.previous().status(SetStatus.Ready);
                        this.previous().series()[0].break(currentBreak);
                    }
                }
            }
        }

        public moveUp(): void {
            if (this.previous() && (this.previous().status() === SetStatus.Queued || this.previous().status() === SetStatus.Ready)) {
                let sets = this.parent.sets();
                sets.splice(this.order() - 1, 1);
                sets.splice(this.order() - 2, 0, this);
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

                if (this.next().status() === SetStatus.Ready) {
                    let currentBreak = this.next().series().length > 0 ? this.next().series()[0].break() : 0;

                    this.next().status(SetStatus.Queued);
                    if (this.series().length > 0 && currentBreak > 0) {
                        this.status(SetStatus.Ready);
                        this.series()[0].break(currentBreak);
                    }
                }
            }
        }

        public remove(bAskConfirm: boolean = true): void {
            if (bAskConfirm) {
                let confirm = new MessageBox("Do you want to remove the entire set?", ["Yes"], "No");
                confirm.closed.add(this, (sender, e) => this._removeSet());
                confirm.show();
            }
            else {
                this._removeSet();
            }
        }

        private _removeSet(): void {
            this.parent.sets.splice(this.order() - 1, 1);
            if (this.id && !this.parent.removedSets.containsKey(this.id))
                this.parent.removedSets.set(this.id, this);

            this.series().forEach(serie => serie.remove(false), this);

            if (this.previous())
                this.previous().next(this.next());

            let next = this.next();
            if (next) {
                next.previous(this.previous());

                if (this.status() === SetStatus.Ready) {
                    next.status(SetStatus.Ready);
                    this.parent.displayedSet(next);
                }
            }

            while (next) {
                next.order(next.order() - 1);
                next = next.next();
            }
        }

        public copyTo(dst: Set): void {
            super.copyTo(dst);
            dst.duration(this.duration());
            dst.series([]);
            dst.next(this.next());
            dst.previous(this.previous());
            this.series().forEach(serie => dst.addSerie(serie.clone()));
        }

        public clone(): Set {
            let result = new Set();
            this.copyTo(result);
            return result;
        }

        public modifySet(set: Set): void {
            //todo: clone set and modify it only if dialogresult = true
            set.pause();
            let clonedSet = set.clone();
            let dialog = new ModifySetDialog(clonedSet);
            dialog.closing.add(this, (sender, e) => {
                if (clonedSet.series().length === 0) {
                    let alert = new MessageBox("Set cannot be empty");
                    alert.show();
                    e.cancel = true;
                }
            });

            dialog.closed.add(this, (sender, e) => {
                if (dialog.dialogResult) {
                    let series = set.series();

                    series.forEach(oldSerie => {
                        // if there is not a serie with old id in new set of series, add it to deleted series, it must be removed from
                        if (!clonedSet.series().firstOrDefault(clonedSerie => clonedSerie.id === oldSerie.id) && oldSerie.id && !set.removedSeries.containsKey(oldSerie.id))
                            set.removedSeries.set(oldSerie.id, oldSerie);
                    }, this);

                    clonedSet.copyTo(set);
                    series = set.series();
                    set.uiOptionsPanelState(OptionPanelState.Closed);
                    // if we removed all active series. then complete this st and ready the next one
                    if (set.series()[set.series().length - 1].status() === SerieStatus.Finished) {
                        set.status(SetStatus.Finished);
                        if (set.next())
                            set.next().status(SetStatus.Ready);
                    }

                    // if this is running set and we removed serie that was ready, make ready first queued serie
                    if (set.status() !== SetStatus.Finished && set.status() !== SetStatus.Queued && !series.some(s => s.status() === SerieStatus.Ready)) {
                        for (let i = 0; i < series.length; i++) {
                            if (series[i].status() === SerieStatus.Queued)
                                series[i].status(SerieStatus.Ready);
                        }
                    }

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
                    serie.amount = 0;
                    serie.reps = 0;
                    this.addSerie(serie);
                }
            });
            Program.instance.showDialog(dialog);
        }

        private m_timer: number;
        private m_runningTimer: GlobalTimer;
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
        public selectedCategory: KnockoutObservable<Category>;
        public selectedExercise: KnockoutObservable<Exercise>;

        public selectBoxCategory: Resco.Controls.SelectBox<Category>;
        public selectBoxExercise: Resco.Controls.SelectBox<Exercise>;

        private m_exercises: Exercise[];

        constructor(categories: Category[], exercises: Exercise[]) {
            super();

            this.name("Add Serie");
            this.uiContentTemplateName("tmplAddSerieDialog");

            this.selectBoxCategory = new Resco.Controls.SelectBox<Category>();
            this.selectBoxCategory.items(categories);
            this.selectBoxCategory.itemLabel("name");
            this.selectBoxCategory.selectText("Please select a category...");
            this.selectBoxCategory.selecteItemChanged.add(this, (sender, args) => {
                this.selectedCategory(args.item);
                if (args.item)
                    this.selectBoxExercise.items(this.m_exercises.filter(exc => exc.category === args.item));
                else
                    this.selectBoxExercise.items([]);

                this.selectBoxExercise.selectedItem(null);
                this.selectBoxExercise.isExpanded(false);
                this.selectedExercise(null);
            });

            this.selectBoxExercise = new Resco.Controls.SelectBox<Exercise>();
            this.selectBoxExercise.itemLabel("name");
            this.selectBoxExercise.selectText("Please select an exercise...");
            this.selectBoxExercise.selecteItemChanged.add(this, (sender, args) => {
                this.selectedExercise(args.item);
            });

            this.categories = categories;
            this.m_exercises = exercises;

            this.selectedCategory = ko.observable<Category>();
            this.selectedExercise = ko.observable<Exercise>();
        }
    }

    export enum SetStatus {
        Queued = 1,
        Finished = 2,
        Ready = 10000,
        Running = 10001,
        Paused = 10002
    }
}