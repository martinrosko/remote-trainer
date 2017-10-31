module RemoteTrainer {
    export class Program {
        private static s_instance: Program;
        static get instance(): Program {
            if (!Program.s_instance)
                Program.s_instance = new Program();
            return Program.s_instance;
        }

        public set: KnockoutObservable<Data.Set>;

        public runApplication() {
            this._createDemoData();

            this.set = ko.observable<Data.Set>(new Data.Set(this.m_setTemplates[0]));
            this.set().series()[0].uiStatus(Data.SerieStatus.Ready);

            //serie.uiStartedOn(new Date(Date.now()));
            //serie.uiFinishedOn(new Date(Date.now()));

            ko.applyBindings(this);
        }

        private _createDemoData() {
            this.m_categories = [new Data.Category("Brucho", "#eeece1", "#ddd9c4"),
                new Data.Category("Cardio", "blue", "navy"),
                new Data.Category("Prsia", "#dce6f1", "#b8cce4"),
                new Data.Category("Nohy", "#dce6f1", "#b8cce4"),
                new Data.Category("Ramena", "#dce6f1", "#b8cce4")];

            this.m_exercises = [];
            var exercise = new Data.Exercise();
            exercise.category = this.m_categories[0];
            exercise.name = "Skracovacky";
            exercise.uoa = Data.UnitOfAmount.kg;
            exercise.uor = Data.UnitOfRepetitions.reps;
            this.m_exercises.push(exercise);
            exercise = new Data.Exercise();
            exercise.category = this.m_categories[0];
            exercise.name = "Pritahy k brade na lavicke";
            exercise.uoa = Data.UnitOfAmount.none;
            exercise.uor = Data.UnitOfRepetitions.reps;
            this.m_exercises.push(exercise);
            exercise = new Data.Exercise();
            exercise.category = this.m_categories[0];
            exercise.name = "Skracovacky na stroji";
            exercise.uoa = Data.UnitOfAmount.kg;
            exercise.uor = Data.UnitOfRepetitions.reps;
            this.m_exercises.push(exercise);
            exercise = new Data.Exercise();
            exercise.category = this.m_categories[0];
            exercise.name = "Vytacanie do boku";
            exercise.uoa = Data.UnitOfAmount.kg;
            exercise.uor = Data.UnitOfRepetitions.reps;
            this.m_exercises.push(exercise);
            exercise = new Data.Exercise();
            exercise.category = this.m_categories[2];
            exercise.name = "Tlaky v sede na stroji";
            exercise.uoa = Data.UnitOfAmount.kg;
            exercise.uor = Data.UnitOfRepetitions.reps;
            this.m_exercises.push(exercise);
            exercise = new Data.Exercise();
            exercise.category = this.m_categories[2];
            exercise.name = "Bench sikma dole";
            exercise.uoa = Data.UnitOfAmount.kg;
            exercise.uor = Data.UnitOfRepetitions.reps;
            this.m_exercises.push(exercise);
            exercise = new Data.Exercise();
            exercise.category = this.m_categories[3];
            exercise.name = "Drepy v raily";
            exercise.uoa = Data.UnitOfAmount.kg;
            exercise.uor = Data.UnitOfRepetitions.reps;
            this.m_exercises.push(exercise);
            exercise = new Data.Exercise();
            exercise.category = this.m_categories[3];
            exercise.name = "Kracanie so zatazou";
            exercise.uoa = Data.UnitOfAmount.kg;
            exercise.uor = Data.UnitOfRepetitions.reps;
            this.m_exercises.push(exercise);
            exercise = new Data.Exercise();
            exercise.category = this.m_categories[3];
            exercise.name = "Predkopavanie";
            exercise.uoa = Data.UnitOfAmount.kg;
            exercise.uor = Data.UnitOfRepetitions.reps;
            this.m_exercises.push(exercise);
            exercise = new Data.Exercise();
            exercise.category = this.m_categories[3];
            exercise.name = "Zakopavanie";
            exercise.uoa = Data.UnitOfAmount.kg;
            exercise.uor = Data.UnitOfRepetitions.reps;
            this.m_exercises.push(exercise);
            exercise = new Data.Exercise();
            exercise.category = this.m_categories[3];
            exercise.name = "Lytka sikma";
            exercise.uoa = Data.UnitOfAmount.kg;
            exercise.uor = Data.UnitOfRepetitions.reps;
            this.m_exercises.push(exercise);
            exercise = new Data.Exercise();
            exercise.category = this.m_categories[4];
            exercise.name = "Upazovanie s cinkami";
            exercise.uoa = Data.UnitOfAmount.kg;
            exercise.uor = Data.UnitOfRepetitions.reps;
            this.m_exercises.push(exercise);
            exercise = new Data.Exercise();
            exercise.category = this.m_categories[4];
            exercise.name = "Predpazovanie s cinkami";
            exercise.uoa = Data.UnitOfAmount.kg;
            exercise.uor = Data.UnitOfRepetitions.reps;
            this.m_exercises.push(exercise);
            exercise = new Data.Exercise();
            exercise.category = this.m_categories[4];
            exercise.name = "Tlak na stroji";
            exercise.uoa = Data.UnitOfAmount.kg;
            exercise.uor = Data.UnitOfRepetitions.reps;
            this.m_exercises.push(exercise);
            exercise = new Data.Exercise();
            exercise.category = this.m_categories[4];
            exercise.name = "Trapezy";
            exercise.uoa = Data.UnitOfAmount.kg;
            exercise.uor = Data.UnitOfRepetitions.reps;
            this.m_exercises.push(exercise);
            exercise = new Data.Exercise();
            exercise = new Data.Exercise();
            exercise.category = this.m_categories[0];
            exercise.name = "Plank";
            exercise.uoa = Data.UnitOfAmount.none;
            exercise.uor = Data.UnitOfRepetitions.sec;
            this.m_exercises.push(exercise);


            this.m_setTemplates = [];
            var set = new Data.SetTemplate();
            set.order = 1;
            set.serieTemplates = [];

            var serie1 = new Data.SerieTemplate(this.m_exercises[6], 10, 50);
            var serie2 = new Data.SerieTemplate(this.m_exercises[1], 30);
            set.addSerie(serie1);
            set.addSerie(serie2);
            set.addSerie(serie1.clone());
            set.addSerie(serie2.clone());
            set.addSerie(serie1.clone());
            set.addSerie(serie2.clone());

            this.m_setTemplates.push(set);

            set = new Data.SetTemplate();
            set.order = 2;
            set.serieTemplates = [];

            serie1 = new Data.SerieTemplate(this.m_exercises[7], 20, 10);
            set.addSerie(serie1);
            set.addSerie(serie1.clone());
            set.addSerie(serie1.clone());

            this.m_setTemplates.push(set);

            set = new Data.SetTemplate();
            set.order = 3;
            set.serieTemplates = [];

            serie1 = new Data.SerieTemplate(this.m_exercises[8], 10, 50);
            serie2 = new Data.SerieTemplate(this.m_exercises[2], 15, 70);
            set.addSerie(serie1);
            set.addSerie(serie2);
            set.addSerie(serie1.clone());
            set.addSerie(serie2.clone());
            set.addSerie(serie1.clone());
            set.addSerie(serie2.clone());

            this.m_setTemplates.push(set);

            set = new Data.SetTemplate();
            set.order = 4;
            set.serieTemplates = [];

            serie1 = new Data.SerieTemplate(this.m_exercises[9], 15, 35);
            set.addSerie(serie1);
            set.addSerie(serie1.clone());
            set.addSerie(serie1.clone());

            this.m_setTemplates.push(set);

            set = new Data.SetTemplate();
            set.order = 5;
            set.serieTemplates = [];

            serie1 = new Data.SerieTemplate(this.m_exercises[10], 10, 120);
            serie2 = new Data.SerieTemplate(this.m_exercises[3], 10, 15);
            set.addSerie(serie1);
            set.addSerie(serie2);
            set.addSerie(serie1.clone());
            set.addSerie(serie2.clone());
            set.addSerie(serie1.clone());
            set.addSerie(serie2.clone());

            this.m_setTemplates.push(set);

            set = new Data.SetTemplate();
            set.order = 6;
            set.serieTemplates = [];

            serie1 = new Data.SerieTemplate(this.m_exercises[11], 10, 8);
            set.addSerie(serie1);
            serie2 = serie1.clone();
            serie2.reps = 8;
            set.addSerie(serie2);
            serie2 = serie1.clone();
            serie2.reps = 6;
            set.addSerie(serie2);

            this.m_setTemplates.push(set);

            set = new Data.SetTemplate();
            set.order = 7;
            set.serieTemplates = [];

            serie1 = new Data.SerieTemplate(this.m_exercises[12], 10, 10);
            set.addSerie(serie1);
            set.addSerie(serie1.clone());
            set.addSerie(serie1.clone());

            this.m_setTemplates.push(set);

            set = new Data.SetTemplate();
            set.order = 8;
            set.serieTemplates = [];

            serie1 = new Data.SerieTemplate(this.m_exercises[13], 10, 35);
            set.addSerie(serie1);
            set.addSerie(serie1.clone());
            set.addSerie(serie1.clone());

            this.m_setTemplates.push(set);

            set = new Data.SetTemplate();
            set.order = 9;
            set.serieTemplates = [];

            serie1 = new Data.SerieTemplate(this.m_exercises[14], 10, 20);
            serie2 = new Data.SerieTemplate(this.m_exercises[15], 75);
            set.addSerie(serie1);
            set.addSerie(serie2);
            set.addSerie(serie1.clone());
            set.addSerie(serie2.clone());
            set.addSerie(serie1.clone());
            set.addSerie(serie2.clone());

            this.m_setTemplates.push(set);
        }

        private m_categories: Data.Category[];
        private m_exercises: Data.Exercise[];
        public m_setTemplates: Data.SetTemplate[];
        public index = 0;
    }
}