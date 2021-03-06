﻿module RemoteTrainer {
    export const DEMODATA = true;

    export class GlobalTimer {
        public fn: (context: any) => void;
        public context: any;
    }

    export class Program {
        private static s_instance: Program;
        static get instance(): Program {
            if (!Program.s_instance)
                Program.s_instance = new Program();
            return Program.s_instance;
        }

        public workout: KnockoutObservable<Data.Workout>;
        public uiContentTemplateName: KnockoutObservable<string>;
        public uiFooterTemplateName: KnockoutObservable<string>;
        public uiSelectedTabIndex: KnockoutObservable<number>;

        public dialogs: KnockoutObservableArray<Dialog>;

        public messageBox: KnockoutObservable<MessageBox>;

        public GlobalTimer: GlobalTimer[] = [];
        public globalTimerPaused: boolean;

        public dataProvider: Service.IDataProvider;

        constructor() {
            this.uiSelectedTabIndex = ko.observable<number>(0);
            this.uiContentTemplateName = ko.observable<string>("tmplOverview");    
            this.uiFooterTemplateName = ko.observable<string>();

            this.globalTimerPaused = false;

            this.dialogs = ko.observableArray<Dialog>();
            this.messageBox = ko.observable<MessageBox>();

            window.setInterval((app: Program) => {
                if (!app.globalTimerPaused)
                    Program.instance.GlobalTimer.forEach(timer => timer.fn(timer.context));
            }, 1000, this);
        }

        public async runApplication(workoutId: string) {
            if (RemoteTrainer.DEMODATA) {
                var login = new Resco.Data.WebService.SimpleLoginInfo();
                login.url = "https://rescocrm.com";
				login.crmOrganization = "roheldevbb"; //"rohelbb"; //
                login.userName = "rohel@resco.net";
				login.password = "P@ssw0rd"; //"1234"; //
                this.dataProvider = new Service.DataProvider(Resco.Data.WebService.Xrm.XrmService.connect(login));

                await this.dataProvider.initialize();//(categories, exercises, workouts) => {

				//this._showModifyWorkoutPage("Prsia, Biceps - B");
				//this._showCreateWorkoutPage(new Date().toDateString());

				var workout = await this.dataProvider.loadWorkout("bfa8497b-e61e-48c2-9020-bc9d4847deee");
                this.workout = ko.observable<Data.Workout>(workout);
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
            }
            //else {
            //    var login = new Resco.Data.WebService.SimpleLoginInfo();
            //    login.url = "https://rescocrm.com";
            //    login.crmOrganization = "rohelbb";
            //    login.userName = "rohel@resco.net";
            //    login.password = "1234";
            //    this.dataProvider = new Service.DataProvider(Resco.Data.WebService.Xrm.XrmService.connect(login));

            //    this.dataProvider.initialize((categories, exercises, workouts) => {
            //        this.categories = categories;
            //        this.exercises = exercises;
            //        this.m_workoutTemplates = workouts;

            //        if (!workoutId) {
            //            //this._showCreateWorkoutPage(new Date().toDateString());
            //        }
            //        else {
            //            MobileCRM.UI.EntityForm.requestObject(entityForm => {
            //                if (entityForm.entity.isNew) {
            //                    this._showCreateWorkoutPage(entityForm.entity.properties.scheduledstart);
            //                }
            //                else {
            //                    this.dataProvider.loadWorkout(workoutId, workout => {
            //                        this.workout = ko.observable(workout);
            //                        if (workout.status() === Data.WorkoutStatus.Running)
            //                            workout.pause();

            //                        MobileCRM.UI.EntityForm.requestObject(function (entityForm) {
            //                            entityForm.isDirty = true;
            //                            entityForm.form.caption = workout.name;
            //                        }, function (err) {
            //                            MobileCRM.bridge.alert("Unable to set caption. " + err);
            //                        }, this);

            //                        MobileCRM.UI.EntityForm.onSave(form => {
            //                            var suspendHandler = form.suspendSave();
            //                            this.dataProvider.saveWorkout(this.workout(), (error) => suspendHandler.resumeSave(error));
            //                        }, true, this);
            //                        ko.applyBindings(this);
            //                    });
            //                }
            //            }, function (err) {
            //                MobileCRM.bridge.alert(err);
            //            }, this);

            //        }
            //    });
            //}
        }

        private _showCreateWorkoutPage(date: string): void {
            let dialog = new ScheduleWorkoutDialog(this.dataProvider.workoutTemplates, date);
			dialog.closed.add(this, (sender, e) => this._scheduleDialogClosed(dialog));
            Program.instance.showDialog(dialog);
		}

		private async _scheduleDialogClosed(dialog: ScheduleWorkoutDialog) {
			if (dialog.dialogResult) {
				var newDate = new Date(dialog.date());
				newDate.setHours(8);
				var id = await this.dataProvider.instantiateWorkout(dialog.selectedTemplate(), dialog.selectedTemplate().name(), newDate);
				//MobileCRM.UI.EntityForm.closeWithoutSaving();
			}
			else {
				//MobileCRM.UI.EntityForm.closeWithoutSaving();
			}
		}

		private _showModifyWorkoutPage(workoutName: string): void {
			var workoutTemplate = this.dataProvider.workoutTemplates.firstOrDefault(wt => wt.name().startsWith(workoutName));
			if (!workoutTemplate)
				workoutTemplate = new Data.WorkoutTemplate();

			let dialog = new Data.ModifyWorkoutDialog(workoutTemplate);
			dialog.closed.add(this, (sender, e) => {
				if (dialog.dialogResult) {
					workoutTemplate.name(dialog.workout().name());
					workoutTemplate.description(dialog.workout().description());

					// add new sets and series
					workoutTemplate.setTemplates.splice(0);
					dialog.workout().sets().forEach(set => {
						var setTemplate = new Data.SetTemplate();
						setTemplate.name = set.name;

						set.series().forEach(serie => {
							var serieTemplate = new Data.SerieTemplate();
							serieTemplate.amount  = serie.uiAmount();
							serieTemplate.reps = serie.uiReps();
							serieTemplate.exercise = serie.exercise;
							setTemplate.addSerie(serieTemplate);
						}, this);

						workoutTemplate.addSet(setTemplate);
					});

					this.dataProvider.updateWorkoutTemplate(workoutTemplate);
				}
			});
			Program.instance.showDialog(dialog);
		}

        public clearTimer(timer: GlobalTimer): boolean {
            let timerIndex = Program.instance.GlobalTimer.indexOf(timer);
            if (timerIndex >= 0) {
                Program.instance.GlobalTimer.splice(timerIndex, 1);
                return true;
            }
            return false;
        }

        public onTabItemClicked(itemName: string): void {
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
        }

        public showDialog(dialog: Dialog): void {
            dialog.closed.add(this, (sender, e) => {
                this.dialogs.remove(dialog);
            });
            this.dialogs.push(dialog);
        }

        // FIXME: move to helper class
        public spanToTimeLabel(span: number): string {
            var hours = Math.floor(span / 3600);
            span = span % 3600;
            var minutes = Math.floor(span / 60);
            var seconds = span % 60;
            return (hours ? (hours + ":") : "") + (minutes > 9 ? "" : "0") + minutes + ":" + (seconds > 9 ? "" : "0") + seconds;
        }

        private m_workoutTemplate: Data.WorkoutTemplate;
    }

    export class Dialog {
        public closed: Resco.Event<Resco.EventArgs>;
        public closing: Resco.Event<Resco.EventArgs>;
        public dialogResult: boolean;
        public name: KnockoutObservable<string>;
        public uiContentTemplateName: KnockoutObservable<string>;

        constructor() {
            this.dialogResult = false;
            this.closed = new Resco.Event<Resco.EventArgs>(this);
            this.closing = new Resco.Event<Resco.EventArgs>(this);
            this.name = ko.observable<string>();
            this.uiContentTemplateName = ko.observable<string>();
        }

        public done(): void {
            this.dialogResult = true;

            let closingArgs = new Resco.EventArgs();
            this.closing.raise(closingArgs, this);
            if (!closingArgs.cancel)
                this.closed.raise(Resco.EventArgs.Empty, this);
        }

        public cancel(): void {
            this.dialogResult = false;
            this.closed.raise(Resco.EventArgs.Empty, this);
        }
    }

    export class ScheduleWorkoutDialog extends Dialog {
        public workoutTemplates: Data.WorkoutTemplate[];
		public selectedTemplate: KnockoutObservable<Data.WorkoutTemplate>;
		public workout: KnockoutObservable<Data.Workout>;
        public date: KnockoutObservable<string>;

        public selectWorkout: Resco.Controls.SelectBox<Data.WorkoutTemplate>;

        constructor(workoutTemplates: Data.WorkoutTemplate[], initDate: string) {
            super();

            this.name("Schedule Workout");
			this.uiContentTemplateName("tmplScheduleWorkoutDialog");

			this.workoutTemplates = workoutTemplates ? workoutTemplates : [];

			//var newWorkoutTemplate = new Data.WorkoutTemplate();
			//newWorkoutTemplate.name = "<New Workout>";
			//this.workoutTemplates.splice(0, 0, newWorkoutTemplate);

			this.selectedTemplate = ko.observable<Data.WorkoutTemplate>(); //this.workoutTemplates && this.workoutTemplates.length > 0 ? this.workoutTemplates[0] : undefined);

			this.workout = ko.observable<Data.Workout>();

            this.selectWorkout = new Resco.Controls.SelectBox<Data.WorkoutTemplate>();
            this.selectWorkout.itemLabel("name")
			this.selectWorkout.items(workoutTemplates);
			this.selectWorkout.selectedItem(this.selectedTemplate());
			this.selectWorkout.selecteItemChanged.add(this, this._selectWorkoutItemChanged);
			this.selectWorkout.selectText("Select Workout...")

            this.date = ko.observable<string>(initDate);
        }

        private _selectWorkoutItemChanged(sender: any, args: Resco.Controls.SelectBoxItemChangedArgs<Data.WorkoutTemplate>): void {
			this.selectedTemplate(args.item);
			this.workout(new Data.Workout(this.selectedTemplate()));
        }
    }

    export class MessageBoxClosedEventArgs extends Resco.EventArgs {
        public button: number;
        constructor(button: number) {
            super();
            this.button = button;
        }
    }

    export class MessageBox {
        public closed: Resco.Event<MessageBoxClosedEventArgs>;
        public text: string;
        public cancelButton: string;
        public buttons: string[];
        public result: number;

        constructor(text: string, buttons: string[] = ["OK"], cancelButton?: string) {
            this.result = -1;
            this.closed = new Resco.Event<MessageBoxClosedEventArgs>(this);
            this.text = text;
            this.cancelButton = cancelButton;
            this.buttons = buttons;
        }

        public show(): void {
            Program.instance.messageBox(this);
        }

        public buttonClick(index: number): void {
            if (index >= 0)
                this.closed.raise(new MessageBoxClosedEventArgs(index), this);
            Program.instance.messageBox(undefined);
        }
    }

}