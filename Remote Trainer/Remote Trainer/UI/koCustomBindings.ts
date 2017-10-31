ko.bindingHandlers.app = {
    init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
    },
    update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
        ko.renderTemplate("tmplApplication", valueAccessor(), { templateEngine: ko.nativeTemplateEngine.instance }, element, "replaceNode")
    }
};