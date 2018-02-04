module RemoteTrainer.Service {
    export class JSBridgeProvider implements IDataProvider {
        private m_categories: Data.Category[];
        private m_exercises: Data.Exercise[];
        private m_workoutTemplates: Data.WorkoutTemplate[];

        public loadData(onLoaded: (categories: Data.Category[], exercises: Data.Exercise[], workouts: Data.WorkoutTemplate[]) => void): void {
            this._loadCategories(() => this._loadExercises(() => this._loadTemplates(() => {
                onLoaded(this.m_categories, this.m_exercises, this.m_workoutTemplates);
            })));
        }

        private _loadCategories(onLoaded: () => void): void {
            this.m_categories = [];

            let entity = new MobileCRM.FetchXml.Entity("category");
            entity.addAttributes();

            let fetch = new MobileCRM.FetchXml.Fetch(entity);
            fetch.execute("DynamicEntities",
                categories => {
                    if (categories) {
                        for (var i = 0; i < categories.length; i++) {
                            let category = new Data.Category();
                            category.id = categories[i].id;
                            category.name = categories[i].properties.name;
                            category.colorLight = categories[i].properties.color_light;
                            category.colorDark = categories[i].properties.color_dark;
                            this.m_categories.push(category);
                        }
                        onLoaded();
                    }
                },
                err => MobileCRM.bridge.alert("Error getting categories: " + err), this);
        }

        private _loadExercises(onLoaded: () => void): void {
            this.m_exercises = [];

            let entity = new MobileCRM.FetchXml.Entity("exercise");
            entity.addAttributes();

            let fetch = new MobileCRM.FetchXml.Fetch(entity);
            fetch.execute("DynamicEntities",
                exercises => {
                    if (exercises) {
                        for (var i = 0; i < exercises.length; i++) {
                            let exercise = new Data.Exercise();
                            exercise.id = exercises[i].id;
                            exercise.name = exercises[i].properties.name;
                            exercise.description = exercises[i].properties.description;
                            exercise.uoa = exercises[i].properties.uoa;
                            exercise.uor = exercises[i].properties.uor;
                            exercise.category = this.m_categories.firstOrDefault(cat => cat.id === exercises[i].properties.category.id);
                            this.m_exercises.push(exercise);
                        }
                        onLoaded();
                    }
                },
                err => MobileCRM.bridge.alert("Error getting exercises: " + err), this);
        }

        private _loadTemplates(onLoaded: () => void): void {
            this.m_workoutTemplates = [];

            let entity = new MobileCRM.FetchXml.Entity("workout_template");
            entity.addAttributes();

            let fetch = new MobileCRM.FetchXml.Fetch(entity);
            fetch.execute("DynamicEntities",
                workoutEntities => {
                    if (workoutEntities) {
                        for (var i = 0; i < workoutEntities.length; i++) {
                            this._loadWorkout(workoutEntities[i], workout => {
                                this.m_workoutTemplates.push(workout);
                                if (this.m_workoutTemplates.length === workoutEntities.length)
                                    onLoaded();
                            });
                        }
                    }
                },
                err => MobileCRM.bridge.alert("Error getting workout templates: " + err), this);
        }

        private _loadWorkout(workoutEntity: /*MobileCRM.DynamicEntity*/any, onLoaded: (workout: Data.WorkoutTemplate) => void): void {
            let workout = new Data.WorkoutTemplate();
            workout.id = workoutEntity.id;
            workout.name = workoutEntity.properties.name;
            workout.description = workoutEntity.properties.description;

            // load workout sets
            this._loadSets(workout.id, sets => {
                workout.setTemplates = sets;
                sets.forEach(s => s.parent = workout);
                onLoaded(workout);
            });
        }

        private _loadSets(workoutId: string, onLoaded: (sets: Data.SetTemplate[]) => void): void {
            let result: Data.SetTemplate[] = [];
            let entity = new MobileCRM.FetchXml.Entity("set_template");
            entity.addAttributes();
            entity.filter = new MobileCRM.FetchXml.Filter();
            entity.filter.where("workout", "eq", workoutId);
            entity.orderBy("order", false);

            let fetch = new MobileCRM.FetchXml.Fetch(entity);
            fetch.execute("DynamicEntities",
                setEntities => {
                    if (setEntities) {
                        for (var i = 0; i < setEntities.length; i++) {
                            this._loadSet(setEntities[i], set => {
                                result.push(set);
                                if (result.length === setEntities.length)
                                    onLoaded(result);
                            });
                        }
                    }
                },
                err => MobileCRM.bridge.alert("Error getting set templates: " + err), this);
        }

        private _loadSet(setEntity: /*MobileCRM.DynamicEntity*/any, onLoaded: (set: Data.SetTemplate) => void): void {
            let set = new Data.SetTemplate();
            set.id = setEntity.id;
            set.order = setEntity.properties.order;

            // load workout sets
            this._loadSeries(set.id, series => {
                set.serieTemplates = series;
                series.forEach(s => s.parent = set);
                onLoaded(set);
            });
        }

        private _loadSeries(setId: string, onLoaded: (sets: Data.SerieTemplate[]) => void): void {
            let result: Data.SerieTemplate[] = [];
            let entity = new MobileCRM.FetchXml.Entity("serie_template");
            entity.addAttributes();
            entity.filter = new MobileCRM.FetchXml.Filter();
            entity.filter.where("setid", "eq", setId);
            entity.orderBy("order", false);

            let fetch = new MobileCRM.FetchXml.Fetch(entity);
            fetch.execute("DynamicEntities",
                serieEntities => {
                    if (serieEntities) {
                        for (var i = 0; i < serieEntities.length; i++) {
                            let serie = new Data.SerieTemplate();
                            serie.id = serieEntities[i].id;
                            serie.order = serieEntities[i].properties.order;
                            serie.amount = serieEntities[i].properties.amount;
                            serie.reps = serieEntities[i].properties.reps;
                            serie.exercise = this.m_exercises.firstOrDefault(exercise => exercise.id === serieEntities[i].properties.exercise.id);
                            result.push(serie);
                        }
                        onLoaded(result);
                    }
                },
                err => MobileCRM.bridge.alert("Error getting serie templates: " + err), this);
        }
    }
}