module RemoteTrainer.Data {
    export class Exercise {
        public name: string;
        public description: string;
        public category: Category;
        public uoa: UnitOfAmount;
		public uor: UnitOfRepetitions;
		public averageDurationPerRep: number;
    }

    export enum UnitOfAmount {
        kg,
        kmh,
        level,
        none
    }

    export enum UnitOfRepetitions {
        reps,
        sec,
        min,
        m,
        km
    }
}