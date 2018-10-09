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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var RemoteTrainer;
(function (RemoteTrainer) {
    RemoteTrainer.DEMODATA = true;
    var GlobalTimer = /** @class */ (function () {
        function GlobalTimer() {
        }
        return GlobalTimer;
    }());
    RemoteTrainer.GlobalTimer = GlobalTimer;
    var Program = /** @class */ (function () {
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
            return __awaiter(this, void 0, void 0, function () {
                var login, workout;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!RemoteTrainer.DEMODATA) return [3 /*break*/, 3];
                            login = new Resco.Data.WebService.SimpleLoginInfo();
                            login.url = "https://rescocrm.com";
                            login.crmOrganization = "roheldevbb"; //"rohelbb"; //
                            login.userName = "rohel@resco.net";
                            login.password = "P@ssw0rd"; //"1234"; //
                            this.dataProvider = new RemoteTrainer.Service.DataProvider(Resco.Data.WebService.Xrm.XrmService.connect(login));
                            return [4 /*yield*/, this.dataProvider.initialize()];
                        case 1:
                            _a.sent(); //(categories, exercises, workouts) => {
                            return [4 /*yield*/, this.dataProvider.loadWorkout("bfa8497b-e61e-48c2-9020-bc9d4847deee")];
                        case 2:
                            workout = _a.sent();
                            this.workout = ko.observable(workout);
                            //if (workout.status() === Data.WorkoutStatus.Running)
                            //    workout.pause();
                            //MobileCRM.UI.EntityForm.requestObject(function (entityForm) {
                            //    entityForm.isDirty = true;
                            //    entityForm.form.caption = workout.name;
                            //}, function (err) {
                            //    MobileCRM.bridge.alert("Unable to set caption. " + err);
                            //}, this);
                            //MobileCRM.UI.EntityForm.onSave(form => {
                            //    var suspendHandler = form.suspendSave();
                            //    this.dataProvider.saveWorkout(this.workout(), (error) => suspendHandler.resumeSave(error));
                            //}, true, this);
                            ko.applyBindings(this);
                            _a.label = 3;
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        Program.prototype._showCreateWorkoutPage = function (date) {
            var _this = this;
            var dialog = new ScheduleWorkoutDialog(this.dataProvider.workoutTemplates, date);
            dialog.closed.add(this, function (sender, e) { return _this._scheduleDialogClosed(dialog); });
            Program.instance.showDialog(dialog);
        };
        Program.prototype._scheduleDialogClosed = function (dialog) {
            return __awaiter(this, void 0, void 0, function () {
                var newDate, id;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!dialog.dialogResult) return [3 /*break*/, 2];
                            newDate = new Date(dialog.date());
                            newDate.setHours(8);
                            return [4 /*yield*/, this.dataProvider.instantiateWorkout(dialog.selectedTemplate(), dialog.selectedTemplate().name(), newDate)];
                        case 1:
                            id = _a.sent();
                            return [3 /*break*/, 2];
                        case 2: return [2 /*return*/];
                    }
                });
            });
        };
        Program.prototype._showModifyWorkoutPage = function (workoutName) {
            var _this = this;
            var workoutTemplate = this.dataProvider.workoutTemplates.firstOrDefault(function (wt) { return wt.name().startsWith(workoutName); });
            if (!workoutTemplate)
                workoutTemplate = new RemoteTrainer.Data.WorkoutTemplate();
            var dialog = new RemoteTrainer.Data.ModifyWorkoutDialog(workoutTemplate);
            dialog.closed.add(this, function (sender, e) {
                if (dialog.dialogResult) {
                    workoutTemplate.name(dialog.workout().name());
                    workoutTemplate.description(dialog.workout().description());
                    // add new sets and series
                    workoutTemplate.setTemplates.splice(0);
                    dialog.workout().sets().forEach(function (set) {
                        var setTemplate = new RemoteTrainer.Data.SetTemplate();
                        setTemplate.name = set.name;
                        set.series().forEach(function (serie) {
                            var serieTemplate = new RemoteTrainer.Data.SerieTemplate();
                            serieTemplate.amount = serie.uiAmount();
                            serieTemplate.reps = serie.uiReps();
                            serieTemplate.exercise = serie.exercise;
                            setTemplate.addSerie(serieTemplate);
                        }, _this);
                        workoutTemplate.addSet(setTemplate);
                    });
                    _this.dataProvider.updateWorkoutTemplate(workoutTemplate);
                }
            });
            Program.instance.showDialog(dialog);
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
    var Dialog = /** @class */ (function () {
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
    var ScheduleWorkoutDialog = /** @class */ (function (_super) {
        __extends(ScheduleWorkoutDialog, _super);
        function ScheduleWorkoutDialog(workoutTemplates, initDate) {
            var _this = _super.call(this) || this;
            _this.name("Schedule Workout");
            _this.uiContentTemplateName("tmplScheduleWorkoutDialog");
            _this.workoutTemplates = workoutTemplates ? workoutTemplates : [];
            //var newWorkoutTemplate = new Data.WorkoutTemplate();
            //newWorkoutTemplate.name = "<New Workout>";
            //this.workoutTemplates.splice(0, 0, newWorkoutTemplate);
            _this.selectedTemplate = ko.observable(); //this.workoutTemplates && this.workoutTemplates.length > 0 ? this.workoutTemplates[0] : undefined);
            _this.workout = ko.observable();
            _this.selectWorkout = new Resco.Controls.SelectBox();
            _this.selectWorkout.itemLabel("name");
            _this.selectWorkout.items(workoutTemplates);
            _this.selectWorkout.selectedItem(_this.selectedTemplate());
            _this.selectWorkout.selecteItemChanged.add(_this, _this._selectWorkoutItemChanged);
            _this.selectWorkout.selectText("Select Workout...");
            _this.date = ko.observable(initDate);
            return _this;
        }
        ScheduleWorkoutDialog.prototype._selectWorkoutItemChanged = function (sender, args) {
            this.selectedTemplate(args.item);
            this.workout(new RemoteTrainer.Data.Workout(this.selectedTemplate()));
        };
        return ScheduleWorkoutDialog;
    }(Dialog));
    RemoteTrainer.ScheduleWorkoutDialog = ScheduleWorkoutDialog;
    var MessageBoxClosedEventArgs = /** @class */ (function (_super) {
        __extends(MessageBoxClosedEventArgs, _super);
        function MessageBoxClosedEventArgs(button) {
            var _this = _super.call(this) || this;
            _this.button = button;
            return _this;
        }
        return MessageBoxClosedEventArgs;
    }(Resco.EventArgs));
    RemoteTrainer.MessageBoxClosedEventArgs = MessageBoxClosedEventArgs;
    var MessageBox = /** @class */ (function () {
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