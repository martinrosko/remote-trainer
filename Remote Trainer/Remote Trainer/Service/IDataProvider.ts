module RemoteTrainer.Service {
    export interface IDataProvider {
        initialize: (onLoaded: (categories: Data.Category[], exercises: Data.Exercise[], workouts: Data.WorkoutTemplate[]) => void) => void;
        loadWorkout: (workoutId: string, onLoaded: (workout: Data.Workout) => void) => void;
    }

    export interface IEntityWriter {
        subscribeObservableForWriting: <T>(obsVar: KnockoutObservable<T>, fieldName: string) => void;
    }
}