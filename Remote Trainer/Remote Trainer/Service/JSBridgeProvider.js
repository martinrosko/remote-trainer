var RemoteTrainer;
(function (RemoteTrainer) {
    var Service;
    (function (Service) {
        var JSBridgeProvider = (function () {
            function JSBridgeProvider() {
            }
            JSBridgeProvider.prototype.loadData = function (onLoaded) {
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
                            _this._loadWorkout(workoutEntities[i], function (workout) {
                                _this.m_workoutTemplates.push(workout);
                                if (_this.m_workoutTemplates.length === workoutEntities.length)
                                    onLoaded();
                            });
                        }
                    }
                }, function (err) { return MobileCRM.bridge.alert("Error getting workout templates: " + err); }, this);
            };
            JSBridgeProvider.prototype._loadWorkout = function (workoutEntity, onLoaded) {
                var workout = new RemoteTrainer.Data.WorkoutTemplate();
                workout.id = workoutEntity.id;
                workout.name = workoutEntity.properties.name;
                workout.description = workoutEntity.properties.description;
                // load workout sets
                this._loadSets(workout.id, function (sets) {
                    workout.setTemplates = sets;
                    sets.forEach(function (s) { return s.parent = workout; });
                    onLoaded(workout);
                });
            };
            JSBridgeProvider.prototype._loadSets = function (workoutId, onLoaded) {
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
                            _this._loadSet(setEntities[i], function (set) {
                                result.push(set);
                                if (result.length === setEntities.length)
                                    onLoaded(result);
                            });
                        }
                    }
                }, function (err) { return MobileCRM.bridge.alert("Error getting set templates: " + err); }, this);
            };
            JSBridgeProvider.prototype._loadSet = function (setEntity, onLoaded) {
                var set = new RemoteTrainer.Data.SetTemplate();
                set.id = setEntity.id;
                set.order = setEntity.properties.order;
                // load workout sets
                this._loadSeries(set.id, function (series) {
                    set.serieTemplates = series;
                    series.forEach(function (s) { return s.parent = set; });
                    onLoaded(set);
                });
            };
            JSBridgeProvider.prototype._loadSeries = function (setId, onLoaded) {
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
                            serie.order = serieEntities[i].properties.order;
                            serie.amount = serieEntities[i].properties.amount;
                            serie.reps = serieEntities[i].properties.reps;
                            serie.exercise = _this.m_exercises.firstOrDefault(function (exercise) { return exercise.id === serieEntities[i].properties.exercise.id; });
                            result.push(serie);
                        }
                        onLoaded(result);
                    }
                }, function (err) { return MobileCRM.bridge.alert("Error getting serie templates: " + err); }, this);
            };
            return JSBridgeProvider;
        }());
        Service.JSBridgeProvider = JSBridgeProvider;
    })(Service = RemoteTrainer.Service || (RemoteTrainer.Service = {}));
})(RemoteTrainer || (RemoteTrainer = {}));
//# sourceMappingURL=JSBridgeProvider.js.map