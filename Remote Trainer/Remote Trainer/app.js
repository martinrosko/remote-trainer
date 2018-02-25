var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var RemoteTrainer;
(function (RemoteTrainer) {
    RemoteTrainer.DEMODATA = true;
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
            this.uiContentTemplateName = ko.observable("tmplOverview");
            this.uiFooterTemplateName = ko.observable();
            this.globalTimerPaused = false;
            this.dialogs = ko.observableArray();
            this.messageBox = ko.observable();
            window.setInterval(function (app) {
                if (!app.globalTimerPaused)
                    Program.instance.GlobalTimer.forEach(function (timer) { return timer.fn(timer.context); });
            }, 1000, this);
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
        Program.prototype.runApplication = function (workoutId) {
            var _this = this;
            if (RemoteTrainer.DEMODATA) {
                this._createDemoData();
                this.workout = ko.observable(new RemoteTrainer.Data.Workout(this.m_workoutTemplate));
                //let dialog = new CreateWorkoutDialog([this.m_workoutTemplate]);
                //dialog.closed.add(this, (sender, e) => {
                //    if (dialog.dialogResult) {
                //        //this.m_dataProvider.instantiateWorkout(dialog.selectedTemplate(), dialog.selectedTemplate().name, new Date(2018, 1, 19, 8));
                //    }
                //});
                //Program.instance.showDialog(dialog);
                ko.applyBindings(this);
            }
            else {
                this.m_dataProvider = new RemoteTrainer.Service.JSBridgeProvider();
                this.m_dataProvider.initialize(function (categories, exercises, workouts) {
                    _this.categories = categories;
                    _this.exercises = exercises;
                    _this.m_workoutTemplates = workouts;
                    if (!workoutId) {
                        var dialog_1 = new CreateWorkoutDialog(_this.m_workoutTemplates);
                        dialog_1.closed.add(_this, function (sender, e) {
                            if (dialog_1.dialogResult)
                                _this.m_dataProvider.instantiateWorkout(dialog_1.selectedTemplate(), dialog_1.selectedTemplate().name, new Date(2018, 1, 21, 8));
                        });
                        Program.instance.showDialog(dialog_1);
                        ko.applyBindings(_this);
                    }
                    else {
                        _this.m_dataProvider.loadWorkout(workoutId, function (workout) {
                            _this.workout = ko.observable(workout);
                            if (workout.status() === RemoteTrainer.Data.WorkoutStatus.Running)
                                workout.pause();
                            MobileCRM.UI.EntityForm.requestObject(function (entityForm) {
                                entityForm.form.caption = this.workout().name;
                                entityForm.isDirty = true;
                            }, function (err) {
                                MobileCRM.bridge.alert("Unable to set dirty flag");
                            }, _this);
                            MobileCRM.UI.EntityForm.onSave(function (form) {
                                var suspendHandler = form.suspendSave();
                                _this.m_dataProvider.saveWorkout(_this.workout(), function (error) { return suspendHandler.resumeSave(error); });
                            }, true, _this);
                            ko.applyBindings(_this);
                        });
                    }
                });
            }
        };
        Program.prototype.clearTimer = function (timer) {
            var timerIndex = Program.instance.GlobalTimer.indexOf(timer);
            if (timerIndex >= 0) {
                Program.instance.GlobalTimer.splice(timerIndex, 1);
                return true;
            }
            return false;
        };
        Program.prototype.onTabItemClicked = function (itemName) {
            switch (itemName) {
                case "Overview":
                    this.uiContentTemplateName("tmplOverview");
                    this.uiFooterTemplateName("");
                    this.uiSelectedTabIndex(0);
                    break;
                case "Workout":
                    this.uiContentTemplateName("tmplWorkoutDetails");
                    this.uiFooterTemplateName("");
                    this.uiSelectedTabIndex(1);
                    break;
                case "Set":
                    this.uiContentTemplateName("tmplSetDetails");
                    this.uiFooterTemplateName("tmplSetDetailsFooter");
                    this.uiSelectedTabIndex(2);
                    break;
            }
        };
        Program.prototype.showDialog = function (dialog) {
            var _this = this;
            dialog.closed.add(this, function (sender, e) {
                _this.dialogs.remove(dialog);
            });
            this.dialogs.push(dialog);
        };
        Program.prototype._createDemoData = function () {
            this.categories = [new RemoteTrainer.Data.Category("Brucho", "#eeece1", "#ddd9c4"),
                new RemoteTrainer.Data.Category("Cardio", "blue", "navy"),
                new RemoteTrainer.Data.Category("Prsia", "#dce6f1", "#b8cce4"),
                new RemoteTrainer.Data.Category("Nohy", "#daeef3", "#b7dee8"),
                new RemoteTrainer.Data.Category("Ramena", "#fde9d9", "#fcd5b4"),
                new RemoteTrainer.Data.Category("Biceps", "#f2dcdb", "#e6b8b7"),
                new RemoteTrainer.Data.Category("Chrbat", "#ebf1de", "#d8e4bc"),
                new RemoteTrainer.Data.Category("Triceps", "#e4dfec", "#ccc0da")];
            this.exercises = [];
            var exercise = new RemoteTrainer.Data.Exercise();
            exercise.category = this.categories[0];
            exercise.name = "Skracovacky";
            exercise.uoa = RemoteTrainer.Data.UnitOfAmount.kg;
            exercise.uor = RemoteTrainer.Data.UnitOfRepetitions.reps;
            exercise.averageDurationPerRep = 1;
            this.exercises.push(exercise);
            exercise = new RemoteTrainer.Data.Exercise();
            exercise.category = this.categories[0];
            exercise.name = "Pritahy k brade na lavicke";
            exercise.uoa = RemoteTrainer.Data.UnitOfAmount.none;
            exercise.uor = RemoteTrainer.Data.UnitOfRepetitions.reps;
            exercise.averageDurationPerRep = 1;
            this.exercises.push(exercise);
            exercise = new RemoteTrainer.Data.Exercise();
            exercise.category = this.categories[0];
            exercise.name = "Skracovacky na stroji";
            exercise.uoa = RemoteTrainer.Data.UnitOfAmount.kg;
            exercise.uor = RemoteTrainer.Data.UnitOfRepetitions.reps;
            exercise.averageDurationPerRep = 1.5;
            this.exercises.push(exercise);
            exercise = new RemoteTrainer.Data.Exercise();
            exercise.category = this.categories[0];
            exercise.name = "Vytacanie do boku";
            exercise.uoa = RemoteTrainer.Data.UnitOfAmount.kg;
            exercise.uor = RemoteTrainer.Data.UnitOfRepetitions.reps;
            exercise.averageDurationPerRep = 2.5;
            this.exercises.push(exercise);
            exercise = new RemoteTrainer.Data.Exercise();
            exercise.category = this.categories[2];
            exercise.name = "Tlaky v sede na stroji";
            exercise.uoa = RemoteTrainer.Data.UnitOfAmount.kg;
            exercise.uor = RemoteTrainer.Data.UnitOfRepetitions.reps;
            exercise.averageDurationPerRep = 3;
            this.exercises.push(exercise);
            exercise = new RemoteTrainer.Data.Exercise();
            exercise.category = this.categories[2];
            exercise.name = "Bench sikma dole";
            exercise.uoa = RemoteTrainer.Data.UnitOfAmount.kg;
            exercise.uor = RemoteTrainer.Data.UnitOfRepetitions.reps;
            exercise.averageDurationPerRep = 3;
            this.exercises.push(exercise);
            exercise = new RemoteTrainer.Data.Exercise();
            exercise.category = this.categories[3];
            exercise.name = "Drepy v raily";
            exercise.uoa = RemoteTrainer.Data.UnitOfAmount.kg;
            exercise.uor = RemoteTrainer.Data.UnitOfRepetitions.reps;
            exercise.averageDurationPerRep = 3;
            this.exercises.push(exercise);
            exercise = new RemoteTrainer.Data.Exercise();
            exercise.category = this.categories[3];
            exercise.name = "Kracanie so zatazou";
            exercise.uoa = RemoteTrainer.Data.UnitOfAmount.kg;
            exercise.uor = RemoteTrainer.Data.UnitOfRepetitions.reps;
            exercise.averageDurationPerRep = 3;
            this.exercises.push(exercise);
            exercise = new RemoteTrainer.Data.Exercise();
            exercise.category = this.categories[3];
            exercise.name = "Predkopavanie";
            exercise.uoa = RemoteTrainer.Data.UnitOfAmount.kg;
            exercise.uor = RemoteTrainer.Data.UnitOfRepetitions.reps;
            exercise.averageDurationPerRep = 1;
            this.exercises.push(exercise);
            exercise = new RemoteTrainer.Data.Exercise();
            exercise.category = this.categories[3];
            exercise.name = "Zakopavanie";
            exercise.uoa = RemoteTrainer.Data.UnitOfAmount.kg;
            exercise.uor = RemoteTrainer.Data.UnitOfRepetitions.reps;
            exercise.averageDurationPerRep = 1;
            this.exercises.push(exercise);
            exercise = new RemoteTrainer.Data.Exercise();
            exercise.category = this.categories[3];
            exercise.name = "Lytka sikma";
            exercise.uoa = RemoteTrainer.Data.UnitOfAmount.kg;
            exercise.uor = RemoteTrainer.Data.UnitOfRepetitions.reps;
            exercise.averageDurationPerRep = 1.5;
            this.exercises.push(exercise);
            exercise = new RemoteTrainer.Data.Exercise();
            exercise.category = this.categories[4];
            exercise.name = "Upazovanie s cinkami";
            exercise.uoa = RemoteTrainer.Data.UnitOfAmount.kg;
            exercise.uor = RemoteTrainer.Data.UnitOfRepetitions.reps;
            exercise.averageDurationPerRep = 4;
            this.exercises.push(exercise);
            exercise = new RemoteTrainer.Data.Exercise();
            exercise.category = this.categories[4];
            exercise.name = "Predpazovanie s cinkami";
            exercise.uoa = RemoteTrainer.Data.UnitOfAmount.kg;
            exercise.uor = RemoteTrainer.Data.UnitOfRepetitions.reps;
            exercise.averageDurationPerRep = 4;
            this.exercises.push(exercise);
            exercise = new RemoteTrainer.Data.Exercise();
            exercise.category = this.categories[4];
            exercise.name = "Tlak na stroji";
            exercise.uoa = RemoteTrainer.Data.UnitOfAmount.kg;
            exercise.uor = RemoteTrainer.Data.UnitOfRepetitions.reps;
            exercise.averageDurationPerRep = 3;
            this.exercises.push(exercise);
            exercise = new RemoteTrainer.Data.Exercise();
            exercise.category = this.categories[4];
            exercise.name = "Trapezy";
            exercise.uoa = RemoteTrainer.Data.UnitOfAmount.kg;
            exercise.uor = RemoteTrainer.Data.UnitOfRepetitions.reps;
            exercise.averageDurationPerRep = 2;
            this.exercises.push(exercise);
            exercise = new RemoteTrainer.Data.Exercise();
            exercise = new RemoteTrainer.Data.Exercise();
            exercise.category = this.categories[0];
            exercise.name = "Plank";
            exercise.uoa = RemoteTrainer.Data.UnitOfAmount.none;
            exercise.uor = RemoteTrainer.Data.UnitOfRepetitions.sec;
            exercise.averageDurationPerRep = 1;
            this.exercises.push(exercise);
            this.m_workoutTemplate = new RemoteTrainer.Data.WorkoutTemplate();
            this.m_workoutTemplate.name = "Chrbat / Triceps";
            this.m_workoutTemplate.description = "Bla bla bla bla...";
            var set = new RemoteTrainer.Data.SetTemplate();
            set.addSerie(new RemoteTrainer.Data.SerieTemplate(this.exercises[7], 1, 10));
            set.addSerie(new RemoteTrainer.Data.SerieTemplate(this.exercises[7], 2, 10));
            set.addSerie(new RemoteTrainer.Data.SerieTemplate(this.exercises[7], 3, 10));
            this.m_workoutTemplate.addSet(set);
            set = new RemoteTrainer.Data.SetTemplate();
            var serie1 = new RemoteTrainer.Data.SerieTemplate(this.exercises[6], 10, 50);
            var serie2 = new RemoteTrainer.Data.SerieTemplate(this.exercises[1], 30);
            set.addSerie(serie1);
            set.addSerie(serie2);
            set.addSerie(serie1.clone());
            set.addSerie(serie2.clone());
            set.addSerie(serie1.clone());
            set.addSerie(serie2.clone());
            this.m_workoutTemplate.addSet(set);
            set = new RemoteTrainer.Data.SetTemplate();
            serie1 = new RemoteTrainer.Data.SerieTemplate(this.exercises[8], 10, 50);
            serie2 = new RemoteTrainer.Data.SerieTemplate(this.exercises[2], 15, 70);
            set.addSerie(serie1);
            set.addSerie(serie2);
            set.addSerie(serie1.clone());
            set.addSerie(serie2.clone());
            set.addSerie(serie1.clone());
            set.addSerie(serie2.clone());
            this.m_workoutTemplate.addSet(set);
            set = new RemoteTrainer.Data.SetTemplate();
            serie1 = new RemoteTrainer.Data.SerieTemplate(this.exercises[9], 15, 35);
            set.addSerie(serie1);
            set.addSerie(serie1.clone());
            set.addSerie(serie1.clone());
            this.m_workoutTemplate.addSet(set);
            set = new RemoteTrainer.Data.SetTemplate();
            serie1 = new RemoteTrainer.Data.SerieTemplate(this.exercises[10], 10, 120);
            serie2 = new RemoteTrainer.Data.SerieTemplate(this.exercises[3], 10, 15);
            set.addSerie(serie1);
            set.addSerie(serie2);
            set.addSerie(serie1.clone());
            set.addSerie(serie2.clone());
            set.addSerie(serie1.clone());
            set.addSerie(serie2.clone());
            this.m_workoutTemplate.addSet(set);
            set = new RemoteTrainer.Data.SetTemplate();
            serie1 = new RemoteTrainer.Data.SerieTemplate(this.exercises[11], 10, 8);
            set.addSerie(serie1);
            serie2 = serie1.clone();
            serie2.reps = 8;
            set.addSerie(serie2);
            serie2 = serie1.clone();
            serie2.reps = 6;
            set.addSerie(serie2);
            this.m_workoutTemplate.addSet(set);
            set = new RemoteTrainer.Data.SetTemplate();
            serie1 = new RemoteTrainer.Data.SerieTemplate(this.exercises[12], 10, 10);
            set.addSerie(serie1);
            set.addSerie(serie1.clone());
            set.addSerie(serie1.clone());
            this.m_workoutTemplate.addSet(set);
            set = new RemoteTrainer.Data.SetTemplate();
            serie1 = new RemoteTrainer.Data.SerieTemplate(this.exercises[13], 10, 35);
            set.addSerie(serie1);
            set.addSerie(serie1.clone());
            set.addSerie(serie1.clone());
            this.m_workoutTemplate.addSet(set);
            set = new RemoteTrainer.Data.SetTemplate();
            serie1 = new RemoteTrainer.Data.SerieTemplate(this.exercises[14], 10, 20);
            serie2 = new RemoteTrainer.Data.SerieTemplate(this.exercises[15], 75);
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
            var hours = Math.floor(span / 3600);
            span = span % 3600;
            var minutes = Math.floor(span / 60);
            var seconds = span % 60;
            return (hours ? (hours + ":") : "") + (minutes > 9 ? "" : "0") + minutes + ":" + (seconds > 9 ? "" : "0") + seconds;
        };
        return Program;
    }());
    RemoteTrainer.Program = Program;
    var Dialog = (function () {
        function Dialog() {
            this.dialogResult = false;
            this.closed = new Resco.Event(this);
            this.closing = new Resco.Event(this);
            this.name = ko.observable();
            this.uiContentTemplateName = ko.observable();
        }
        Dialog.prototype.done = function () {
            this.dialogResult = true;
            var closingArgs = new Resco.EventArgs();
            this.closing.raise(closingArgs, this);
            if (!closingArgs.cancel)
                this.closed.raise(Resco.EventArgs.Empty, this);
        };
        Dialog.prototype.cancel = function () {
            this.dialogResult = false;
            this.closed.raise(Resco.EventArgs.Empty, this);
        };
        return Dialog;
    }());
    RemoteTrainer.Dialog = Dialog;
    var CreateWorkoutDialog = (function (_super) {
        __extends(CreateWorkoutDialog, _super);
        function CreateWorkoutDialog(workoutTemplates) {
            var _this = _super.call(this) || this;
            _this.name("Add Creaet Workout");
            _this.uiContentTemplateName("tmplCreateWorkoutDialog");
            _this.workoutTemplates = workoutTemplates;
            _this.selectedTemplate = ko.observable(_this.workoutTemplates && _this.workoutTemplates.length > 0 ? _this.workoutTemplates[0] : undefined);
            _this.date = ko.observable("Today");
            return _this;
        }
        return CreateWorkoutDialog;
    }(Dialog));
    RemoteTrainer.CreateWorkoutDialog = CreateWorkoutDialog;
    var MessageBoxClosedEventArgs = (function (_super) {
        __extends(MessageBoxClosedEventArgs, _super);
        function MessageBoxClosedEventArgs(button) {
            var _this = _super.call(this) || this;
            _this.button = button;
            return _this;
        }
        return MessageBoxClosedEventArgs;
    }(Resco.EventArgs));
    RemoteTrainer.MessageBoxClosedEventArgs = MessageBoxClosedEventArgs;
    var MessageBox = (function () {
        function MessageBox(text, buttons, cancelButton) {
            if (buttons === void 0) { buttons = ["OK"]; }
            this.result = -1;
            this.closed = new Resco.Event(this);
            this.text = text;
            this.cancelButton = cancelButton;
            this.buttons = buttons;
        }
        MessageBox.prototype.show = function () {
            Program.instance.messageBox(this);
        };
        MessageBox.prototype.buttonClick = function (index) {
            if (index >= 0)
                this.closed.raise(new MessageBoxClosedEventArgs(index), this);
            Program.instance.messageBox(undefined);
        };
        return MessageBox;
    }());
    RemoteTrainer.MessageBox = MessageBox;
})(RemoteTrainer || (RemoteTrainer = {}));
//# sourceMappingURL=app.js.map