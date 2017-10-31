var RemoteTrainer;
(function (RemoteTrainer) {
    var Data;
    (function (Data) {
        var Category = (function () {
            function Category(name, light, dark) {
                this.name = name;
                this.colorLight = light;
                this.colorDark = dark;
            }
            return Category;
        }());
        Data.Category = Category;
    })(Data = RemoteTrainer.Data || (RemoteTrainer.Data = {}));
})(RemoteTrainer || (RemoteTrainer = {}));
//# sourceMappingURL=category.js.map