module RemoteTrainer.Data {
    export class SerieTemplate {
        public order: number;
        public amount: number;
        public reps: number;
        public parent: SetTemplate;
        public exercise: Exercise;

        constructor(exercise?: Exercise, reps?: number, amount?: number) {
            this.exercise = exercise;
            this.reps = reps;
            this.amount = amount;
        }

        public copyTo(dst: SerieTemplate): void {
            dst.exercise = this.exercise;
            dst.order = this.order;
            dst.amount = this.amount;
            dst.reps = this.reps;
        }

        public clone(): SerieTemplate {
            var result = new SerieTemplate();
            this.copyTo(result);
            return result;
        }
    }

    export class Serie extends SerieTemplate {
        public uiStatus: KnockoutObservable<SerieStatus>;
        public uiStartedOn: KnockoutObservable<Date>;
        public uiFinishedOn: KnockoutObservable<Date>;
        public uiDuration: KnockoutComputed<number>;
        public uiAmount: KnockoutObservable<number>;
        public uiReps: KnockoutObservable<number>;
        public uiDifficulty: KnockoutObservable<string>;
        public uiOptionsContentTemplate: KnockoutObservable<string>;
        public uiOptionsPanelState: KnockoutObservable<OptionPanelState>;
        public next: Serie;

        static difficulties: string[] = ["Very Easy", "Easy", "Medium", "Hard", "Very Hard"];

        constructor(template: SerieTemplate) {
            super();
            template.copyTo(this);

            this.uiAmount = ko.observable<number>(template.amount);
            this.uiReps = ko.observable<number>(template.reps);
            this.uiDifficulty = ko.observable<string>(Serie.difficulties[3]);
            this.uiStatus = ko.observable(SerieStatus.Queued);
            this.uiStartedOn = ko.observable<Date>();
            this.uiFinishedOn = ko.observable<Date>();
            this.uiOptionsContentTemplate = ko.observable<string>("tmplOptionsSerieSettings");
            this.uiOptionsPanelState = ko.observable<OptionPanelState>();

            this.uiDuration = ko.computed<number>(() => {
                var started = this.uiStartedOn();
                var finished = this.uiFinishedOn();
                if (started && finished) {
                    return Math.round((finished.getTime() - started.getTime()) / 1000);
                }
                return -1;
            });
        }

        public onStatusClicked(): void {
            var status = this.uiStatus();

            switch (status) {
                case SerieStatus.Queued:
                    this.uiOptionsPanelState(this.uiOptionsPanelState() === OptionPanelState.Closing ? OptionPanelState.Opening : OptionPanelState.Closing);
                    this.uiOptionsContentTemplate("tmplOptionsSerieSettings");
                    break;

                case SerieStatus.Ready:
                    this.uiStatus(SerieStatus.Running);
                    this.uiOptionsContentTemplate("tmplOptionsRunningSerie");
                    this.uiOptionsPanelState(OptionPanelState.Opening);
                    var now = new Date();
                    this.uiStartedOn(now);
                    this.uiFinishedOn(now);
                    this.m_timer = window.setInterval(() => {
                        this.uiFinishedOn(new Date());
                    }, 1000);
                    (<Set>this.parent).stopBreak(this.order - 1);
                    break;

                case SerieStatus.Running:
                    this.uiStatus(SerieStatus.Finished);
                    this.uiOptionsPanelState(OptionPanelState.Closing);
                    this.uiOptionsContentTemplate("tmplOptionsSerieComplete");
                    this.uiFinishedOn(new Date());
                    window.clearInterval(this.m_timer);
                    if (this.next) {
                        this.next.uiStatus(SerieStatus.Ready);
                        (<Set>this.parent).startBreak(this.order);
                    }
                    else {
                        // finish set
                    }
                    break;

                case SerieStatus.Finished:
                    this.uiOptionsPanelState(this.uiOptionsPanelState() === OptionPanelState.Closing ? OptionPanelState.Opening : OptionPanelState.Closing);
                    break;
            }
        }

        private m_timer: number;
    }

    export enum SerieStatus {
        Queued = 1,
        Finished = 2,
        Ready = 10000,
        Running = 10001,
        Paused = 10002,
    }

    export enum OptionPanelState {
        Closing,
        Closed,
        Opening,
        Opened
    }
}