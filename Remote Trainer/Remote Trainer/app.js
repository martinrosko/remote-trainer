var RemoteTrainer;
(function (RemoteTrainer) {
    var GlobalTimer = (function () {
        function GlobalTimer() {
        }
        return GlobalTimer;
    }());
    RemoteTrainer.GlobalTimer = GlobalTimer;
    var Program = (function () {
        function Program() {
            this.GlobalTimer = [];
            this.uiSelectedTabIndex = ko.observable(0);
            this.uiContentTemplateName = ko.observable("tmplWorkoutDetails");
            window.setInterval(function () {
                Program.instance.GlobalTimer.forEach(function (timer) { return timer.fn(timer.context); });
            }, 1000);
        }
        Object.defineProperty(Program, "instance", {
            get: function () {
                if (!Program.s_instance)
                    Program.s_instance = new Program();
                return Program.s_instance;
            },
            enumerable: true,
            configurable: true
        });
        Program.prototype.runApplication = function () {
            this._createDemoData();
            this.workout = ko.observable(new RemoteTrainer.Data.Workout(this.m_workoutTemplate));
            this.workout().start();
            ko.applyBindings(this);
        };
        Program.prototype.onTabItemClicked = function (itemName) {
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
        };
        Program.prototype._createDemoData = function () {
            this.m_categories = [new RemoteTrainer.Data.Category("Brucho", "#eeece1", "#ddd9c4"),
                new RemoteTrainer.Data.Category("Cardio", "blue", "navy"),
                new RemoteTrainer.Data.Category("Prsia", "#dce6f1", "#b8cce4"),
                new RemoteTrainer.Data.Category("Nohy", "#daeef3", "#b7dee8"),
                new RemoteTrainer.Data.Category("Ramena", "#fde9d9", "#fcd5b4"),
                new RemoteTrainer.Data.Category("Biceps", "#f2dcdb", "#e6b8b7"),
                new RemoteTrainer.Data.Category("Chrbat", "#ebf1de", "#d8e4bc"),
                new RemoteTrainer.Data.Category("Triceps", "#e4dfec", "#ccc0da")];
            this.m_exercises = [];
            var exercise = new RemoteTrainer.Data.Exercise();
            exercise.category = this.m_categories[0];
            exercise.name = "Skracovacky";
            exercise.uoa = RemoteTrainer.Data.UnitOfAmount.kg;
            exercise.uor = RemoteTrainer.Data.UnitOfRepetitions.reps;
            exercise.averageDurationPerRep = 1;
            this.m_exercises.push(exercise);
            exercise = new RemoteTrainer.Data.Exercise();
            exercise.category = this.m_categories[0];
            exercise.name = "Pritahy k brade na lavicke";
            exercise.uoa = RemoteTrainer.Data.UnitOfAmount.none;
            exercise.uor = RemoteTrainer.Data.UnitOfRepetitions.reps;
            exercise.averageDurationPerRep = 1;
            this.m_exercises.push(exercise);
            exercise = new RemoteTrainer.Data.Exercise();
            exercise.category = this.m_categories[0];
            exercise.name = "Skracovacky na stroji";
            exercise.uoa = RemoteTrainer.Data.UnitOfAmount.kg;
            exercise.uor = RemoteTrainer.Data.UnitOfRepetitions.reps;
            exercise.averageDurationPerRep = 1.5;
            this.m_exercises.push(exercise);
            exercise = new RemoteTrainer.Data.Exercise();
            exercise.category = this.m_categories[0];
            exercise.name = "Vytacanie do boku";
            exercise.uoa = RemoteTrainer.Data.UnitOfAmount.kg;
            exercise.uor = RemoteTrainer.Data.UnitOfRepetitions.reps;
            exercise.averageDurationPerRep = 2.5;
            this.m_exercises.push(exercise);
            exercise = new RemoteTrainer.Data.Exercise();
            exercise.category = this.m_categories[2];
            exercise.name = "Tlaky v sede na stroji";
            exercise.uoa = RemoteTrainer.Data.UnitOfAmount.kg;
            exercise.uor = RemoteTrainer.Data.UnitOfRepetitions.reps;
            exercise.averageDurationPerRep = 3;
            this.m_exercises.push(exercise);
            exercise = new RemoteTrainer.Data.Exercise();
            exercise.category = this.m_categories[2];
            exercise.name = "Bench sikma dole";
            exercise.uoa = RemoteTrainer.Data.UnitOfAmount.kg;
            exercise.uor = RemoteTrainer.Data.UnitOfRepetitions.reps;
            exercise.averageDurationPerRep = 3;
            this.m_exercises.push(exercise);
            exercise = new RemoteTrainer.Data.Exercise();
            exercise.category = this.m_categories[3];
            exercise.name = "Drepy v raily";
            exercise.uoa = RemoteTrainer.Data.UnitOfAmount.kg;
            exercise.uor = RemoteTrainer.Data.UnitOfRepetitions.reps;
            exercise.averageDurationPerRep = 3;
            this.m_exercises.push(exercise);
            exercise = new RemoteTrainer.Data.Exercise();
            exercise.category = this.m_categories[3];
            exercise.name = "Kracanie so zatazou";
            exercise.uoa = RemoteTrainer.Data.UnitOfAmount.kg;
            exercise.uor = RemoteTrainer.Data.UnitOfRepetitions.reps;
            exercise.averageDurationPerRep = 3;
            this.m_exercises.push(exercise);
            exercise = new RemoteTrainer.Data.Exercise();
            exercise.category = this.m_categories[3];
            exercise.name = "Predkopavanie";
            exercise.uoa = RemoteTrainer.Data.UnitOfAmount.kg;
            exercise.uor = RemoteTrainer.Data.UnitOfRepetitions.reps;
            exercise.averageDurationPerRep = 1;
            this.m_exercises.push(exercise);
            exercise = new RemoteTrainer.Data.Exercise();
            exercise.category = this.m_categories[3];
            exercise.name = "Zakopavanie";
            exercise.uoa = RemoteTrainer.Data.UnitOfAmount.kg;
            exercise.uor = RemoteTrainer.Data.UnitOfRepetitions.reps;
            exercise.averageDurationPerRep = 1;
            this.m_exercises.push(exercise);
            exercise = new RemoteTrainer.Data.Exercise();
            exercise.category = this.m_categories[3];
            exercise.name = "Lytka sikma";
            exercise.uoa = RemoteTrainer.Data.UnitOfAmount.kg;
            exercise.uor = RemoteTrainer.Data.UnitOfRepetitions.reps;
            exercise.averageDurationPerRep = 1.5;
            this.m_exercises.push(exercise);
            exercise = new RemoteTrainer.Data.Exercise();
            exercise.category = this.m_categories[4];
            exercise.name = "Upazovanie s cinkami";
            exercise.uoa = RemoteTrainer.Data.UnitOfAmount.kg;
            exercise.uor = RemoteTrainer.Data.UnitOfRepetitions.reps;
            exercise.averageDurationPerRep = 4;
            this.m_exercises.push(exercise);
            exercise = new RemoteTrainer.Data.Exercise();
            exercise.category = this.m_categories[4];
            exercise.name = "Predpazovanie s cinkami";
            exercise.uoa = RemoteTrainer.Data.UnitOfAmount.kg;
            exercise.uor = RemoteTrainer.Data.UnitOfRepetitions.reps;
            exercise.averageDurationPerRep = 4;
            this.m_exercises.push(exercise);
            exercise = new RemoteTrainer.Data.Exercise();
            exercise.category = this.m_categories[4];
            exercise.name = "Tlak na stroji";
            exercise.uoa = RemoteTrainer.Data.UnitOfAmount.kg;
            exercise.uor = RemoteTrainer.Data.UnitOfRepetitions.reps;
            exercise.averageDurationPerRep = 3;
            this.m_exercises.push(exercise);
            exercise = new RemoteTrainer.Data.Exercise();
            exercise.category = this.m_categories[4];
            exercise.name = "Trapezy";
            exercise.uoa = RemoteTrainer.Data.UnitOfAmount.kg;
            exercise.uor = RemoteTrainer.Data.UnitOfRepetitions.reps;
            exercise.averageDurationPerRep = 2;
            this.m_exercises.push(exercise);
            exercise = new RemoteTrainer.Data.Exercise();
            exercise = new RemoteTrainer.Data.Exercise();
            exercise.category = this.m_categories[0];
            exercise.name = "Plank";
            exercise.uoa = RemoteTrainer.Data.UnitOfAmount.none;
            exercise.uor = RemoteTrainer.Data.UnitOfRepetitions.sec;
            exercise.averageDurationPerRep = 1;
            this.m_exercises.push(exercise);
            this.m_workoutTemplate = new RemoteTrainer.Data.WorkoutTemplate();
            this.m_workoutTemplate.name = "Chrbat / Triceps";
            this.m_workoutTemplate.description = "Bla bla bla bla...";
            var set = new RemoteTrainer.Data.SetTemplate();
            var serie1 = new RemoteTrainer.Data.SerieTemplate(this.m_exercises[7], 20, 10);
            set.addSerie(serie1);
            set.addSerie(serie1.clone());
            set.addSerie(serie1.clone());
            this.m_workoutTemplate.addSet(set);
            set = new RemoteTrainer.Data.SetTemplate();
            serie1 = new RemoteTrainer.Data.SerieTemplate(this.m_exercises[6], 10, 50);
            var serie2 = new RemoteTrainer.Data.SerieTemplate(this.m_exercises[1], 30);
            set.addSerie(serie1);
            set.addSerie(serie2);
            set.addSerie(serie1.clone());
            set.addSerie(serie2.clone());
            set.addSerie(serie1.clone());
            set.addSerie(serie2.clone());
            this.m_workoutTemplate.addSet(set);
            set = new RemoteTrainer.Data.SetTemplate();
            serie1 = new RemoteTrainer.Data.SerieTemplate(this.m_exercises[8], 10, 50);
            serie2 = new RemoteTrainer.Data.SerieTemplate(this.m_exercises[2], 15, 70);
            set.addSerie(serie1);
            set.addSerie(serie2);
            set.addSerie(serie1.clone());
            set.addSerie(serie2.clone());
            set.addSerie(serie1.clone());
            set.addSerie(serie2.clone());
            this.m_workoutTemplate.addSet(set);
            set = new RemoteTrainer.Data.SetTemplate();
            serie1 = new RemoteTrainer.Data.SerieTemplate(this.m_exercises[9], 15, 35);
            set.addSerie(serie1);
            set.addSerie(serie1.clone());
            set.addSerie(serie1.clone());
            this.m_workoutTemplate.addSet(set);
            set = new RemoteTrainer.Data.SetTemplate();
            serie1 = new RemoteTrainer.Data.SerieTemplate(this.m_exercises[10], 10, 120);
            serie2 = new RemoteTrainer.Data.SerieTemplate(this.m_exercises[3], 10, 15);
            set.addSerie(serie1);
            set.addSerie(serie2);
            set.addSerie(serie1.clone());
            set.addSerie(serie2.clone());
            set.addSerie(serie1.clone());
            set.addSerie(serie2.clone());
            this.m_workoutTemplate.addSet(set);
            set = new RemoteTrainer.Data.SetTemplate();
            serie1 = new RemoteTrainer.Data.SerieTemplate(this.m_exercises[11], 10, 8);
            set.addSerie(serie1);
            serie2 = serie1.clone();
            serie2.reps = 8;
            set.addSerie(serie2);
            serie2 = serie1.clone();
            serie2.reps = 6;
            set.addSerie(serie2);
            this.m_workoutTemplate.addSet(set);
            set = new RemoteTrainer.Data.SetTemplate();
            serie1 = new RemoteTrainer.Data.SerieTemplate(this.m_exercises[12], 10, 10);
            set.addSerie(serie1);
            set.addSerie(serie1.clone());
            set.addSerie(serie1.clone());
            this.m_workoutTemplate.addSet(set);
            set = new RemoteTrainer.Data.SetTemplate();
            serie1 = new RemoteTrainer.Data.SerieTemplate(this.m_exercises[13], 10, 35);
            set.addSerie(serie1);
            set.addSerie(serie1.clone());
            set.addSerie(serie1.clone());
            this.m_workoutTemplate.addSet(set);
            set = new RemoteTrainer.Data.SetTemplate();
            serie1 = new RemoteTrainer.Data.SerieTemplate(this.m_exercises[14], 10, 20);
            serie2 = new RemoteTrainer.Data.SerieTemplate(this.m_exercises[15], 75);
            set.addSerie(serie1);
            set.addSerie(serie2);
            set.addSerie(serie1.clone());
            set.addSerie(serie2.clone());
            set.addSerie(serie1.clone());
            set.addSerie(serie2.clone());
            this.m_workoutTemplate.addSet(set);
        };
        // FIXME: move to helper class
        Program.prototype.spanToTimeLabel = function (span) {
            var minutes = (span / 60).toFixed(0);
            var seconds = span % 60;
            return (minutes.length < 2 ? "0" : "") + minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
        };
        return Program;
    }());
    RemoteTrainer.Program = Program;
})(RemoteTrainer || (RemoteTrainer = {}));
//# sourceMappingURL=app.js.map