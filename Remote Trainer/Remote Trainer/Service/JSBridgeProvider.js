var RemoteTrainer;
(function (RemoteTrainer) {
    var Service;
    (function (Service) {
        var JSBridgeProvider = (function () {
            function JSBridgeProvider() {
            }
            JSBridgeProvider.prototype.initialize = function (onLoaded) {
                var _this = this;
                this._loadCategories(function () { return _this._loadExercises(function () { return _this._loadTemplates(function () {
                    onLoaded(_this.m_categories, _this.m_exercises, _this.m_workoutTemplates);
                }); }); });
            };
            JSBridgeProvider.prototype._loadCategories = function (onLoaded) {
                var _this = this;
                this.m_categories = [];
                var entity = new MobileCRM.FetchXml.Entity("category");
                entity.addAttributes();
                var fetch = new MobileCRM.FetchXml.Fetch(entity);
                fetch.execute("DynamicEntities", function (categories) {
                    if (categories) {
                        for (var i = 0; i < categories.length; i++) {
                            var category = new RemoteTrainer.Data.Category();
                            category.id = categories[i].id;
                            category.name = categories[i].properties.name;
                            category.colorLight = categories[i].properties.color_light;
                            category.colorDark = categories[i].properties.color_dark;
                            _this.m_categories.push(category);
                        }
                        onLoaded();
                    }
                }, function (err) { return MobileCRM.bridge.alert("Error getting categories: " + err); }, this);
            };
            JSBridgeProvider.prototype._loadExercises = function (onLoaded) {
                var _this = this;
                this.m_exercises = [];
                var entity = new MobileCRM.FetchXml.Entity("exercise");
                entity.addAttributes();
                var fetch = new MobileCRM.FetchXml.Fetch(entity);
                fetch.execute("DynamicEntities", function (exercises) {
                    if (exercises) {
                        for (var i = 0; i < exercises.length; i++) {
                            var exercise = new RemoteTrainer.Data.Exercise();
                            exercise.id = exercises[i].id;
                            exercise.name = exercises[i].properties.name;
                            exercise.description = exercises[i].properties.description;
                            exercise.uoa = exercises[i].properties.uoa;
                            exercise.uor = exercises[i].properties.uor;
                            exercise.category = _this.m_categories.firstOrDefault(function (cat) { return cat.id === exercises[i].properties.category.id; });
                            _this.m_exercises.push(exercise);
                        }
                        onLoaded();
                    }
                }, function (err) { return MobileCRM.bridge.alert("Error getting exercises: " + err); }, this);
            };
            JSBridgeProvider.prototype._loadTemplates = function (onLoaded) {
                var _this = this;
                this.m_workoutTemplates = [];
                var entity = new MobileCRM.FetchXml.Entity("workout_template");
                entity.addAttributes();
                var fetch = new MobileCRM.FetchXml.Fetch(entity);
                fetch.execute("DynamicEntities", function (workoutEntities) {
                    if (workoutEntities) {
                        for (var i = 0; i < workoutEntities.length; i++) {
                            _this._loadWorkoutTemplate(workoutEntities[i], function (workout) {
                                _this.m_workoutTemplates.push(workout);
                                if (_this.m_workoutTemplates.length === workoutEntities.length)
                                    onLoaded();
                            });
                        }
                    }
                }, function (err) { return MobileCRM.bridge.alert("Error getting workout templates: " + err); }, this);
            };
            JSBridgeProvider.prototype._loadWorkoutTemplate = function (workoutEntity, onLoaded) {
                var workout = new RemoteTrainer.Data.WorkoutTemplate();
                workout.id = workoutEntity.id;
                workout.name = workoutEntity.properties.name;
                workout.description = workoutEntity.properties.description;
                // load workout sets
                this._loadSetTemplates(workout.id, function (sets) {
                    workout.setTemplates = sets;
                    sets.forEach(function (s) { return s.parent = workout; });
                    onLoaded(workout);
                });
            };
            JSBridgeProvider.prototype._loadSetTemplates = function (workoutId, onLoaded) {
                var _this = this;
                var result = [];
                var entity = new MobileCRM.FetchXml.Entity("set_template");
                entity.addAttributes();
                entity.filter = new MobileCRM.FetchXml.Filter();
                entity.filter.where("workout", "eq", workoutId);
                entity.orderBy("order", false);
                var fetch = new MobileCRM.FetchXml.Fetch(entity);
                fetch.execute("DynamicEntities", function (setEntities) {
                    if (setEntities) {
                        for (var i = 0; i < setEntities.length; i++) {
                            _this._loadSetTemplate(setEntities[i], function (set) {
                                result.push(set);
                                if (result.length === setEntities.length)
                                    onLoaded(result);
                            });
                        }
                    }
                }, function (err) { return MobileCRM.bridge.alert("Error getting set templates: " + err); }, this);
            };
            JSBridgeProvider.prototype._loadSetTemplate = function (setEntity, onLoaded) {
                var set = new RemoteTrainer.Data.SetTemplate();
                set.id = setEntity.id;
                set.order(setEntity.properties.order);
                // load workout sets
                this._loadSerieTemplates(set.id, function (series) {
                    set.serieTemplates = series;
                    series.forEach(function (s) { return s.parent = set; });
                    onLoaded(set);
                });
            };
            JSBridgeProvider.prototype._loadSerieTemplates = function (setId, onLoaded) {
                var _this = this;
                var result = [];
                var entity = new MobileCRM.FetchXml.Entity("serie_template");
                entity.addAttributes();
                entity.filter = new MobileCRM.FetchXml.Filter();
                entity.filter.where("setid", "eq", setId);
                entity.orderBy("order", false);
                var fetch = new MobileCRM.FetchXml.Fetch(entity);
                fetch.execute("DynamicEntities", function (serieEntities) {
                    if (serieEntities) {
                        for (var i = 0; i < serieEntities.length; i++) {
                            var serie = new RemoteTrainer.Data.SerieTemplate();
                            serie.id = serieEntities[i].id;
                            serie.order(serieEntities[i].properties.order);
                            serie.amount = serieEntities[i].properties.amount;
                            serie.reps = serieEntities[i].properties.reps;
                            serie.exercise = _this.m_exercises.firstOrDefault(function (exercise) { return exercise.id === serieEntities[i].properties.exercise.id; });
                            result.push(serie);
                        }
                        onLoaded(result);
                    }
                }, function (err) { return MobileCRM.bridge.alert("Error getting serie templates: " + err); }, this);
            };
            JSBridgeProvider.prototype.loadWorkout = function (workoutId, onLoaded) {
                var _this = this;
                var entity = new MobileCRM.FetchXml.Entity("workout");
                entity.addAttributes();
                entity.filter = new MobileCRM.FetchXml.Filter();
                entity.filter.where("id", "eq", workoutId);
                var fetch = new MobileCRM.FetchXml.Fetch(entity);
                fetch.execute("DynamicEntities", function (entity) {
                    var result = new RemoteTrainer.Data.Workout();
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
                    _this._loadSets(result.id, function (sets) {
                        if (sets)
                            sets.forEach(function (set) { return result.addSet(set); });
                        onLoaded(result);
                    });
                }, function (err) { return MobileCRM.bridge.alert("Error getting workout: " + err); }, this);
            };
            JSBridgeProvider.prototype._loadSets = function (workoutId, onLoaded) {
                var _this = this;
                var result = [];
                var entity = new MobileCRM.FetchXml.Entity("set");
                entity.addAttributes();
                entity.filter = new MobileCRM.FetchXml.Filter();
                entity.filter.where("workoutid", "eq", workoutId);
                entity.orderBy("order", false);
                var fetch = new MobileCRM.FetchXml.Fetch(entity);
                fetch.execute("DynamicEntities", function (setEntities) {
                    if (setEntities && setEntities.length > 0) {
                        for (var i = 0; i < setEntities.length; i++) {
                            _this._loadSet(setEntities[i], function (set) {
                                result.push(set);
                                if (result.length === setEntities.length)
                                    onLoaded(result);
                            });
                        }
                    }
                    else {
                        onLoaded([]);
                    }
                }, function (err) { return MobileCRM.bridge.alert("Error getting sets: " + err); }, this);
            };
            JSBridgeProvider.prototype._loadSet = function (setEntity, onLoaded) {
                var set = new RemoteTrainer.Data.Set();
                set.id = setEntity.id;
                set.order(parseInt(setEntity.properties.order));
                set.status(parseInt(setEntity.properties.statuscode));
                if (setEntity.properties.duration)
                    set.duration(parseInt(setEntity.properties.duration));
                // load workout sets
                this._loadSeries(set.id, function (series) {
                    if (series)
                        series.forEach(function (serie) { return set.addSerie(serie); });
                    onLoaded(set);
                });
            };
            JSBridgeProvider.prototype._loadSeries = function (setId, onLoaded) {
                var _this = this;
                var result = [];
                var entity = new MobileCRM.FetchXml.Entity("serie");
                entity.addAttributes();
                entity.filter = new MobileCRM.FetchXml.Filter();
                entity.filter.where("setid", "eq", setId);
                entity.orderBy("order", false);
                var fetch = new MobileCRM.FetchXml.Fetch(entity);
                fetch.execute("DynamicEntities", function (serieEntities) {
                    if (serieEntities && serieEntities.length > 0) {
                        for (var i = 0; i < serieEntities.length; i++) {
                            var serie = new RemoteTrainer.Data.Serie();
                            serie.id = serieEntities[i].id;
                            serie.order(parseInt(serieEntities[i].properties.order));
                            serie.amount = serieEntities[i].properties.amount ? parseInt(serieEntities[i].properties.amount) : 0;
                            serie.uiAmount(serieEntities[i].properties.actual_amount ? parseInt(serieEntities[i].properties.actual_amount) : serie.amount);
                            serie.reps = serieEntities[i].properties.reps ? parseInt(serieEntities[i].properties.reps) : 0;
                            serie.uiReps(serieEntities[i].properties.actual_reps ? parseInt(serieEntities[i].properties.actual_reps) : serie.reps);
                            serie.exercise = _this.m_exercises.firstOrDefault(function (exercise) { return exercise.id === serieEntities[i].properties.exercise.id; });
                            if (serieEntities[i].properties.started_on)
                                serie.uiStartedOn(new Date(serieEntities[i].properties.started_on));
                            if (serieEntities[i].properties.finished_on)
                                serie.uiFinishedOn(new Date(serieEntities[i].properties.finished_on));
                            if (serieEntities[i].properties.duration)
                                serie.duration(parseInt(serieEntities[i].properties.duration));
                            serie.status(parseInt(serieEntities[i].properties.statuscode));
                            if (serieEntities[i].properties.difficulty)
                                serie.uiDifficulty(RemoteTrainer.Data.Serie.difficulties[parseInt(serieEntities[i].properties.difficulty) - 1]);
                            result.push(serie);
                        }
                        onLoaded(result);
                    }
                    else {
                        onLoaded([]);
                    }
                }, function (err) { return MobileCRM.bridge.alert("Error getting serie templates: " + err); }, this);
            };
            JSBridgeProvider.prototype.saveWorkout = function (workout, callback) {
                var jsbWorkout = new MobileCRM.DynamicEntity("workout", workout.id);
                jsbWorkout.properties["actualstart"] = workout.startedOn();
                jsbWorkout.properties["actualend"] = workout.finishedOn();
                jsbWorkout.properties["statuscode"] = workout.status();
                jsbWorkout.properties["duration"] = workout.duration();
                jsbWorkout.save(function (error) {
                    var _this = this;
                    if (!error) {
                        var count_1 = workout.sets().length;
                        workout.id = this.id;
                        workout.sets().forEach(function (set) { return JSBridgeProvider._saveSet(set, function (e) {
                            if (!error && e)
                                error = e;
                            if (--count_1 === 0)
                                callback(error);
                        }); }, this);
                        // FIXME: clear removedSeries after completed
                        workout.removedSets.getValues().forEach(function (setToRemove) {
                            MobileCRM.DynamicEntity.deleteById("set", setToRemove.id, function () {
                                setToRemove.removedSeries.getValues().forEach(function (serieToRemove) {
                                    MobileCRM.DynamicEntity.deleteById("serie", serieToRemove.id, function () { }, function (e) { });
                                }, _this);
                                if (--count_1 === 0)
                                    callback(error);
                            }, function (e) {
                                if (--count_1 === 0)
                                    callback(error);
                            });
                        });
                    }
                    else
                        callback(error);
                });
            };
            JSBridgeProvider._saveSet = function (set, callback) {
                var jsbSet = new MobileCRM.DynamicEntity("set", set.id);
                jsbSet.properties["order"] = set.order();
                jsbSet.properties["statuscode"] = set.status();
                jsbSet.properties["duration"] = set.duration();
                jsbSet.properties["workoutid"] = new MobileCRM.Reference("workout", set.parent.id, "");
                jsbSet.save(function (error) {
                    if (!error) {
                        set.id = this.id;
                        var count_2 = set.series().length + set.removedSeries.length;
                        set.series().forEach(function (serie) { return JSBridgeProvider._saveSerie(serie, function (e) {
                            if (!error && e)
                                error = e;
                            if (--count_2 === 0)
                                callback(error);
                        }); });
                        // FIXME: clear removedSeries after completed
                        set.removedSeries.getKeys().forEach(function (serieToRemove) {
                            MobileCRM.DynamicEntity.deleteById("serie", serieToRemove, function () {
                                if (--count_2 === 0)
                                    callback(error);
                            }, function (e) {
                                if (--count_2 === 0)
                                    callback(error);
                            });
                        });
                    }
                    else
                        callback(error);
                });
            };
            JSBridgeProvider._saveSerie = function (serie, callback) {
                var jsbSerie = new MobileCRM.DynamicEntity("serie", serie.id);
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
            };
            JSBridgeProvider.prototype.getExerciseSeries = function (exercise, onComplete, onCompleteScope) {
                var _this = this;
                var result = [];
                var entity = new MobileCRM.FetchXml.Entity("serie");
                entity.addAttributes();
                entity.filter = new MobileCRM.FetchXml.Filter();
                entity.filter.where("statuscode", "eq", 2);
                entity.filter.where("exercise", "eq", exercise.id);
                entity.orderBy("finished_on", false);
                var fetch = new MobileCRM.FetchXml.Fetch(entity);
                fetch.execute("DynamicEntities", function (serieEntities) {
                    if (serieEntities) {
                        for (var i = 0; i < serieEntities.length; i++) {
                            var serie = new RemoteTrainer.Data.Serie();
                            serie.id = serieEntities[i].id;
                            serie.order(parseInt(serieEntities[i].properties.order));
                            serie.amount = serieEntities[i].properties.amount ? parseInt(serieEntities[i].properties.amount) : 0;
                            serie.uiAmount(serieEntities[i].properties.actual_amount ? parseInt(serieEntities[i].properties.actual_amount) : serie.amount);
                            serie.reps = serieEntities[i].properties.reps ? parseInt(serieEntities[i].properties.reps) : 0;
                            serie.uiReps(serieEntities[i].properties.actual_reps ? parseInt(serieEntities[i].properties.actual_reps) : serie.reps);
                            serie.exercise = _this.m_exercises.firstOrDefault(function (exercise) { return exercise.id === serieEntities[i].properties.exercise.id; });
                            if (serieEntities[i].properties.started_on)
                                serie.uiStartedOn(new Date(serieEntities[i].properties.started_on));
                            if (serieEntities[i].properties.finished_on)
                                serie.uiFinishedOn(new Date(serieEntities[i].properties.finished_on));
                            if (serieEntities[i].properties.duration)
                                serie.duration(parseInt(serieEntities[i].properties.duration));
                            serie.status(parseInt(serieEntities[i].properties.statuscode));
                            if (serieEntities[i].properties.difficulty)
                                serie.uiDifficulty(RemoteTrainer.Data.Serie.difficulties[parseInt(serieEntities[i].properties.difficulty) - 1]);
                            serie.parentid = serieEntities[i].properties.setid.id;
                            result.push(serie);
                        }
                        onComplete(result);
                    }
                }, function (err) { return MobileCRM.bridge.alert("Error getting series: " + err); }, this);
            };
            JSBridgeProvider.prototype.instantiateWorkout = function (workoutTemplate, workoutName, scheduledOn, onComplete, onCompleteScope) {
                var workoutEntity = new MobileCRM.DynamicEntity("workout");
                workoutEntity.properties.name = workoutName;
                workoutEntity.properties.scheduledstart = scheduledOn;
                workoutEntity.properties.scheduledend = moment(scheduledOn).add(2, "hours").toDate();
                workoutEntity.properties.description = workoutTemplate.description;
                workoutEntity.save(function (error) {
                    // note: scope (this) is newlycreated dynamic entity (workout)
                    if (error) {
                        MobileCRM.bridge.alert("Error instantiating workout: " + error);
                    }
                    else {
                        // create sets
                        var toCreate = 0;
                        workoutTemplate.setTemplates.forEach(function (setTempalte) {
                            toCreate += setTempalte.serieTemplates.length;
                        });
                        workoutTemplate.setTemplates.forEach(function (setTemplate) {
                            var setEntity = new MobileCRM.DynamicEntity("set");
                            setEntity.properties.workoutid = new MobileCRM.Reference("workout", this.id, "");
                            setEntity.properties.name = setTemplate.name;
                            setEntity.properties.order = setTemplate.order();
                            setEntity.save(function (error) {
                                // note: scope (this) is newly created dynamic entity (set)
                                if (error) {
                                    MobileCRM.bridge.alert("Error instantiating set: " + error);
                                }
                                else {
                                    // create series
                                    setTemplate.serieTemplates.forEach(function (serieTemplate) {
                                        var _this = this;
                                        var serieEntity = new MobileCRM.DynamicEntity("serie");
                                        serieEntity.properties.setid = new MobileCRM.Reference("set", this.id, "");
                                        serieEntity.properties.amount = serieTemplate.amount;
                                        serieEntity.properties.exercise = new MobileCRM.Reference("exercise", serieTemplate.exercise.id, "");
                                        serieEntity.properties.order = serieTemplate.order();
                                        serieEntity.properties.reps = serieTemplate.reps;
                                        serieEntity.save(function (error) {
                                            if (error)
                                                MobileCRM.bridge.alert("Error instantiating serie: " + error);
                                            else if (--toCreate === 0)
                                                onComplete.call(onCompleteScope || _this);
                                        });
                                    }, this);
                                }
                            });
                        }, this);
                    }
                });
            };
            return JSBridgeProvider;
        }());
        Service.JSBridgeProvider = JSBridgeProvider;
        var JSBridgeEntityWriter = (function () {
            function JSBridgeEntityWriter(entity /*MobileCRM.DynamicEntity*/) {
                this.m_jsbEntity = entity;
                this.m_oldValues = new Resco.Dictionary();
            }
            JSBridgeEntityWriter.prototype.subscribeObservableForWriting = function (obsVar, fieldName) {
                var _this = this;
                obsVar.subscribe(function (oldValue) {
                    _this.m_oldValues.set(fieldName, oldValue);
                }, this, "beforeChange");
                obsVar.subscribe(function (value) {
                    if (!_this.m_storageLock) {
                        _this.m_jsbEntity.properties[fieldName] = value;
                        _this.m_jsbEntity.save(function (err) {
                            if (err) {
                                var oldLockValue = _this.m_storageLock;
                                _this.m_storageLock = true;
                                obsVar(_this.m_oldValues.getValue(fieldName));
                                _this.m_storageLock = oldLockValue;
                            }
                        });
                    }
                }, this);
            };
            JSBridgeEntityWriter.prototype.save = function () {
            };
            return JSBridgeEntityWriter;
        }());
    })(Service = RemoteTrainer.Service || (RemoteTrainer.Service = {}));
})(RemoteTrainer || (RemoteTrainer = {}));
//# sourceMappingURL=JSBridgeProvider.js.map