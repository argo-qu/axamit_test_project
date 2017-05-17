(function (app) {

    app.component('appHeader', {
        templateUrl: './src/templates/appHeader.template.html',
        controller: appHeaderController,
        controllerAs: 'vm'
    });

    appHeaderController.$inject = ["appWeatherService", "$rootScope"];
    function appHeaderController(appWeatherService, $rootScope) {
        var vm = this;

        vm.weather = null;

        appWeatherService.getCurrentUserWeather()
            .then(function (weather) {
                vm.weather = weather;
            })
            .catch(showError);

        $rootScope.$on('weather-loaded:user', function (event, weather) {
            vm.weather = weather;
        });

        function showError(error) {
            console.log(error)
        }
    }

})(angular.module('axamit-weather-app'));