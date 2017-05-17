(function (app) {

    app.component('appFooter', {
        templateUrl: './src/templates/appFooter.template.html',
        controller: appFooterController,
        controllerAs: 'vm'
    });

    appFooterController.$inject = [];
    function appFooterController() {
        var vm = this;
    }

})(angular.module('axamit-weather-app'));