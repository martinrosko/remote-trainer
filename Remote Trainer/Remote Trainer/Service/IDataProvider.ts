module RemoteTrainer.Service {
    export interface IDataProvider {
        initialize: (onLoaded: (categories: Data.Category[], exercises: Data.Exercise[], workouts: Data.WorkoutTemplate[]) => void) => void;
        loadWorkout: (workoutId: string, onLoaded: (workout: Data.Workout) => void) => void;
        saveWorkout: (workout: Data.Workout, callback: (error: string) => void) => void;
        getExerciseSeries: (exercise: Data.Exercise, onComplete: (result: Data.Serie[]) => void, onCompleteScope?: any) => void;
        instantiateWorkout: (workoutTemplate: Data.WorkoutTemplate, workoutName: string, scheduledOn: Date, onComplete: () => void, onCompleteScope?: any) => void;
    }

    export interface IEntityWriter {
        subscribeObservableForWriting: <T>(obsVar: KnockoutObservable<T>, fieldName: string) => void;
    }
}