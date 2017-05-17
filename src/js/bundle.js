(function () {
    angular.module('axamit-weather-app', []);
})();
(function (app) {

    app.config([function () {

    }]);

})(angular.module('axamit-weather-app'));
(function (app) {

    app.run([function () {

    }]);

})(angular.module('axamit-weather-app'));
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
(function (app) {

    app.service('appWeatherService', appWeatherService);

    appWeatherService.$inject = ["$http", "$q", "$interval", "$timeout", "$rootScope"];
    function appWeatherService($http, $q, $interval, $timeout, $rootScope) {
        var self = this;

        self.userWeatherInteval = 15000;
        self.cityWeatherInteval = 15000;

        self.getCurrentUserWeather = getCurrentUserWeather;
        self.getUserWeather = getUserWeather;
        self.getCityWeather = getCityWeather;

        /////////////////////

        // Loads weather data from LS if possible
        // Returns a Promise with current weather
        function getCurrentUserWeather() {
            var currentWeather = localStorage.getItem('current-weather');

            if (currentWeather !== null) {
                var weather = angular.fromJson(currentWeather),
                    now = new Date();

                weather.loadedAt = new Date(weather.loadedAt);

                var lifeTime = now.valueOf() - weather.loadedAt.valueOf();

                if ( lifeTime > self.weatherInteval ) {
                    // Data from localstorage is expired, need to load new
                    return getUserWeather();
                } else {
                    // When data will be expired we still need to start loading new with interval
                    $timeout(startRequestingUserWeatherByInterval, self.userWeatherInteval - lifeTime );

                    return $q(function(resolve, reject) {
                        resolve(weather);
                    });
                }
            } else {
                // No data in localstorage - need to load new
                return getUserWeather();
            }
        }

        // Loads weather data from API
        // Returns a Promise with current weather
        //
        // If "fireEvent" is true, then it fires an event, when data is loaded
        //
        // Starts to call itself with firing events each 30 mins after first method call
        function getUserWeather(fireEvent) {
            return $q(function(resolve, reject) {
                navigator.geolocation.getCurrentPosition(function (geoposition) {
                    startRequestingUserWeatherByInterval();

                    $http({
                        url: 'http://api.openweathermap.org/data/2.5/weather?lat='+geoposition.coords.latitude+'&lon='+geoposition.coords.longitude+'&appid=6b0e32def39efae8b809106da8c48cd0&units=metric',
                        method: 'get'
                    })
                    .then(function(response) {
                        var preparedResponse = prepareResponse(response);

                        localStorage.setItem('current-weather', angular.toJson(preparedResponse));

                        if (fireEvent)
                            $rootScope.$emit('weather-loaded:user', preparedResponse);

                        resolve(preparedResponse);
                    })
                    .catch(function(error) {
                        reject(error);
                    });
                }, function (error) {
                    startRequestingUserWeatherByInterval();
                    reject(error);
                });
            });
        }


        // Loads weather data from API
        // Returns a Promise with weather in given city
        //
        // If "fireEvent" is true, then it fires an event, when data is loaded
        //
        // Starts to call itself with firing events each 30 mins after first method call
        function getCityWeather(fireEvent, city) {
            if (city !== self.currentCity) {
                $interval.cancel(self.cityWeatherIntevalHolder);
            }

            self.currentCity = city;

            return $q(function(resolve, reject) {
                startRequestingCityWeatherByInterval();
                $http({
                    url: 'http://api.openweathermap.org/data/2.5/weather?q='+city+'&appid=6b0e32def39efae8b809106da8c48cd0&units=metric',
                    method: 'get'
                })
                .then(function(response) {
                    var preparedResponse = prepareResponse(response);

                    if (fireEvent)
                        $rootScope.$emit('weather-loaded:city', preparedResponse);

                    resolve(preparedResponse);
                })
                .catch(function(error) {
                    reject(error);
                })
            });
        }

        function prepareResponse(response) {
            if (!response.data.weather || !response.data.main)
                throw new Error('Wrong params');

            return {
                loadedAt: new Date(),
                icon: 'http://openweathermap.org/img/w/' + response.data.weather[0].icon + '.png',
                description: response.data.weather[0].main,
                temp: parseInt(response.data.main.temp)
            };
        }

        function startRequestingUserWeatherByInterval() {
            if (!self.userWeatherIntevalHolder)
                self.userWeatherIntevalHolder = $interval(function () {
                    getUserWeather(true);
                }, self.userWeatherInteval);
        }

        function startRequestingCityWeatherByInterval() {
            if (!self.cityWeatherIntevalHolder)
                self.cityWeatherIntevalHolder = $interval(function () {
                    getCityWeather(true, self.currentCity);
                }, self.cityWeatherInteval);
        }
    }

})(angular.module('axamit-weather-app'));