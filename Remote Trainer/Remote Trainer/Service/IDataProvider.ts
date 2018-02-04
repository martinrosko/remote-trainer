module RemoteTrainer.Service {
    export interface IDataProvider {
        loadData: (onLoaded: (categories: Data.Category[], exercises: Data.Exercise[], workouts: Data.WorkoutTemplate[]) => void) => void;
    }
}