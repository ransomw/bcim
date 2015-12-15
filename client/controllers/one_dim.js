var _ = require('lodash');
var CONST = require('../constants');

var make_on_plot_click = function ($scope) {
  return function () {
    console.log("clicked plot");
    var sample_data = [30, 20, 50, 40, 60, 50];

    $scope.plotData = {
      data: sample_data,
      opts: $scope.opts,
      vars: $scope.vars
    };
  };
};

module.exports = [
  '$scope',
  function ($scope) {
    $scope.PLOT_TYPES = _.omit(CONST.PLOT_TYPES, ['FACTORIAL']);
    $scope.STRATEGIES = CONST.STRATEGIES;
    // must clone b/c constants are frozen
    // and angular repeat directive needs to add hash key
    $scope.MODEL_VARS = _.cloneDeep(CONST.MODEL_VARS);
    $scope.onPlotClick = make_on_plot_click($scope);
    _.defer(function () {
      $scope.$apply(function () {
        $scope.opts = {};
        $scope.opts.plot_type = CONST.PLOT_TYPES.ESTIMATES;
        $scope.opts.strategy = CONST.STRATEGIES.SELECTION;
        $scope.vars = {};
        CONST.MODEL_VARS.forEach(function (model_var) {
          $scope.vars[model_var.name] = model_var.init;
        });
      });
    });
  }
];
