ko.bindingHandlers.app = {
    init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
    },
    update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
        ko.renderTemplate("tmplApplication", valueAccessor(), { templateEngine: ko.nativeTemplateEngine.instance }, element, "replaceNode")
    }
};

ko.bindingHandlers.datepicker = {
    init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
        var value = valueAccessor();
        $(element).datepicker({
            onSelect: function (date) {
                value(date);
            },
            minDate: 0
        });
        if (value())
            $(element).datepicker("setDate", value());
    },
    update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
    }
};