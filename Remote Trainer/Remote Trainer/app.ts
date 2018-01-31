module RemoteTrainer {
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
        //public activeSet: KnockoutObservable<Data.Set>;
        public uiContentTemplateName: KnockoutObservable<string>;
        public uiSelectedTabIndex: KnockoutObservable<number>;

        public GlobalTimer: GlobalTimer[] = [];

        constructor() {
            this.uiSelectedTabIndex = ko.observable<number>(0);
            this.uiContentTemplateName = ko.observable<string>("tmplWorkoutDetails");

            window.setInterval(() => {
                Program.instance.GlobalTimer.forEach(timer => timer.fn(timer.context));
            }, 1000);

        }

        public runApplication() {
            this._createDemoData();
            this.workout = ko.observable<Data.Workout>(new Data.Workout(this.m_workoutTemplate));
            this.workout().start();
            ko.applyBindings(this);
        }

        public onTabItemClicked(itemName: string): void {
            switch (itemName) {
                case "Workout":
                    this.uiContentTemplateName("tmplWorkoutDetails");
                    this.uiSelectedTabIndex(0);
                    break;
                case "Set":
                    this.uiContentTemplateName("tmplSetDetails");
                    this.uiSelectedTabIndex(1);
                    break;
                case "Serie":
                    this.uiContentTemplateName("tmplSerieDetails");
                    this.uiSelectedTabIndex(2);
                    break;
            }
        }

        private _createDemoData() {
            this.m_categories = [new Data.Category("Brucho", "#eeece1", "#ddd9c4"),
                new Data.Category("Cardio", "blue", "navy"),
                new Data.Category("Prsia", "#dce6f1", "#b8cce4"),
                new Data.Category("Nohy", "#daeef3", "#b7dee8"),
                new Data.Category("Ramena", "#fde9d9", "#fcd5b4"),
				new Data.Category("Biceps", "#f2dcdb", "#e6b8b7"),
				new Data.Category("Chrbat", "#ebf1de", "#d8e4bc"),
				new Data.Category("Triceps", "#e4dfec", "#ccc0da")];

            this.m_exercises = [];
            var exercise = new Data.Exercise();
            exercise.category = this.m_categories[0];
            exercise.name = "Skracovacky";
            exercise.uoa = Data.UnitOfAmount.kg;
			exercise.uor = Data.UnitOfRepetitions.reps;
			exercise.averageDurationPerRep = 1;
            this.m_exercises.push(exercise);
            exercise = new Data.Exercise();
            exercise.category = this.m_categories[0];
            exercise.name = "Pritahy k brade na lavicke";
            exercise.uoa = Data.UnitOfAmount.none;
            exercise.uor = Data.UnitOfRepetitions.reps;
			exercise.averageDurationPerRep = 1;
            this.m_exercises.push(exercise);
            exercise = new Data.Exercise();
            exercise.category = this.m_categories[0];
            exercise.name = "Skracovacky na stroji";
            exercise.uoa = Data.UnitOfAmount.kg;
            exercise.uor = Data.UnitOfRepetitions.reps;
			exercise.averageDurationPerRep = 1.5;
            this.m_exercises.push(exercise);
            exercise = new Data.Exercise();
            exercise.category = this.m_categories[0];
            exercise.name = "Vytacanie do boku";
            exercise.uoa = Data.UnitOfAmount.kg;
            exercise.uor = Data.UnitOfRepetitions.reps;
			exercise.averageDurationPerRep = 2.5;
            this.m_exercises.push(exercise);
            exercise = new Data.Exercise();
            exercise.category = this.m_categories[2];
            exercise.name = "Tlaky v sede na stroji";
            exercise.uoa = Data.UnitOfAmount.kg;
            exercise.uor = Data.UnitOfRepetitions.reps;
			exercise.averageDurationPerRep = 3;
            this.m_exercises.push(exercise);
            exercise = new Data.Exercise();
            exercise.category = this.m_categories[2];
            exercise.name = "Bench sikma dole";
            exercise.uoa = Data.UnitOfAmount.kg;
            exercise.uor = Data.UnitOfRepetitions.reps;
			exercise.averageDurationPerRep = 3;
            this.m_exercises.push(exercise);
            exercise = new Data.Exercise();
            exercise.category = this.m_categories[3];
            exercise.name = "Drepy v raily";
            exercise.uoa = Data.UnitOfAmount.kg;
            exercise.uor = Data.UnitOfRepetitions.reps;
			exercise.averageDurationPerRep = 3;
            this.m_exercises.push(exercise);
            exercise = new Data.Exercise();
            exercise.category = this.m_categories[3];
            exercise.name = "Kracanie so zatazou";
            exercise.uoa = Data.UnitOfAmount.kg;
            exercise.uor = Data.UnitOfRepetitions.reps;
			exercise.averageDurationPerRep = 3;
            this.m_exercises.push(exercise);
            exercise = new Data.Exercise();
            exercise.category = this.m_categories[3];
            exercise.name = "Predkopavanie";
            exercise.uoa = Data.UnitOfAmount.kg;
            exercise.uor = Data.UnitOfRepetitions.reps;
			exercise.averageDurationPerRep = 1;
            this.m_exercises.push(exercise);
            exercise = new Data.Exercise();
            exercise.category = this.m_categories[3];
            exercise.name = "Zakopavanie";
            exercise.uoa = Data.UnitOfAmount.kg;
            exercise.uor = Data.UnitOfRepetitions.reps;
			exercise.averageDurationPerRep = 1;
            this.m_exercises.push(exercise);
            exercise = new Data.Exercise();
            exercise.category = this.m_categories[3];
            exercise.name = "Lytka sikma";
            exercise.uoa = Data.UnitOfAmount.kg;
            exercise.uor = Data.UnitOfRepetitions.reps;
			exercise.averageDurationPerRep = 1.5;
            this.m_exercises.push(exercise);
            exercise = new Data.Exercise();
            exercise.category = this.m_categories[4];
            exercise.name = "Upazovanie s cinkami";
            exercise.uoa = Data.UnitOfAmount.kg;
            exercise.uor = Data.UnitOfRepetitions.reps;
			exercise.averageDurationPerRep = 4;
            this.m_exercises.push(exercise);
            exercise = new Data.Exercise();
            exercise.category = this.m_categories[4];
            exercise.name = "Predpazovanie s cinkami";
            exercise.uoa = Data.UnitOfAmount.kg;
            exercise.uor = Data.UnitOfRepetitions.reps;
			exercise.averageDurationPerRep = 4;
            this.m_exercises.push(exercise);
            exercise = new Data.Exercise();
            exercise.category = this.m_categories[4];
            exercise.name = "Tlak na stroji";
            exercise.uoa = Data.UnitOfAmount.kg;
            exercise.uor = Data.UnitOfRepetitions.reps;
			exercise.averageDurationPerRep = 3;
            this.m_exercises.push(exercise);
            exercise = new Data.Exercise();
            exercise.category = this.m_categories[4];
            exercise.name = "Trapezy";
            exercise.uoa = Data.UnitOfAmount.kg;
            exercise.uor = Data.UnitOfRepetitions.reps;
			exercise.averageDurationPerRep = 2;
            this.m_exercises.push(exercise);
            exercise = new Data.Exercise();
            exercise = new Data.Exercise();
            exercise.category = this.m_categories[0];
            exercise.name = "Plank";
            exercise.uoa = Data.UnitOfAmount.none;
            exercise.uor = Data.UnitOfRepetitions.sec;
			exercise.averageDurationPerRep = 1;
            this.m_exercises.push(exercise);

            this.m_workoutTemplate = new Data.WorkoutTemplate();
            this.m_workoutTemplate.name = "Chrbat / Triceps"
            this.m_workoutTemplate.description = "Bla bla bla bla..."

            var set = new Data.SetTemplate();
            var serie1 = new Data.SerieTemplate(this.m_exercises[7], 20, 10);
            set.addSerie(serie1);
            set.addSerie(serie1.clone());
            set.addSerie(serie1.clone());

            this.m_workoutTemplate.addSet(set);

            set = new Data.SetTemplate();
            serie1 = new Data.SerieTemplate(this.m_exercises[6], 10, 50);
            var serie2 = new Data.SerieTemplate(this.m_exercises[1], 30);
            set.addSerie(serie1);
            set.addSerie(serie2);
            set.addSerie(serie1.clone());
            set.addSerie(serie2.clone());
            set.addSerie(serie1.clone());
            set.addSerie(serie2.clone());

            this.m_workoutTemplate.addSet(set);

            set = new Data.SetTemplate();
            serie1 = new Data.SerieTemplate(this.m_exercises[8], 10, 50);
            serie2 = new Data.SerieTemplate(this.m_exercises[2], 15, 70);
            set.addSerie(serie1);
            set.addSerie(serie2);
            set.addSerie(serie1.clone());
            set.addSerie(serie2.clone());
            set.addSerie(serie1.clone());
            set.addSerie(serie2.clone());

            this.m_workoutTemplate.addSet(set);

            set = new Data.SetTemplate();
            serie1 = new Data.SerieTemplate(this.m_exercises[9], 15, 35);
            set.addSerie(serie1);
            set.addSerie(serie1.clone());
            set.addSerie(serie1.clone());

            this.m_workoutTemplate.addSet(set);

            set = new Data.SetTemplate();
            serie1 = new Data.SerieTemplate(this.m_exercises[10], 10, 120);
            serie2 = new Data.SerieTemplate(this.m_exercises[3], 10, 15);
            set.addSerie(serie1);
            set.addSerie(serie2);
            set.addSerie(serie1.clone());
            set.addSerie(serie2.clone());
            set.addSerie(serie1.clone());
            set.addSerie(serie2.clone());

            this.m_workoutTemplate.addSet(set);

            set = new Data.SetTemplate();
            serie1 = new Data.SerieTemplate(this.m_exercises[11], 10, 8);
            set.addSerie(serie1);
            serie2 = serie1.clone();
            serie2.reps = 8;
            set.addSerie(serie2);
            serie2 = serie1.clone();
            serie2.reps = 6;
            set.addSerie(serie2);

            this.m_workoutTemplate.addSet(set);

            set = new Data.SetTemplate();
            serie1 = new Data.SerieTemplate(this.m_exercises[12], 10, 10);
            set.addSerie(serie1);
            set.addSerie(serie1.clone());
            set.addSerie(serie1.clone());

            this.m_workoutTemplate.addSet(set);

            set = new Data.SetTemplate();
            serie1 = new Data.SerieTemplate(this.m_exercises[13], 10, 35);
            set.addSerie(serie1);
            set.addSerie(serie1.clone());
            set.addSerie(serie1.clone());

            this.m_workoutTemplate.addSet(set);

            set = new Data.SetTemplate();
            serie1 = new Data.SerieTemplate(this.m_exercises[14], 10, 20);
            serie2 = new Data.SerieTemplate(this.m_exercises[15], 75);
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
            var minutes = (span / 60).toFixed(0);
            var seconds = span % 60;
            return (minutes.length < 2 ? "0" : "") + minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
        }

        private m_categories: Data.Category[];
        private m_exercises: Data.Exercise[];
        private m_workoutTemplate: Data.WorkoutTemplate;
    }
}