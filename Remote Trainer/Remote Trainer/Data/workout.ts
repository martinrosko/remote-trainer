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
        public uiState: KnockoutObservable<WorkoutState>;
        public uiStartedOn: KnockoutObservable<number>;
        public uiFinishedOn: KnockoutObservable<number>;

        public activeSet: KnockoutObservable<Data.Set>;

        constructor(template: WorkoutTemplate) {
            super();
            template.copyTo(this);

            this.uiState = ko.observable(WorkoutState.Ready);
            this.uiStartedOn = ko.observable<number>();
            this.uiFinishedOn = ko.observable<number>();
            this.sets = ko.observableArray<Set>();
            var sets = this.sets();

            template.setTemplates.forEach((setTemplate, index) => {
                var set = new Set(setTemplate);
                set.parent = this;
                set.order = index;
                sets.push(set);

                if (index > 0)
                    sets[index - 1].next = set;
            }, this);

            this.sets.valueHasMutated();
        }

        public start(): void {
            this.uiStartedOn(Date.now());
            this.activeSet = ko.observable<Data.Set>(this.sets()[0])
            this.activeSet().series()[0].uiStatus(Data.SerieStatus.Ready);
        }

        public stop(): void {
            this.uiFinishedOn(Date.now());
        }
    }

    export enum WorkoutState {
        Ready,
        Running,
        Finished
    }
}