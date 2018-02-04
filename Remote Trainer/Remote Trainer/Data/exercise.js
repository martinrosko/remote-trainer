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
            UnitOfAmount[UnitOfAmount["kg"] = 10000] = "kg";
            UnitOfAmount[UnitOfAmount["kmh"] = 10001] = "kmh";
            UnitOfAmount[UnitOfAmount["level"] = 10002] = "level";
            UnitOfAmount[UnitOfAmount["none"] = 10003] = "none";
        })(UnitOfAmount = Data.UnitOfAmount || (Data.UnitOfAmount = {}));
        var UnitOfRepetitions;
        (function (UnitOfRepetitions) {
            UnitOfRepetitions[UnitOfRepetitions["reps"] = 10000] = "reps";
            UnitOfRepetitions[UnitOfRepetitions["sec"] = 10001] = "sec";
            UnitOfRepetitions[UnitOfRepetitions["min"] = 10002] = "min";
            UnitOfRepetitions[UnitOfRepetitions["m"] = 10003] = "m";
            UnitOfRepetitions[UnitOfRepetitions["km"] = 10004] = "km";
        })(UnitOfRepetitions = Data.UnitOfRepetitions || (Data.UnitOfRepetitions = {}));
    })(Data = RemoteTrainer.Data || (RemoteTrainer.Data = {}));
})(RemoteTrainer || (RemoteTrainer = {}));
//# sourceMappingURL=exercise.js.map