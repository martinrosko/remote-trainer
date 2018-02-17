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
        public uiStatus: KnockoutComputed<SetStatus>;
        public uiAverageDifficulty: KnockoutComputed<string>;
        public duration: KnockoutObservable<number>; 
        public uiDurationLabel: KnockoutComputed<string>;
        public exercising: KnockoutComputed<number>;
        public uiExercisingLabel: KnockoutComputed<string>;
        public series: KnockoutObservableArray<Serie>;
        public removedSeries: string[]; // just ids
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
            this.removedSeries = [];

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

            this.uiStatus = ko.computed(() => {
                let status = this.status();

                if ((status === SetStatus.Ready || status === SetStatus.Running) && (this.parent && this.parent.status() === WorkoutStatus.Paused))
                    return SetStatus.Paused;

                return status;
            }, this);

            this.uiStatus.subscribe(value => {
                switch (value) {
                    case SetStatus.Queued:
                    case SetStatus.Paused:
                    case SetStatus.Finished:
                        this._removeRunningTimer();
                        break;

                    case SetStatus.Running:
                        this.m_runningTimer = new GlobalTimer();
                        this.m_runningTimer.fn = this._onRunningTick.bind(this);
                        Program.instance.GlobalTimer.push(this.m_runningTimer);
                        break;

                    case SetStatus.Ready:
                        if (this.series().length > 0)
                            this.series()[0].status(SerieStatus.Ready);
                        break;
                }
            }, this);

            this.uiAverageDifficulty = ko.computed(() => {
                if (this.uiStatus() === SetStatus.Finished && this.series().length > 0) {
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

        private _removeRunningTimer(): void {
            let runningTimerIndex = Program.instance.GlobalTimer.indexOf(this.m_runningTimer);
            if (runningTimerIndex >= 0)
                Program.instance.GlobalTimer.splice(runningTimerIndex, 1);
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

        public resume(): void {
            this.m_runningTimer = new GlobalTimer();
            this.m_runningTimer.context = Math.round(Date.now() / 1000);
            this.m_runningTimer.fn = this._onRunningTick.bind(this);
            Program.instance.GlobalTimer.push(this.m_runningTimer);
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

                //if (this.uiStatus() === SetStatus.Ready) {
                //    this.previous().ready(this.series()[0].break());    // set the actual lenght of current break to new set that is ready
                //    this.queue();
                //}
            }
        }

        public moveUp(): void {
            if (this.previous() && (this.previous().uiStatus() === SetStatus.Queued || this.previous().uiStatus() === SetStatus.Ready)) {
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

                //if (this.next().uiStatus() === SetStatus.Ready) {
                //    this.ready(this.next().series()[0].break());
                //    this.next().queue();
                //}
            }
        }

        public remove(): void {
            if (confirm("Remove the entire set?")) {
                this.parent.sets.splice(this.order() - 1, 1);
                if (this.parent.removedSets.indexOf(this.id) < 0)
                    this.parent.removedSets.push(this.id);

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

        public copyTo(dst: Set): void {
            super.copyTo(dst);
            dst.duration(this.duration());
            dst.series([]);
            this.series().forEach(serie => dst.addSerie(serie.clone()));
        }

        public clone(): Set {
            let result = new Set();
            this.copyTo(result);
            return result;
        }

        public modifySet(set: Set): void {
            //todo: clone set and modify it only if dialogresult = true
            let clonedSet = set.clone();
            let dialog = new ModifySetDialog(clonedSet);
            dialog.closed.add(this, (sender, e) => {
                if (dialog.dialogResult) {
                    let series = set.series();

                    series.forEach(oldSerie => {
                        // if there is not a serie with old id in new set of series, add it to deleted series, it must be removed from
                        if (!clonedSet.series().firstOrDefault(clonedSerie => clonedSerie.id === oldSerie.id) && set.removedSeries.indexOf(oldSerie.id) < 0)
                            set.removedSeries.push(oldSerie.id);
                    }, this);

                    clonedSet.copyTo(set);
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

    export enum SetStatus {
        Queued = 1,
        Finished = 2,
        Ready = 10000,
        Running = 10001,
        Paused = 10002
    }
}