module RemoteTrainer.Service {
    export class DataProvider implements IDataProvider {
		public categories: Data.Category[];
		public exercises: Data.Exercise[];
        public workoutTemplates: Data.WorkoutTemplate[];
        private m_service: Resco.Data.WebService.ICrmService;

        constructor(service: Resco.Data.WebService.ICrmService) {
            this.m_service = service;
        }

        public connect(service: Resco.Data.WebService.ICrmService) {
            this.m_service = service;
        }

        public async initialize(): Promise<void> {
            if (!this.m_service)
                throw new Resco.InvalidOperationException("Service not connected!");

            this.categories = await this._loadCategories();
            this.exercises = await this._loadExercises();
            this.workoutTemplates = await this._loadWorkoutTemplates();
        }

        private async _loadCategories(): Promise<Data.Category[]> {
            var result: Data.Category[] = [];

            var serverCategories = await this.m_service.executeFetch("<fetch version=\"1.0\"><entity name=\"category\"><all-attributes /></entity></fetch>");
            serverCategories.forEach(serverCategory => {
                let category = new Data.Category();
                category.id = serverCategory.id.Value;
                category.name = serverCategory.attributes["name"];
                category.colorLight = serverCategory.attributes["color_light"];
                category.colorDark = serverCategory.attributes["color_dark"];
                result.push(category);
            }, this);

            return result.sort((a, b) => a.name.localeCompare(b.name));
        }

        private async _loadExercises(): Promise<Data.Exercise[]> {
            var result: Data.Exercise[] = [];

            var serverExercises = await this.m_service.executeFetch("<fetch version=\"1.0\"><entity name=\"exercise\"><all-attributes /></entity></fetch>");
            for (var serverExercise of serverExercises) {
                let exercise = new Data.Exercise();
                exercise.id = serverExercise.id.Value;
                exercise.name = serverExercise.attributes["name"];
                exercise.description = serverExercise.attributes["description"];
                exercise.uoa = (<Resco.Data.Integer>serverExercise.attributes["uoa"]).Value;
                exercise.uor = (<Resco.Data.Integer>serverExercise.attributes["uor"]).Value;
                exercise.category = this.categories.firstOrDefault(cat => cat.id === (<Resco.Data.WebService.EntityReference>serverExercise.attributes["category"]).Id.Value);

                var serverAvgDuration = await this.m_service.executeFetch("<fetch version=\"1.0\"><entity name=\"serie\" aggregate=\"true\">\
    <attribute name=\"id\" aggregate='count' alias=\"countIds\" />\
    <attribute name=\"duration\" aggregate='avg' alias=\"avgDuration\" />\
    <filter type=\"and\"><condition attribute=\"exercise\" operator=\"eq\" value=\"" + exercise.id + "\" /></filter>\
</entity></fetch>");

                exercise.averageDurationPerRep = Math.round(serverAvgDuration[0].attributes["avgDuration"]);

                result.push(exercise);
            }

			return result.sort((a, b) => a.name.localeCompare(b.name));
        }

        private async _loadWorkoutTemplates(): Promise<Data.WorkoutTemplate[]> {
            var result: Data.WorkoutTemplate[] = [];

            var serverWorkoutTemplates = await this.m_service.executeFetch("<fetch version=\"1.0\"><entity name=\"workout_template\"><all-attributes /></entity></fetch>");
            for (var serverWorkoutTemplate of serverWorkoutTemplates) {
                let workoutTemplate = new Data.WorkoutTemplate();
                workoutTemplate.id = serverWorkoutTemplate.id.Value;
                workoutTemplate.name(serverWorkoutTemplate.attributes["name"]);
                workoutTemplate.description(serverWorkoutTemplate.attributes["description"]);
                workoutTemplate.setTemplates = await this._loadSetTemplates(workoutTemplate);
                result.push(workoutTemplate);
            };

			return result.sort((a, b) => a.name().localeCompare(b.name()));
        }

        private async _loadSetTemplates(workoutTemplate: Data.WorkoutTemplate): Promise<Data.SetTemplate[]> {
            var result: Data.SetTemplate[] = [];

            var serverSetTemplates = await this.m_service.executeFetch("<fetch version=\"1.0\"><entity name=\"set_template\"><all-attributes /><filter type=\"and\">\
<condition attribute=\"workout\" operator=\"eq\" value=\"" + workoutTemplate.id + "\" /></filter><order attribute=\"order\" /></entity></fetch>");

            for (var serverSetTemplate of serverSetTemplates) {
                let setTemplate = new Data.SetTemplate();
                setTemplate.id = serverSetTemplate.id.Value;
                setTemplate.name = serverSetTemplate.attributes["name"];
                var order = <Resco.Data.Integer>serverSetTemplate.attributes["order"];
                setTemplate.order(order ? order.Value : undefined);
                setTemplate.serieTemplates = await this._loadSerieTemplates(setTemplate);
                setTemplate.parent = workoutTemplate;
                result.push(setTemplate);
            };

            return result;
        }

        private async _loadSerieTemplates(setTemplate: Data.SetTemplate): Promise<Data.SerieTemplate[]> {
            var result: Data.SerieTemplate[] = [];

            var serverSerieTemplates = await this.m_service.executeFetch("<fetch version=\"1.0\"><entity name=\"serie_template\"><all-attributes /><filter type=\"and\">\
<condition attribute=\"setid\" operator=\"eq\" value=\"" + setTemplate.id + "\" /></filter><order attribute=\"order\" /></entity></fetch>");
            for (var serverSerieTemplate of serverSerieTemplates) {
                let serieTemplate = new Data.SerieTemplate();
                serieTemplate.id = serverSerieTemplate.id.Value;
                var order = <Resco.Data.Integer>serverSerieTemplate.attributes["order"];
                serieTemplate.order(order ? order.Value : undefined);
                var amount = <Resco.Data.Integer>serverSerieTemplate.attributes["amount"];
                serieTemplate.amount = amount ? amount.Value : 0;
                var reps = <Resco.Data.Integer>serverSerieTemplate.attributes["reps"];
                serieTemplate.reps = reps ? reps.Value : undefined;
                serieTemplate.exercise = this.exercises.firstOrDefault(exercise => exercise.id === (<Resco.Data.WebService.EntityReference>serverSerieTemplate.attributes["exercise"]).Id.Value);
                serieTemplate.parent = setTemplate;
                result.push(serieTemplate);
            };

            return result;
        }


        public async loadWorkout(workoutId: string): Promise<Data.Workout> {
            var result: Data.SetTemplate[] = [];

            var serverWorkouts = await this.m_service.executeFetch("<fetch version=\"1.0\"><entity name=\"workout\"><all-attributes /><filter type=\"and\">\
<condition attribute=\"id\" operator=\"eq\" value=\"" + workoutId + "\" /></filter></entity></fetch>");

            if (serverWorkouts.length === 1) {
                var serverWorkout = serverWorkouts[0];
                var workout = new Data.Workout();
                workout.id = serverWorkout.id.Value;
                workout.name(serverWorkout.attributes["name"]);
                workout.description(serverWorkout.attributes["description"]);
                workout.status((<Resco.Data.Integer>serverWorkout.attributes["statuscode"]).Value);
                var startedOn = <Resco.Data.DateTime>serverWorkout.attributes["actualstart"];
                workout.startedOn(startedOn ? startedOn.Value : undefined);
                var finishedOn = <Resco.Data.DateTime>serverWorkout.attributes["actualend"];
                workout.finishedOn(finishedOn ? finishedOn.Value : undefined);
                var duration = <Resco.Data.Integer>serverWorkout.attributes["duration"];
                workout.duration(duration ? duration.Value : undefined);

                await this._loadSets(workout);
            }

            return workout;
        }

        private async _loadSets(workout: Data.Workout): Promise<void> {
            var serverSets = await this.m_service.executeFetch("<fetch version=\"1.0\"><entity name=\"set\"><all-attributes /><filter type=\"and\">\
<condition attribute=\"workoutid\" operator=\"eq\" value=\"" + workout.id + "\" /></filter><order attribute=\"order\" /></entity></fetch>");

            for (var serverSet of serverSets) {
                let set = new Data.Set();
                set.id = serverSet.id.Value;
                set.name = serverSet.attributes["name"];
                var order = <Resco.Data.Integer>serverSet.attributes["order"];
                set.order(order ? order.Value : undefined);
                set.status((<Resco.Data.Integer>serverSet.attributes["statuscode"]).Value);
                var duration = <Resco.Data.Integer>serverSet.attributes["duration"];
                set.duration(duration ? duration.Value : undefined);

                await this._loadSeries(set);

                workout.addSet(set);
            };
        }

        private async _loadSeries(set: Data.Set): Promise<void> {
            var serverSeries = await this.m_service.executeFetch("<fetch version=\"1.0\"><entity name=\"serie\"><all-attributes /><filter type=\"and\">\
<condition attribute=\"setid\" operator=\"eq\" value=\"" + set.id + "\" /></filter><order attribute=\"order\" /></entity></fetch>");

            for (var serverSerie of serverSeries) {
                let serie = new Data.Serie();
                serie.id = serverSerie.id.Value;
                var order = <Resco.Data.Integer>serverSerie.attributes["order"];
                serie.order(order ? order.Value : undefined);

                var amount = <Resco.Data.Integer>serverSerie.attributes["amount"];
                serie.amount = amount ? amount.Value : undefined;
                var actualAmount = <Resco.Data.Integer>serverSerie.attributes["actual_amount"];
				serie.uiAmount(actualAmount ? actualAmount.Value : serie.amount);

                var reps = <Resco.Data.Integer>serverSerie.attributes["reps"];
                serie.reps = reps ? reps.Value : undefined;
                var actualReps = <Resco.Data.Integer>serverSerie.attributes["actual_reps"];
                serie.uiReps(actualReps ? actualReps.Value : serie.reps);

                var startedOn = <Resco.Data.DateTime>serverSerie.attributes["started_on"];
                serie.uiStartedOn(startedOn ? startedOn.Value : undefined);
                var finishedOn = <Resco.Data.DateTime>serverSerie.attributes["finished_on"];
                serie.uiFinishedOn(finishedOn ? finishedOn.Value : undefined);
                var duration = <Resco.Data.Integer>serverSerie.attributes["duration"];
                serie.duration(duration ? duration.Value : 0);

                serie.status((<Resco.Data.Integer>serverSerie.attributes["statuscode"]).Value);
                var difficulty = <Resco.Data.Integer>serverSerie.attributes["difficulty"];
				serie.uiDifficulty(difficulty ? Data.Serie.difficulties[difficulty.Value - 1] : Data.Serie.difficulties[3]);

                serie.exercise = this.exercises.firstOrDefault(exercise => exercise.id === (<Resco.Data.WebService.EntityReference>serverSerie.attributes["exercise"]).Id.Value);

                set.addSerie(serie);
            };
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
                    workout.sets().forEach(set => DataProvider._saveSet(set, e => {
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
                    set.series().forEach(serie => DataProvider._saveSerie(serie, e => {
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

		public async getExerciseSeries(exercise: Data.Exercise): Promise<Data.Serie[]> {
			let result: Data.Serie[] = [];

			var fetchResult = await this.m_service.executeFetch("<fetch version=\"1.0\"><entity name=\"serie\"><all-attributes /><filter type=\"and\">\
<condition attribute=\"exercise\" operator=\"eq\" value=\"" + exercise.id + "\" /><condition attribute=\"statuscode\" operator=\"eq\" value=\"2\" /></filter><order attribute=\"finished_on\" /></entity></fetch>");

			for (var serverSerie of fetchResult) {
				let serie = new Data.Serie();
				serie.id = serverSerie.id.Value;
				serie.parentid = serverSerie.attributes["setid"].Id.Value;
				var order = <Resco.Data.Integer>serverSerie.attributes["order"];
				serie.order(order ? order.Value : undefined);

				var amount = <Resco.Data.Integer>serverSerie.attributes["amount"];
				serie.amount = amount ? amount.Value : undefined;
				var actualAmount = <Resco.Data.Integer>serverSerie.attributes["actual_amount"];
				serie.uiAmount(actualAmount ? actualAmount.Value : undefined);

				var reps = <Resco.Data.Integer>serverSerie.attributes["reps"];
				serie.reps = reps ? reps.Value : undefined;
				var actualReps = <Resco.Data.Integer>serverSerie.attributes["actual_reps"];
				serie.uiReps(actualReps ? actualReps.Value : undefined);

				var startedOn = <Resco.Data.DateTime>serverSerie.attributes["started_on"];
				serie.uiStartedOn(startedOn ? startedOn.Value : undefined);
				var finishedOn = <Resco.Data.DateTime>serverSerie.attributes["finished_on"];
				serie.uiFinishedOn(finishedOn ? finishedOn.Value : undefined);
				var duration = <Resco.Data.Integer>serverSerie.attributes["duration"];
				serie.duration(duration ? duration.Value : undefined);

				serie.status((<Resco.Data.Integer>serverSerie.attributes["statuscode"]).Value);
				var difficulty = <Resco.Data.Integer>serverSerie.attributes["difficulty"];
				serie.uiDifficulty(difficulty ? Data.Serie.difficulties[difficulty.Value - 1] : "");

				serie.exercise = this.exercises.firstOrDefault(exercise => exercise.id === (<Resco.Data.WebService.EntityReference>serverSerie.attributes["exercise"]).Id.Value);

				result.push(serie);
			};

			return result;
        }

        public async instantiateWorkout(workoutTemplate: Data.WorkoutTemplate, workoutName: string, scheduledOn: Date): Promise<Resco.Data.Guid> {
			var workoutEntity = this.m_service.createWritableEntity("workout");
			workoutEntity.addTypeValue("name", Resco.Data.WebService.CrmType.String, workoutName);
			workoutEntity.addTypeValue("scheduledstart", Resco.Data.WebService.CrmType.DateTime, scheduledOn);
			workoutEntity.addTypeValue("scheduledend", Resco.Data.WebService.CrmType.DateTime, moment(scheduledOn).add(2, "hours").toDate());
			workoutEntity.addTypeValue("description", Resco.Data.WebService.CrmType.String, workoutTemplate.description());

			var workoutId = await this.m_service.create(workoutEntity);

			for (var setTemplate of workoutTemplate.setTemplates) {
				var setEntity = this.m_service.createWritableEntity("set");
				setEntity.addTypeValue("name", Resco.Data.WebService.CrmType.String, setTemplate.name);
				setEntity.addTypeValue("order", Resco.Data.WebService.CrmType.Integer, setTemplate.order());
				setEntity.addTypeValue("workoutid", Resco.Data.WebService.CrmType.Lookup, new Resco.Data.WebService.EntityReference("workout", workoutId, ""));

				var setId = await this.m_service.create(setEntity);

				for (var serieTemplate of setTemplate.serieTemplates) {
					var serieEntity = this.m_service.createWritableEntity("serie");
					serieEntity.addTypeValue("name", Resco.Data.WebService.CrmType.String, serieTemplate.exercise.name + " - " + serieTemplate.order());
					serieEntity.addTypeValue("order", Resco.Data.WebService.CrmType.Integer, serieTemplate.order());
					serieEntity.addTypeValue("amount", Resco.Data.WebService.CrmType.Integer, serieTemplate.amount);
					serieEntity.addTypeValue("reps", Resco.Data.WebService.CrmType.Integer, serieTemplate.reps);
					serieEntity.addTypeValue("setid", Resco.Data.WebService.CrmType.Lookup, new Resco.Data.WebService.EntityReference("set", setId, ""));
					serieEntity.addTypeValue("exercise", Resco.Data.WebService.CrmType.Lookup, new Resco.Data.WebService.EntityReference("exercise", new Resco.Data.Guid(serieTemplate.exercise.id), ""));
					await this.m_service.create(serieEntity);
				}

			}
			return workoutId;
		}

		public async updateWorkoutTemplate(workoutTemplate: Data.WorkoutTemplate): Promise<void> {
			if (workoutTemplate.id)
				await this.m_service.delete("workout_template", workoutTemplate.id);			
			else
				workoutTemplate.id = Resco.createGuid();

			var requests = [];
			var writableEntity = this.m_service.createWritableEntity("workout_template");
			writableEntity.addTypeValue("id", Resco.Data.WebService.CrmType.PrimaryKey, workoutTemplate.id);
			writableEntity.addTypeValue("name", Resco.Data.WebService.CrmType.String, workoutTemplate.name());
			writableEntity.addTypeValue("description", Resco.Data.WebService.CrmType.String, workoutTemplate.description());
			requests.push(this.m_service.buildCreateRequest(writableEntity));

			workoutTemplate.setTemplates.forEach(setTemplate => {
				writableEntity = this.m_service.createWritableEntity("set_template");
				setTemplate.id = Resco.createGuid();
				writableEntity.addTypeValue("id", Resco.Data.WebService.CrmType.PrimaryKey, setTemplate.id);
				setTemplate.name = workoutTemplate.name() + " - " + setTemplate.order()
				writableEntity.addTypeValue("name", Resco.Data.WebService.CrmType.String, setTemplate.name);
				writableEntity.addTypeValue("order", Resco.Data.WebService.CrmType.Integer, setTemplate.order());
				writableEntity.addTypeValue("workout", Resco.Data.WebService.CrmType.Lookup, new Resco.Data.WebService.EntityReference("workout_template", new Resco.Data.Guid(workoutTemplate.id), null));
				requests.push(this.m_service.buildCreateRequest(writableEntity));

				setTemplate.serieTemplates.forEach(serieTemplate => {
					writableEntity = this.m_service.createWritableEntity("serie_template");
					writableEntity.addTypeValue("name", Resco.Data.WebService.CrmType.String, setTemplate.name + " - " + serieTemplate.order());
					writableEntity.addTypeValue("amount", Resco.Data.WebService.CrmType.Integer, serieTemplate.amount);
					writableEntity.addTypeValue("reps", Resco.Data.WebService.CrmType.Integer, serieTemplate.reps);
					writableEntity.addTypeValue("order", Resco.Data.WebService.CrmType.Integer, serieTemplate.order());
					writableEntity.addTypeValue("exercise", Resco.Data.WebService.CrmType.Lookup, new Resco.Data.WebService.EntityReference("exercise", new Resco.Data.Guid(serieTemplate.exercise.id), serieTemplate.exercise.name));
					writableEntity.addTypeValue("setid", Resco.Data.WebService.CrmType.Lookup, new Resco.Data.WebService.EntityReference("set_template", new Resco.Data.Guid(setTemplate.id), null));
					requests.push(this.m_service.buildCreateRequest(writableEntity));
				}, this);
			}, this);

			await this.m_service.executeMultiple(requests);
		}
    }
}