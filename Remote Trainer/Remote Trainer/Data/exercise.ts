module RemoteTrainer.Data {
    export class Exercise {
        public id: string;
        public name: string;
        public description: string;
        public category: Category;
        public uoa: UnitOfAmount;
		public uor: UnitOfRepetitions;
		public averageDurationPerRep: number;
    }

    export enum UnitOfAmount {
        kg = 10000,
        kmh = 10001,
        level = 10002,
        none
    }

    export enum UnitOfRepetitions {
        reps = 10000,
        sec = 10001,
        min = 10002,
        m = 10003,
        km = 10004
    }
}