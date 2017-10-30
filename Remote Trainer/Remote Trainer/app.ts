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
                new Data.Category("Prsia", "#dce6f1", "#b8cce4")];

            this.m_exercises = [];
            var exercise = new Data.Exercise();
            exercise.category = this.m_categories[0];
            exercise.name = "Skracovacky";
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

            this.m_setTemplates = [];
            var set = new Data.SetTemplate();
            set.order = 1;
            set.serieTemplates = [];

            var serie1 = new Data.SerieTemplate(this.m_exercises[1], 10, 70);
            var serie2 = new Data.SerieTemplate(this.m_exercises[0], 45);
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

            serie1 = new Data.SerieTemplate(this.m_exercises[2], 10, 50);
            set.addSerie(serie1);
            set.addSerie(serie1.clone());
            set.addSerie(serie1.clone());

            this.m_setTemplates.push(set);
        }

        private m_categories: Data.Category[];
        private m_exercises: Data.Exercise[];
        public m_setTemplates: Data.SetTemplate[];
        public index = 0;
    }
}