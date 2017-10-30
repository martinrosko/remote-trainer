var RemoteTrainer;
(function (RemoteTrainer) {
    var Data;
    (function (Data) {
        var Exercise = (function () {
            function Exercise() {
            }
            return Exercise;
        }());
        Data.Exercise = Exercise;
        var UnitOfAmount;
        (function (UnitOfAmount) {
            UnitOfAmount[UnitOfAmount["kg"] = 0] = "kg";
            UnitOfAmount[UnitOfAmount["kmh"] = 1] = "kmh";
            UnitOfAmount[UnitOfAmount["level"] = 2] = "level";
        })(UnitOfAmount = Data.UnitOfAmount || (Data.UnitOfAmount = {}));
        var UnitOfRepetitions;
        (function (UnitOfRepetitions) {
            UnitOfRepetitions[UnitOfRepetitions["reps"] = 0] = "reps";
            UnitOfRepetitions[UnitOfRepetitions["sec"] = 1] = "sec";
            UnitOfRepetitions[UnitOfRepetitions["min"] = 2] = "min";
            UnitOfRepetitions[UnitOfRepetitions["m"] = 3] = "m";
            UnitOfRepetitions[UnitOfRepetitions["km"] = 4] = "km";
        })(UnitOfRepetitions = Data.UnitOfRepetitions || (Data.UnitOfRepetitions = {}));
    })(Data = RemoteTrainer.Data || (RemoteTrainer.Data = {}));
})(RemoteTrainer || (RemoteTrainer = {}));
//# sourceMappingURL=exercise.js.map