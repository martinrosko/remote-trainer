var RemoteTrainer;
(function (RemoteTrainer) {
    var Program = (function () {
        function Program() {
            this.index = 0;
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
            this.set = ko.observable(new RemoteTrainer.Data.Set(this.m_setTemplates[0]));
            this.set().series()[0].uiStatus(RemoteTrainer.Data.SerieStatus.Ready);
            //serie.uiStartedOn(new Date(Date.now()));
            //serie.uiFinishedOn(new Date(Date.now()));
            ko.applyBindings(this);
        };
        Program.prototype._createDemoData = function () {
            this.m_categories = [new RemoteTrainer.Data.Category("Brucho", "#eeece1", "#ddd9c4"),
                new RemoteTrainer.Data.Category("Cardio", "blue", "navy"),
                new RemoteTrainer.Data.Category("Prsia", "#dce6f1", "#b8cce4")];
            this.m_exercises = [];
            var exercise = new RemoteTrainer.Data.Exercise();
            exercise.category = this.m_categories[0];
            exercise.name = "Skracovacky";
            exercise.uoa = RemoteTrainer.Data.UnitOfAmount.kg;
            exercise.uor = RemoteTrainer.Data.UnitOfRepetitions.reps;
            this.m_exercises.push(exercise);
            exercise = new RemoteTrainer.Data.Exercise();
            exercise.category = this.m_categories[2];
            exercise.name = "Tlaky v sede na stroji";
            exercise.uoa = RemoteTrainer.Data.UnitOfAmount.kg;
            exercise.uor = RemoteTrainer.Data.UnitOfRepetitions.reps;
            this.m_exercises.push(exercise);
            exercise = new RemoteTrainer.Data.Exercise();
            exercise.category = this.m_categories[2];
            exercise.name = "Bench sikma dole";
            exercise.uoa = RemoteTrainer.Data.UnitOfAmount.kg;
            exercise.uor = RemoteTrainer.Data.UnitOfRepetitions.reps;
            this.m_exercises.push(exercise);
            this.m_setTemplates = [];
            var set = new RemoteTrainer.Data.SetTemplate();
            set.order = 1;
            set.serieTemplates = [];
            var serie1 = new RemoteTrainer.Data.SerieTemplate(this.m_exercises[1], 10, 70);
            var serie2 = new RemoteTrainer.Data.SerieTemplate(this.m_exercises[0], 45);
            set.addSerie(serie1);
            set.addSerie(serie2);
            set.addSerie(serie1.clone());
            set.addSerie(serie2.clone());
            set.addSerie(serie1.clone());
            set.addSerie(serie2.clone());
            this.m_setTemplates.push(set);
            set = new RemoteTrainer.Data.SetTemplate();
            set.order = 2;
            set.serieTemplates = [];
            serie1 = new RemoteTrainer.Data.SerieTemplate(this.m_exercises[2], 10, 50);
            set.addSerie(serie1);
            set.addSerie(serie1.clone());
            set.addSerie(serie1.clone());
            this.m_setTemplates.push(set);
        };
        return Program;
    }());
    RemoteTrainer.Program = Program;
})(RemoteTrainer || (RemoteTrainer = {}));
//# sourceMappingURL=app.js.map