module RemoteTrainer.Data {
    export class Exercise {
        public name: string;
        public description: string;
        public category: Category;
        public uoa: UnitOfAmount;
        public uor: UnitOfRepetitions;
    }

    export enum UnitOfAmount {
        kg,
        kmh,
        level
    }

    export enum UnitOfRepetitions {
        reps,
        sec,
        min,
        m,
        km
    }
}