(function (app) {

    app.component('appContent', {
        templateUrl: './src/templates/appContent.template.html',
        controller: appContentController,
        controllerAs: 'vm'
    });

    appContentController.$inject = ["appWeatherService", "$rootScope", "$scope"];
    function appContentController(appWeatherService, $rootScope, $scope) {
        var vm = this;

        vm.city = "";
        vm.weather = null;
        vm.getWeather = getWeather;

        $rootScope.$on('weather-loaded:city', function (event, weather) {
            console.log('weather-loaded:city', weather);
            vm.weather = weather;
        });

        //////////////////
        
        function getWeather() {
            if ($scope.cityWeatherForm.$invalid && $scope.cityWeatherForm.city.$error.required)
                return;

            var matches = /^[a-zA-Zа-яА-Я]{3,10}/.exec(vm.city);

            if (matches === null || matches[0] != vm.city) {
                $scope.cityWeatherForm.city.$setValidity('pattern_break', false);
                return;
            }

            $scope.cityWeatherForm.city.$setValidity('pattern_break', true);

            appWeatherService.getCityWeather(false, vm.city)
                .then(function (weather) {
                    vm.weather = weather;
                })
                .catch(showError)
        }

        function showError(error) {
            console.log(error);
        }
    }

})(angular.module('axamit-weather-app'));