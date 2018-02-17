module RemoteTrainer.Service {
    export interface IDataProvider {
        initialize: (onLoaded: (categories: Data.Category[], exercises: Data.Exercise[], workouts: Data.WorkoutTemplate[]) => void) => void;
        loadWorkout: (workoutId: string, onLoaded: (workout: Data.Workout) => void) => void;
        saveWorkout: (workout: Data.Workout, callback: (error: string) => void) => void;
        instantiateWorkout: (workoutTemplate: Data.WorkoutTemplate, workoutName: string, scheduledOn: Date) => void;
    }

    export interface IEntityWriter {
        subscribeObservableForWriting: <T>(obsVar: KnockoutObservable<T>, fieldName: string) => void;
    }
}