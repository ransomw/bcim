window.name = "NG_DEFER_BOOTSTRAP!";

var angular = require('angular');
require('angular-route');
var CONST = require('./constants');
require('./controllers_main');


angular.element(document).ready(function () {

  var bcim_app = angular.module(CONST.APP_NAME, [
    'ngRoute',
    CONST.APP_NAME + '.controllers'
  ]);

  bcim_app.config(
    ['$routeProvider',
     function($routeProvider) {
       $routeProvider.when('/', {
         templateUrl: CONST.PARTIAL_BASE + 'one_dim.html',
         controller: 'one_dim'
       });
       $routeProvider
         .otherwise({
           redirectTo: '/'
         });
     }]);

  angular.bootstrap(document, [CONST.APP_NAME]);

});
