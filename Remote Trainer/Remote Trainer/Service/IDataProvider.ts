module RemoteTrainer.Service {
    export interface IDataProvider {
        initialize: () => Promise<void>;
        loadWorkout: (workoutId: string) => Promise<Data.Workout>;
        saveWorkout: (workout: Data.Workout, callback: (error: string) => void) => void;
		getExerciseSeries: (exercise: Data.Exercise) => Promise<Data.Serie[]>;
		instantiateWorkout: (workoutTemplate: Data.WorkoutTemplate, workoutName: string, scheduledOn: Date) => Promise<Resco.Data.Guid>;
		updateWorkoutTemplate: (workoutTemplate: Data.WorkoutTemplate) => Promise<void>;

		categories: Data.Category[];
		exercises: Data.Exercise[];
		workoutTemplates: Data.WorkoutTemplate[];
    }

    export interface IEntityWriter {
        subscribeObservableForWriting: <T>(obsVar: KnockoutObservable<T>, fieldName: string) => void;
    }
}