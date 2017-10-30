module RemoteTrainer.Data {
    export class WorkoutTemplate {
        public setTemplates: SetTemplate[];

        public addSet(set: SetTemplate): void {
            this.setTemplates.push(set);
            set.parent = this;
            set.order = this.setTemplates.length;
        }
    }
}