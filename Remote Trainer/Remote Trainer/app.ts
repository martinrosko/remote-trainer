﻿module RemoteTrainer {
    export const DEMODATA = true;

    export class GlobalTimer {
        public fn: (context: any) => void;
        public context: any;
    }

    export class Program {
        private static s_instance: Program;
        static get instance(): Program {
            if (!Program.s_instance)
                Program.s_instance = new Program();
            return Program.s_instance;
        }

        public workout: KnockoutObservable<Data.Workout>;
        public uiContentTemplateName: KnockoutObservable<string>;
        public uiFooterTemplateName: KnockoutObservable<string>;
        public uiSelectedTabIndex: KnockoutObservable<number>;

        public dialogs: KnockoutObservableArray<Dialog>;

        public GlobalTimer: GlobalTimer[] = [];

        private m_dataProvider: Service.IDataProvider;

        constructor() {
            this.uiSelectedTabIndex = ko.observable<number>(0);
            this.uiContentTemplateName = ko.observable<string>("tmplOverview");    
            this.uiFooterTemplateName = ko.observable<string>();

            this.dialogs = ko.observableArray<Dialog>();

            window.setInterval(() => {
                Program.instance.GlobalTimer.forEach(timer => timer.fn(timer.context));
            }, 1000);
        }

        public runApplication(workoutId: string) {
            if (RemoteTrainer.DEMODATA) {
                this._createDemoData();
                this.workout = ko.observable<Data.Workout>(new Data.Workout(this.m_workoutTemplate));
                ko.applyBindings(this);
            }
            else {
                this.m_dataProvider = new Service.JSBridgeProvider();

                this.m_dataProvider.initialize((categories, exercises, workouts) => {
                    this.categories = categories;
                    this.exercises = exercises;
                    this.m_workoutTemplates = workouts;

                    if (!workoutId) {
                        let workoutTemplate = this.m_workoutTemplates.filter(wt => wt.name.startsWith("Chrbat"));

                        this.m_dataProvider.instantiateWorkout(workoutTemplate[0], "FitUP: Chrbat, Triceps", new Date(2018, 1, 17, 8));
                    }
                    else {
                        this.m_dataProvider.loadWorkout(workoutId, workout => {
                            this.workout = ko.observable(workout);

                            MobileCRM.UI.EntityForm.requestObject(function (entityForm) {
                                entityForm.form.caption = this.workout().name;
                                entityForm.isDirty = true;
                            }, function (err) {
                                MobileCRM.bridge.alert("Unable to set dirty flag");
                                }, this);

                            MobileCRM.UI.EntityForm.onSave(form => {
                                var suspendHandler = form.suspendSave();

                                this.m_dataProvider.saveWorkout(this.workout(), (error) => suspendHandler.resumeSave(error));
                            }, true, this);

                            ko.applyBindings(this);
                        });
                    }

                });
            }
        }

        public bDisableTabs: boolean = false;

        public onTabItemClicked(itemName: string): void {
            if (this.bDisableTabs)
                return;

            switch (itemName) {
                case "Overview":
                    this.uiContentTemplateName("tmplOverview");
                    this.uiFooterTemplateName("");
                    this.uiSelectedTabIndex(0);
                    break;
                case "Workout":
                    this.uiContentTemplateName("tmplWorkoutDetails");
                    this.uiFooterTemplateName("");
                    this.uiSelectedTabIndex(1);
                    break;
                case "Set":
                    this.uiContentTemplateName("tmplSetDetails");
                    this.uiFooterTemplateName("tmplSetDetailsFooter");
                    this.uiSelectedTabIndex(2);
                    break;
            }
        }

        public showDialog(dialog: Dialog): void {
            dialog.closed.add(this, (sender, e) => {
                this.dialogs.remove(dialog);
            });
            this.dialogs.push(dialog);
        }

        private _createDemoData() {
            this.categories = [new Data.Category("Brucho", "#eeece1", "#ddd9c4"),
                new Data.Category("Cardio", "blue", "navy"),
                new Data.Category("Prsia", "#dce6f1", "#b8cce4"),
                new Data.Category("Nohy", "#daeef3", "#b7dee8"),
                new Data.Category("Ramena", "#fde9d9", "#fcd5b4"),
				new Data.Category("Biceps", "#f2dcdb", "#e6b8b7"),
				new Data.Category("Chrbat", "#ebf1de", "#d8e4bc"),
				new Data.Category("Triceps", "#e4dfec", "#ccc0da")];

            this.exercises = [];
            var exercise = new Data.Exercise();
            exercise.category = this.categories[0];
            exercise.name = "Skracovacky";
            exercise.uoa = Data.UnitOfAmount.kg;
			exercise.uor = Data.UnitOfRepetitions.reps;
			exercise.averageDurationPerRep = 1;
            this.exercises.push(exercise);
            exercise = new Data.Exercise();
            exercise.category = this.categories[0];
            exercise.name = "Pritahy k brade na lavicke";
            exercise.uoa = Data.UnitOfAmount.none;
            exercise.uor = Data.UnitOfRepetitions.reps;
			exercise.averageDurationPerRep = 1;
            this.exercises.push(exercise);
            exercise = new Data.Exercise();
            exercise.category = this.categories[0];
            exercise.name = "Skracovacky na stroji";
            exercise.uoa = Data.UnitOfAmount.kg;
            exercise.uor = Data.UnitOfRepetitions.reps;
			exercise.averageDurationPerRep = 1.5;
            this.exercises.push(exercise);
            exercise = new Data.Exercise();
            exercise.category = this.categories[0];
            exercise.name = "Vytacanie do boku";
            exercise.uoa = Data.UnitOfAmount.kg;
            exercise.uor = Data.UnitOfRepetitions.reps;
			exercise.averageDurationPerRep = 2.5;
            this.exercises.push(exercise);
            exercise = new Data.Exercise();
            exercise.category = this.categories[2];
            exercise.name = "Tlaky v sede na stroji";
            exercise.uoa = Data.UnitOfAmount.kg;
            exercise.uor = Data.UnitOfRepetitions.reps;
			exercise.averageDurationPerRep = 3;
            this.exercises.push(exercise);
            exercise = new Data.Exercise();
            exercise.category = this.categories[2];
            exercise.name = "Bench sikma dole";
            exercise.uoa = Data.UnitOfAmount.kg;
            exercise.uor = Data.UnitOfRepetitions.reps;
			exercise.averageDurationPerRep = 3;
            this.exercises.push(exercise);
            exercise = new Data.Exercise();
            exercise.category = this.categories[3];
            exercise.name = "Drepy v raily";
            exercise.uoa = Data.UnitOfAmount.kg;
            exercise.uor = Data.UnitOfRepetitions.reps;
			exercise.averageDurationPerRep = 3;
            this.exercises.push(exercise);
            exercise = new Data.Exercise();
            exercise.category = this.categories[3];
            exercise.name = "Kracanie so zatazou";
            exercise.uoa = Data.UnitOfAmount.kg;
            exercise.uor = Data.UnitOfRepetitions.reps;
			exercise.averageDurationPerRep = 3;
            this.exercises.push(exercise);
            exercise = new Data.Exercise();
            exercise.category = this.categories[3];
            exercise.name = "Predkopavanie";
            exercise.uoa = Data.UnitOfAmount.kg;
            exercise.uor = Data.UnitOfRepetitions.reps;
			exercise.averageDurationPerRep = 1;
            this.exercises.push(exercise);
            exercise = new Data.Exercise();
            exercise.category = this.categories[3];
            exercise.name = "Zakopavanie";
            exercise.uoa = Data.UnitOfAmount.kg;
            exercise.uor = Data.UnitOfRepetitions.reps;
			exercise.averageDurationPerRep = 1;
            this.exercises.push(exercise);
            exercise = new Data.Exercise();
            exercise.category = this.categories[3];
            exercise.name = "Lytka sikma";
            exercise.uoa = Data.UnitOfAmount.kg;
            exercise.uor = Data.UnitOfRepetitions.reps;
			exercise.averageDurationPerRep = 1.5;
            this.exercises.push(exercise);
            exercise = new Data.Exercise();
            exercise.category = this.categories[4];
            exercise.name = "Upazovanie s cinkami";
            exercise.uoa = Data.UnitOfAmount.kg;
            exercise.uor = Data.UnitOfRepetitions.reps;
			exercise.averageDurationPerRep = 4;
            this.exercises.push(exercise);
            exercise = new Data.Exercise();
            exercise.category = this.categories[4];
            exercise.name = "Predpazovanie s cinkami";
            exercise.uoa = Data.UnitOfAmount.kg;
            exercise.uor = Data.UnitOfRepetitions.reps;
			exercise.averageDurationPerRep = 4;
            this.exercises.push(exercise);
            exercise = new Data.Exercise();
            exercise.category = this.categories[4];
            exercise.name = "Tlak na stroji";
            exercise.uoa = Data.UnitOfAmount.kg;
            exercise.uor = Data.UnitOfRepetitions.reps;
			exercise.averageDurationPerRep = 3;
            this.exercises.push(exercise);
            exercise = new Data.Exercise();
            exercise.category = this.categories[4];
            exercise.name = "Trapezy";
            exercise.uoa = Data.UnitOfAmount.kg;
            exercise.uor = Data.UnitOfRepetitions.reps;
			exercise.averageDurationPerRep = 2;
            this.exercises.push(exercise);
            exercise = new Data.Exercise();
            exercise = new Data.Exercise();
            exercise.category = this.categories[0];
            exercise.name = "Plank";
            exercise.uoa = Data.UnitOfAmount.none;
            exercise.uor = Data.UnitOfRepetitions.sec;
			exercise.averageDurationPerRep = 1;
            this.exercises.push(exercise);

            this.m_workoutTemplate = new Data.WorkoutTemplate();
            this.m_workoutTemplate.name = "Chrbat / Triceps"
            this.m_workoutTemplate.description = "Bla bla bla bla..."

            var set = new Data.SetTemplate();
            set.addSerie(new Data.SerieTemplate(this.exercises[7], 20, 10));
            set.addSerie(new Data.SerieTemplate(this.exercises[7], 20, 10));
            set.addSerie(new Data.SerieTemplate(this.exercises[7], 20, 10));

            this.m_workoutTemplate.addSet(set);

            set = new Data.SetTemplate();
            var serie1 = new Data.SerieTemplate(this.exercises[6], 10, 50);
            var serie2 = new Data.SerieTemplate(this.exercises[1], 30);
            set.addSerie(serie1);
            set.addSerie(serie2);
            set.addSerie(serie1.clone());
            set.addSerie(serie2.clone());
            set.addSerie(serie1.clone());
            set.addSerie(serie2.clone());

            this.m_workoutTemplate.addSet(set);

            set = new Data.SetTemplate();
            serie1 = new Data.SerieTemplate(this.exercises[8], 10, 50);
            serie2 = new Data.SerieTemplate(this.exercises[2], 15, 70);
            set.addSerie(serie1);
            set.addSerie(serie2);
            set.addSerie(serie1.clone());
            set.addSerie(serie2.clone());
            set.addSerie(serie1.clone());
            set.addSerie(serie2.clone());

            this.m_workoutTemplate.addSet(set);

            set = new Data.SetTemplate();
            serie1 = new Data.SerieTemplate(this.exercises[9], 15, 35);
            set.addSerie(serie1);
            set.addSerie(serie1.clone());
            set.addSerie(serie1.clone());

            this.m_workoutTemplate.addSet(set);

            set = new Data.SetTemplate();
            serie1 = new Data.SerieTemplate(this.exercises[10], 10, 120);
            serie2 = new Data.SerieTemplate(this.exercises[3], 10, 15);
            set.addSerie(serie1);
            set.addSerie(serie2);
            set.addSerie(serie1.clone());
            set.addSerie(serie2.clone());
            set.addSerie(serie1.clone());
            set.addSerie(serie2.clone());

            this.m_workoutTemplate.addSet(set);

            set = new Data.SetTemplate();
            serie1 = new Data.SerieTemplate(this.exercises[11], 10, 8);
            set.addSerie(serie1);
            serie2 = serie1.clone();
            serie2.reps = 8;
            set.addSerie(serie2);
            serie2 = serie1.clone();
            serie2.reps = 6;
            set.addSerie(serie2);

            this.m_workoutTemplate.addSet(set);

            set = new Data.SetTemplate();
            serie1 = new Data.SerieTemplate(this.exercises[12], 10, 10);
            set.addSerie(serie1);
            set.addSerie(serie1.clone());
            set.addSerie(serie1.clone());

            this.m_workoutTemplate.addSet(set);

            set = new Data.SetTemplate();
            serie1 = new Data.SerieTemplate(this.exercises[13], 10, 35);
            set.addSerie(serie1);
            set.addSerie(serie1.clone());
            set.addSerie(serie1.clone());

            this.m_workoutTemplate.addSet(set);

            set = new Data.SetTemplate();
            serie1 = new Data.SerieTemplate(this.exercises[14], 10, 20);
            serie2 = new Data.SerieTemplate(this.exercises[15], 75);
            set.addSerie(serie1);
            set.addSerie(serie2);
            set.addSerie(serie1.clone());
            set.addSerie(serie2.clone());
            set.addSerie(serie1.clone());
            set.addSerie(serie2.clone());

            this.m_workoutTemplate.addSet(set);
        }

        // FIXME: move to helper class
        public spanToTimeLabel(span: number): string {
            var hours = Math.floor(span / 3600);
            span = span % 3600;
            var minutes = Math.floor(span / 60);
            var seconds = span % 60;
            return (hours ? (hours + ":") : "") + (minutes > 9 ? "" : "0") + minutes + ":" + (seconds > 9 ? "" : "0") + seconds;
        }

        public categories: Data.Category[];
        public exercises: Data.Exercise[];
        private m_workoutTemplate: Data.WorkoutTemplate;
        private m_workoutTemplates: Data.WorkoutTemplate[];
    }

    export class Dialog {
        public closed: Resco.Event<Resco.EventArgs>;
        public dialogResult: boolean;
        public name: KnockoutObservable<string>;
        public uiContentTemplateName: KnockoutObservable<string>;

        constructor() {
            this.dialogResult = false;
            this.closed = new Resco.Event<Resco.EventArgs>(this);
            this.name = ko.observable<string>();
            this.uiContentTemplateName = ko.observable<string>();
        }

        public done(): void {
            this.dialogResult = true;
            this.closed.raise(Resco.EventArgs.Empty, this);
        }

        public cancel(): void {
            this.dialogResult = false;
            this.closed.raise(Resco.EventArgs.Empty, this);
        }
    }
}