module RemoteTrainer.Data {
    export class WorkoutTemplate {
		public name: string;
		public description: string;
		public setTemplates: SetTemplate[];

		constructor() {
			this.setTemplates = [];
		}

        public addSet(set: SetTemplate): void {
            this.setTemplates.push(set);
            set.parent = this;
            set.order = this.setTemplates.length;
		}

		public copyTo(dst: WorkoutTemplate): void {			
			dst.name = this.name;
			dst.description = this.description;
		}
	}

	export class Workout extends WorkoutTemplate {
		public sets: KnockoutObservableArray<Set>;
		public uiStartedOn: KnockoutObservable<Date>;
		public uiFinishedOn: KnockoutObservable<Date>;
		public uiStatus: KnockoutObservable<WorkoutStatus>;
		public uiDuration: KnockoutObservable<number>;
		public uiDurationLabel: KnockoutComputed<string>;
		public uiCompletion: KnockoutObservable<number>;
		public uiEstDurationLeft: KnockoutObservable<number>;
		public uiEstimatedEndLabel: KnockoutComputed<string>;
		public activeSet: KnockoutObservable<Set>;

		public uiCategoriesInSet: KnockoutObservableArray<Category>;
		public uiExercisesInSet: KnockoutObservableArray<Exercise>;

		constructor(template: WorkoutTemplate) {
			super();
			template.copyTo(this);

			this.uiStartedOn = ko.observable<Date>();
			this.uiFinishedOn = ko.observable<Date>();
			this.uiDuration = ko.observable<number>();
			this.uiDurationLabel = ko.computed<string>(() => {
				var duration = this.uiDuration();
				var mmntDur = moment.duration(duration, "seconds");
				var hours = Math.floor(mmntDur.asHours());
				var minutes = Math.floor(mmntDur.asMinutes());
				var seconds = Math.floor(mmntDur.asSeconds());
				return (hours < 10 ? "0" : "") + hours + ":" + (minutes < 10 ? "0" : "") + minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
			}, this);

			this.uiEstDurationLeft = ko.observable<number>();
			this.uiEstimatedEndLabel = ko.computed<string>(() => {
				var now = Date.now();
				var estDuration = this.uiEstDurationLeft();
				var mmntEstEnd = moment(now + (estDuration * 1000));
				return mmntEstEnd.format("HH:mm") + " (" + moment.duration(estDuration, "seconds").humanize(true) + ")";
			}, this);

			this.uiCompletion = ko.observable(0);

			this.uiStatus = ko.observable(WorkoutStatus.Scheduled);
			this.uiStatus.subscribe((value) => {
				if (this.m_durationTimer) {
					window.clearInterval(this.m_durationTimer);
					this.m_durationTimer = 0;
				}

				if (value === WorkoutStatus.Running) {
					this.m_durationTimer = window.setInterval(() => {
						this.uiDuration(this.uiDuration() + 1);
					}, 1000);
				}
			}, this);

			this.sets = ko.observableArray<Set>();
			var sets = this.sets();
			template.setTemplates.forEach((setTemplate, index) => {
				var set = new Set(setTemplate);
				set.parent = this;
				set.order = index;
				sets.push(set);
				if (index > 0) {
					sets[index - 1].next(set);
					set.previous(sets[index - 1]);
				}
			}, this);
			this.sets.valueHasMutated();

			this.activeSet = ko.observable(sets[0]);

			this.uiCategoriesInSet = ko.observableArray<Category>();
			this.uiExercisesInSet = ko.observableArray<Exercise>();

			this._updateWorkoutItems();
		}

		public start(): void {
			this.uiDuration(0);
			this.uiStartedOn(new Date());

			if (this.sets().length > 0)
				this.uiStatus(WorkoutStatus.Running);
			else
				stop();

			this.updateCompletionStatus();
		}

		public pause(): void {
			this.uiStatus(WorkoutStatus.Paused);
		}

		public continueWorkout(): void {
			this.uiStatus(WorkoutStatus.Running);
		}

		public stop(): void {
			this.uiFinishedOn(new Date());
			this.uiStatus(WorkoutStatus.Finished);
		}

		public showPreviousSet(): void {
			var activeSet = this.activeSet();
			if (activeSet && activeSet.previous())
				this.activeSet(activeSet.previous());
		}

		public showNextSet(): void {
			var activeSet = this.activeSet();
			if (activeSet && activeSet.next())
				this.activeSet(activeSet.next());
		}

		public updateCompletionStatus(): void {
			var serieCount = 0;
			var completedCount = 0;
			var estDurationLeft = 0;

			this.sets().forEach(set => {
				set.series().forEach(serie => {
					serieCount++;
					if (serie.uiStatus() === SerieStatus.Finished)
						completedCount++;
					else 
						estDurationLeft += (serie.exercise.averageDurationPerRep * serie.reps) + 60;	// 60 is average duration of the break
				});
			}, this);

			this.uiCompletion(Math.round((completedCount * 100) / serieCount));
			this.uiEstDurationLeft(estDurationLeft);
		}

		private _updateWorkoutItems(): void {
			var sets = this.sets();
			var catsInSet = this.uiCategoriesInSet();
			var exInSet = this.uiExercisesInSet();

			sets.forEach(set => {
				var series = set.series();
				series.forEach(serie => {
					if (!catsInSet.contains(serie.exercise.category))
						catsInSet.push(serie.exercise.category);

					if (!exInSet.contains(serie.exercise))
						exInSet.push(serie.exercise);
				}, this);
			}, this);

			this.uiCategoriesInSet.valueHasMutated();
			this.uiExercisesInSet.valueHasMutated();
		}

		private m_durationTimer: number;
	}

	export enum WorkoutStatus {
		Scheduled,
		Ready,
		Running,
		Paused,
		Finished
	}
}