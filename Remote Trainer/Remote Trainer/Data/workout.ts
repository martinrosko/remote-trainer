module RemoteTrainer.Data {
    export class WorkoutTemplate {
        public id: string;
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

        public displayedSet: KnockoutObservable<Data.Set>;

        constructor(template?: WorkoutTemplate) {
            super();

            this.uiState = ko.observable(WorkoutState.Ready);
            this.uiStartedOn = ko.observable<number>();
            this.uiFinishedOn = ko.observable<number>();
            this.sets = ko.observableArray<Set>();

            if (template) {
                template.copyTo(this);
                template.setTemplates.forEach(setTemplate => this.addSet(new Set(setTemplate)), this);
            }

            this.displayedSet = ko.observable<Data.Set>();
        }

        public addSet(set: Set): void {
            let index = this.sets().length;
            set.parent = this;
            set.order = index;
            this.sets().push(set);

            if (index > 0) {
                this.sets()[index - 1].next = set;
                set.previous = this.sets()[index - 1];
            }
        }

        public start(): void {
            this.uiStartedOn(Date.now());
            this.displayedSet = ko.observable<Data.Set>(this.sets()[0])
            this.displayedSet().start();
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