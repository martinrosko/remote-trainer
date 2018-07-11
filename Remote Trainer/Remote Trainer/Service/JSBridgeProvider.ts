module RemoteTrainer.Service {
    export class JSBridgeProvider {// implements IDataProvider {
        private m_categories: Data.Category[];
        private m_exercises: Data.Exercise[];
        private m_workoutTemplates: Data.WorkoutTemplate[];
        private m_service: Resco.Data.WebService.ICrmService;

        constructor(service: Resco.Data.WebService.ICrmService) {
            this.m_service = service;
        }

        public connect(service: Resco.Data.WebService.ICrmService) {
            this.m_service = service;
        }

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
                    result.status(parseInt(entity[0].properties.statuscode));
                    if (entity[0].properties.started_on)
                        result.startedOn(new Date(entity[0].properties.actualstart));
                    if (entity[0].properties.finished_on)
                        result.finishedOn(new Date(entity[0].properties.actualend));
                    if (entity[0].properties.duration)
                        result.duration(parseInt(entity[0].properties.duration));

                    this._loadSets(result.id, sets => {
                        if (sets)
                            sets.forEach(set => result.addSet(set));

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

        private _loadSet(setEntity: MobileCRM.DynamicEntity, onLoaded: (set: Data.Set) => void): void {
            let set = new Data.Set();
            set.id = setEntity.id;
            set.order(parseInt(setEntity.properties.order));
            set.status(parseInt(setEntity.properties.statuscode));
            if (setEntity.properties.duration)
                set.duration(parseInt(setEntity.properties.duration));

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
                            serie.order(parseInt(serieEntities[i].properties.order));
                            serie.amount = serieEntities[i].properties.amount ? parseInt(serieEntities[i].properties.amount) : 0;
                            serie.uiAmount(serieEntities[i].properties.actual_amount ? parseInt(serieEntities[i].properties.actual_amount) : serie.amount);
                            serie.reps = serieEntities[i].properties.reps ? parseInt(serieEntities[i].properties.reps) : 0;
                            serie.uiReps(serieEntities[i].properties.actual_reps ? parseInt(serieEntities[i].properties.actual_reps) : serie.reps);
                            serie.exercise = this.m_exercises.firstOrDefault(exercise => exercise.id === serieEntities[i].properties.exercise.id);
                            if (serieEntities[i].properties.started_on)
                                serie.uiStartedOn(new Date(serieEntities[i].properties.started_on));
                            if (serieEntities[i].properties.finished_on)
                                serie.uiFinishedOn(new Date(serieEntities[i].properties.finished_on));

                            if (serieEntities[i].properties.duration)
                                serie.duration(parseInt(serieEntities[i].properties.duration));

                            serie.status(parseInt(serieEntities[i].properties.statuscode));
                            if (serieEntities[i].properties.difficulty)
                                serie.uiDifficulty(Data.Serie.difficulties[parseInt(serieEntities[i].properties.difficulty) - 1]);

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

        public saveWorkout(workout: Data.Workout, callback: (error: string) => void): void {
            let jsbWorkout = new MobileCRM.DynamicEntity("workout", workout.id);
            jsbWorkout.properties["actualstart"] = workout.startedOn();
            jsbWorkout.properties["actualend"] = workout.finishedOn();
            jsbWorkout.properties["statuscode"] = workout.status();
            jsbWorkout.properties["duration"] = workout.duration();

            jsbWorkout.save(function (error: string) {
                if (!error) {
                    let count = workout.sets().length;
                    workout.id = this.id;
                    workout.sets().forEach(set => JSBridgeProvider._saveSet(set, e => {
                        if (!error && e)
                            error = e;

                        if (--count === 0)
                            callback(error);
                    }), this);


                    // FIXME: clear removedSeries after completed
                    workout.removedSets.getValues().forEach(setToRemove => {
                        MobileCRM.DynamicEntity.deleteById("set", setToRemove.id, () => {
                            setToRemove.removedSeries.getValues().forEach(serieToRemove => {
                                MobileCRM.DynamicEntity.deleteById("serie", serieToRemove.id, () => { }, (e) => { });
                            }, this);

                            if (--count === 0)
                                callback(error);
                        }, (e) => {
                            if (--count === 0)
                                callback(error);
                        })
                    });
                }
                else
                    callback(error);
            });
        }

        private static _saveSet(set: Data.Set, callback: (error: string) => void): void {
            let jsbSet = new MobileCRM.DynamicEntity("set", set.id);
            jsbSet.properties["order"] = set.order();
            jsbSet.properties["statuscode"] = set.status();
            jsbSet.properties["duration"] = set.duration();
            jsbSet.properties["workoutid"] = new MobileCRM.Reference("workout", set.parent.id, "");

            jsbSet.save(function (error: string) {
                if (!error) {
                    set.id = this.id;
                    let count = set.series().length + set.removedSeries.length;
                    set.series().forEach(serie => JSBridgeProvider._saveSerie(serie, e => {
                        if (!error && e)
                            error = e;

                        if (--count === 0)
                            callback(error);
                    }));

                    // FIXME: clear removedSeries after completed
                    set.removedSeries.getKeys().forEach(serieToRemove => {
                        MobileCRM.DynamicEntity.deleteById("serie", serieToRemove, () => {
                            if (--count === 0)
                                callback(error);
                        }, (e) => {
                            if (--count === 0)
                                callback(error);
                        })
                    });
                }
                else
                    callback(error);
            });
        }

        private static _saveSerie(serie: Data.Serie, callback: (error: string) => void): void {
            let jsbSerie = new MobileCRM.DynamicEntity("serie", serie.id);
            jsbSerie.properties["order"] = serie.order();
            jsbSerie.properties["actual_amount"] = serie.uiAmount();
            jsbSerie.properties["actual_reps"] = serie.uiReps();
            jsbSerie.properties["difficulty"] = serie.difficulty();
            jsbSerie.properties["started_on"] = serie.uiStartedOn();
            jsbSerie.properties["finished_on"] = serie.uiFinishedOn();
            jsbSerie.properties["duration"] = serie.duration();
            jsbSerie.properties["statuscode"] = serie.status();
            jsbSerie.properties["setid"] = new MobileCRM.Reference("set", serie.parent.id, "");

            if (!serie.id) {
                jsbSerie.properties["exercise"] = new MobileCRM.Reference("exercise", serie.exercise.id, "");
                jsbSerie.properties["name"] = serie.exercise.name;
            }

            jsbSerie.save(function (error) {
                serie.id = this.id;
                callback(error);
            });
        }

        public getExerciseSeries(exercise: Data.Exercise, onComplete: (result: Data.Serie[]) => void, onCompleteScope?: any): void {
            let result: Data.Serie[] = [];
            let entity = new MobileCRM.FetchXml.Entity("serie");
            entity.addAttributes();
            entity.filter = new MobileCRM.FetchXml.Filter();
            entity.filter.where("statuscode", "eq", 2);
            entity.filter.where("exercise", "eq", exercise.id);
            entity.orderBy("finished_on", false);

            let fetch = new MobileCRM.FetchXml.Fetch(entity);
            fetch.execute("DynamicEntities",
                serieEntities => {
                    if (serieEntities) {
                        for (var i = 0; i < serieEntities.length; i++) {
                            let serie = new Data.Serie();
                            serie.id = serieEntities[i].id;
                            serie.order(parseInt(serieEntities[i].properties.order));
                            serie.amount = serieEntities[i].properties.amount ? parseInt(serieEntities[i].properties.amount) : 0;
                            serie.uiAmount(serieEntities[i].properties.actual_amount ? parseInt(serieEntities[i].properties.actual_amount) : serie.amount);
                            serie.reps = serieEntities[i].properties.reps ? parseInt(serieEntities[i].properties.reps) : 0;
                            serie.uiReps(serieEntities[i].properties.actual_reps ? parseInt(serieEntities[i].properties.actual_reps) : serie.reps);
                            serie.exercise = this.m_exercises.firstOrDefault(exercise => exercise.id === serieEntities[i].properties.exercise.id);
                            if (serieEntities[i].properties.started_on)
                                serie.uiStartedOn(new Date(serieEntities[i].properties.started_on));
                            if (serieEntities[i].properties.finished_on)
                                serie.uiFinishedOn(new Date(serieEntities[i].properties.finished_on));

                            if (serieEntities[i].properties.duration)
                                serie.duration(parseInt(serieEntities[i].properties.duration));

                            serie.status(parseInt(serieEntities[i].properties.statuscode));
                            if (serieEntities[i].properties.difficulty)
                                serie.uiDifficulty(Data.Serie.difficulties[parseInt(serieEntities[i].properties.difficulty) - 1]);

                            serie.parentid = serieEntities[i].properties.setid.id;

                            result.push(serie);
                        }
                        onComplete(result);
                    }
                },
                err => MobileCRM.bridge.alert("Error getting series: " + err), this);
        }

        public instantiateWorkout(workoutTemplate: Data.WorkoutTemplate, workoutName: string, scheduledOn: Date, onComplete: () => void, onCompleteScope?: any): void {
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
                    var toCreate: number = 0;

                    workoutTemplate.setTemplates.forEach(setTempalte => {
                        toCreate += setTempalte.serieTemplates.length;
                    });
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
                                        else if (--toCreate === 0)
                                            onComplete.call(onCompleteScope || this);
                                    });                                   
                                }, this);
                            }
                        });
                    }, this);
                }
            });
        }
    }
}