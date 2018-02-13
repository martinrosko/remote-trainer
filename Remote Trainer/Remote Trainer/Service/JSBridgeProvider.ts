module RemoteTrainer.Service {
    export class JSBridgeProvider implements IDataProvider {
        private m_categories: Data.Category[];
        private m_exercises: Data.Exercise[];
        private m_workoutTemplates: Data.WorkoutTemplate[];

        public initialize(onLoaded: (categories: Data.Category[], exercises: Data.Exercise[], workouts: Data.WorkoutTemplate[]) => void): void {
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
                            this._loadWorkoutTemplate(workoutEntities[i], workout => {
                                this.m_workoutTemplates.push(workout);
                                if (this.m_workoutTemplates.length === workoutEntities.length)
                                    onLoaded();
                            });
                        }
                    }
                },
                err => MobileCRM.bridge.alert("Error getting workout templates: " + err), this);
        }

        private _loadWorkoutTemplate(workoutEntity: /*MobileCRM.DynamicEntity*/any, onLoaded: (workout: Data.WorkoutTemplate) => void): void {
            let workout = new Data.WorkoutTemplate();
            workout.id = workoutEntity.id;
            workout.name = workoutEntity.properties.name;
            workout.description = workoutEntity.properties.description;

            // load workout sets
            this._loadSetTemplates(workout.id, sets => {
                workout.setTemplates = sets;
                sets.forEach(s => s.parent = workout);
                onLoaded(workout);
            });
        }

        private _loadSetTemplates(workoutId: string, onLoaded: (sets: Data.SetTemplate[]) => void): void {
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
                            this._loadSetTemplate(setEntities[i], set => {
                                result.push(set);
                                if (result.length === setEntities.length)
                                    onLoaded(result);
                            });
                        }
                    }
                },
                err => MobileCRM.bridge.alert("Error getting set templates: " + err), this);
        }

        private _loadSetTemplate(setEntity: /*MobileCRM.DynamicEntity*/any, onLoaded: (set: Data.SetTemplate) => void): void {
            let set = new Data.SetTemplate();
            set.id = setEntity.id;
            set.order(setEntity.properties.order);

            // load workout sets
            this._loadSerieTemplates(set.id, series => {
                set.serieTemplates = series;
                series.forEach(s => s.parent = set);
                onLoaded(set);
            });
        }

        private _loadSerieTemplates(setId: string, onLoaded: (sets: Data.SerieTemplate[]) => void): void {
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
                            serie.order(serieEntities[i].properties.order);
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

        public loadWorkout(workoutId: string, onLoaded: (workout: Data.Workout) => void): void {
            let entity = new MobileCRM.FetchXml.Entity("workout");
            entity.addAttributes();
            entity.filter = new MobileCRM.FetchXml.Filter();
            entity.filter.where("id", "eq", workoutId);
            let fetch = new MobileCRM.FetchXml.Fetch(entity);
            fetch.execute("DynamicEntities",
                entity => {
                    let result = new Data.Workout();
                    result.id = entity[0].id;
                    result.name = entity[0].properties.name;
                    result.description = entity[0].properties.comments;
                    //result.uiState(entity.properties[0].statuscode);
                    if (entity[0].properties.started_on)
                        result.uiStartedOn(new Date(entity[0].properties.actualstart));
                    if (entity[0].properties.finished_on)
                        result.uiFinishedOn(new Date(entity[0].properties.actualend));

                    this._loadSets(result.id, sets => {
                        if (sets)
                            sets.forEach(set => result.addSet(set));

                        let entityWriter = new JSBridgeEntityWriter(entity[0]);
                        entityWriter.subscribeObservableForWriting(result.uiStartedOn, "actualstart");
                        entityWriter.subscribeObservableForWriting(result.uiFinishedOn, "actualend");
                        entityWriter.subscribeObservableForWriting(result.uiStatus, "statuscode");

                        onLoaded(result);
                    });
                },
                err => MobileCRM.bridge.alert("Error getting workout: " + err),
                this);
        }


        private _loadSets(workoutId: string, onLoaded: (sets: Data.Set[]) => void): void {
            let result: Data.Set[] = [];
            let entity = new MobileCRM.FetchXml.Entity("set");
            entity.addAttributes();
            entity.filter = new MobileCRM.FetchXml.Filter();
            entity.filter.where("workoutid", "eq", workoutId);
            entity.orderBy("order", false);

            let fetch = new MobileCRM.FetchXml.Fetch(entity);
            fetch.execute("DynamicEntities",
                setEntities => {
                    if (setEntities && setEntities.length > 0) {
                        for (var i = 0; i < setEntities.length; i++) {
                            this._loadSet(setEntities[i], set => {
                                result.push(set);
                                if (result.length === setEntities.length)
                                    onLoaded(result);
                            });
                        }
                    }
                    else {
                        onLoaded([]);
                    }
                },
                err => MobileCRM.bridge.alert("Error getting sets: " + err), this);
        }

        private _loadSet(setEntity: /*MobileCRM.DynamicEntity*/any, onLoaded: (set: Data.Set) => void): void {
            let set = new Data.Set();
            set.id = setEntity.id;
            set.order(setEntity.properties.order);
            set.entityWriter = new JSBridgeEntityWriter(setEntity);

            // load workout sets
            this._loadSeries(set.id, series => {
                if (series)
                    series.forEach(serie => set.addSerie(serie));

                onLoaded(set)
            });
        }


        private _loadSeries(setId: string, onLoaded: (sets: Data.Serie[]) => void): void {
            let result: Data.Serie[] = [];
            let entity = new MobileCRM.FetchXml.Entity("serie");
            entity.addAttributes();
            entity.filter = new MobileCRM.FetchXml.Filter();
            entity.filter.where("setid", "eq", setId);
            entity.orderBy("order", false);

            let fetch = new MobileCRM.FetchXml.Fetch(entity);
            fetch.execute("DynamicEntities",
                serieEntities => {
                    if (serieEntities && serieEntities.length > 0) {
                        for (var i = 0; i < serieEntities.length; i++) {
                            let serie = new Data.Serie();
                            serie.id = serieEntities[i].id;
                            serie.order(serieEntities[i].properties.order);
                            serie.amount = serieEntities[i].properties.amount;
                            serie.uiAmount(serie.amount);
                            serie.reps = serieEntities[i].properties.reps;
                            serie.uiReps(serie.reps);
                            serie.exercise = this.m_exercises.firstOrDefault(exercise => exercise.id === serieEntities[i].properties.exercise.id);
                            if (serieEntities[i].properties.started_on)
                                serie.uiStartedOn(new Date(serieEntities[i].properties.started_on));
                            if (serieEntities[i].properties.finished_on)
                                serie.uiFinishedOn(new Date(serieEntities[i].properties.finished_on));

                            let entityWriter = new JSBridgeEntityWriter(serieEntities[i]);
                            entityWriter.subscribeObservableForWriting(serie.uiAmount, "amount");
                            entityWriter.subscribeObservableForWriting(serie.uiReps, "reps");
                            entityWriter.subscribeObservableForWriting(serie.difficulty, "difficulty");
                            entityWriter.subscribeObservableForWriting(serie.uiStartedOn, "started_on");
                            entityWriter.subscribeObservableForWriting(serie.uiFinishedOn, "finished_on");
                            entityWriter.subscribeObservableForWriting(serie.uiStatus, "statuscode");

                            result.push(serie);
                        }
                        onLoaded(result);
                    }
                    else {
                        onLoaded([]);
                    }
                },
                err => MobileCRM.bridge.alert("Error getting serie templates: " + err), this);
        }

        public instantiateWorkout(workoutTemplate: Data.WorkoutTemplate, workoutName: string, scheduledOn: Date): void {
            let workoutEntity = new MobileCRM.DynamicEntity("workout");
            workoutEntity.properties.name = workoutName;
            workoutEntity.properties.scheduledstart = scheduledOn;
            workoutEntity.properties.scheduledend = moment(scheduledOn).add(2, "hours").toDate();
            workoutEntity.properties.description = workoutTemplate.description;

            workoutEntity.save(function(error) {
                // note: scope (this) is newlycreated dynamic entity (workout)
                if (error) {
                    MobileCRM.bridge.alert("Error instantiating workout: " + error);
                }
                else {
                    // create sets
                    workoutTemplate.setTemplates.forEach(function(setTemplate) {
                        let setEntity = new MobileCRM.DynamicEntity("set");
                        setEntity.properties.workoutid = new MobileCRM.Reference("workout", (<MobileCRM.DynamicEntity><any>this).id, "");
                        setEntity.properties.name = setTemplate.name;
                        setEntity.properties.order = setTemplate.order();
                        setEntity.save(function(error) {
                            // note: scope (this) is newly created dynamic entity (set)
                            if (error) {
                                MobileCRM.bridge.alert("Error instantiating set: " + error);
                            }
                            else {
                                // create series
                                setTemplate.serieTemplates.forEach(function(serieTemplate) {
                                    let serieEntity = new MobileCRM.DynamicEntity("serie");
                                    serieEntity.properties.setid = new MobileCRM.Reference("set", (<MobileCRM.DynamicEntity><any>this).id, "");
                                    serieEntity.properties.amount = serieTemplate.amount;
                                    serieEntity.properties.exercise = new MobileCRM.Reference("exercise", serieTemplate.exercise.id, "");
                                    serieEntity.properties.order = serieTemplate.order();
                                    serieEntity.properties.reps = serieTemplate.reps;
                                    serieEntity.save(error => {
                                        if (error)
                                            MobileCRM.bridge.alert("Error instantiating serie: " + error);
                                    });
                                   
                                }, this);
                            }
                        });
                    }, this);
                }
            });
        }
    }


    class JSBridgeEntityWriter implements IEntityWriter {
        private m_jsbEntity: any;// MobileCRM.DynamicEntity;
        private m_storageLock: boolean;

        private m_oldValues: Resco.Dictionary<string, any>;

        constructor(entity: any/*MobileCRM.DynamicEntity*/) {
            this.m_jsbEntity = entity;
            this.m_oldValues = new Resco.Dictionary<string, any>();
        }

        public subscribeObservableForWriting<T>(obsVar: KnockoutObservable<T>, fieldName: string): void {
            obsVar.subscribe(oldValue => {
                this.m_oldValues.set(fieldName, oldValue);
            }, this, "beforeChange");

            obsVar.subscribe(value => {
                if (!this.m_storageLock) {
                    this.m_jsbEntity.properties[fieldName] = value;
                    this.m_jsbEntity.save((err: string) => {
                        if (err) {
                            let oldLockValue = this.m_storageLock;
                            this.m_storageLock = true;
                            obsVar(this.m_oldValues.getValue(fieldName));
                            this.m_storageLock = oldLockValue;
                        }
                    });
                }
            }, this, );
        }

        public save(): void {
        }
    }

}