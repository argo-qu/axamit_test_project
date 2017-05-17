(function (app) {

    app.component('appWeatherBlock', {
        templateUrl: './src/templates/appWeatherBlock.template.html',
        controller: appWeatherBlockController,
        controllerAs: 'vm',
        bindings: {
            weather: '='
        }
    });

    appWeatherBlockController.$inject = [];
    function appWeatherBlockController() {
        var vm = this;

    }

})(angular.module('axamit-weather-app'));