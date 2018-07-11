module RemoteTrainer.Service {
    export interface IDataProvider {
        initialize: () => Promise<void>;
        loadWorkout: (workoutId: string) => Promise<Data.Workout>;
        saveWorkout: (workout: Data.Workout, callback: (error: string) => void) => void;
		getExerciseSeries: (exercise: Data.Exercise) => Promise<Data.Serie[]>;
        instantiateWorkout: (workoutTemplate: Data.WorkoutTemplate, workoutName: string, scheduledOn: Date, onComplete: () => void, onCompleteScope?: any) => void;
    }

    export interface IEntityWriter {
        subscribeObservableForWriting: <T>(obsVar: KnockoutObservable<T>, fieldName: string) => void;
    }
}