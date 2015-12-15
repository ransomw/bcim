var angular = require('angular');
var _ = require('lodash');
var c3 = require('c3');
var CONST = require('./constants');
var util = require('./util');
var stats = require('./stats');
var controllers = require('./controllers');

var angular_module_controllers = angular.module(
  CONST.APP_NAME+'.controllers', []);

util.spread(
  _.pairs(controllers),
  // anon fn to make usage explicit
  function (controller_name, controller_def) {
    angular_module_controllers
      .controller(controller_name, controller_def);
  });

var make_chart_el = function (chart_data) {

  console.log("in make_chart_el");
  // console.log("chart_data");
  // console.log(chart_data);


  var bci_model_args = CONST.MODEL_VARS.map(function (model_var) {
    return chart_data.vars[model_var.name];
  });
  bci_model_args.push(chart_data.opts);
  var model_res = stats.bci_model.apply(null, bci_model_args);

  console.log("model_res");
  console.log(model_res);


  var chart;

  // chart = c3.generate({
  //   data: {
  //     columns: [
  //       ['chart_data'].concat(chart_data.data)
  //     ]
  //   }
  // });



  chart = c3.generate({
    data: {
      x: 'x',
      columns: [
        ['x'].concat(model_res.x),
        ['freq_predV_bi'].concat(model_res.freq_predV_bi),
        ['freq_predT_bi'].concat(model_res.freq_predT_bi)
      ]
    }
  });



  return chart.element;
};

angular_module_controllers.directive(
  'bcimPlot',
  ['$compile', '$controller',
   function($compile, $controller) {
     var directive_link = function(scope, $el, attrs) {
       scope.$watch('plotData', function (new_val, old_val) {
         var chart_data = _.cloneDeep(new_val);
         if (chart_data) {
           $el.html('');
           $el[0].appendChild(make_chart_el(chart_data));
         }

       });
     };
     return {
       link: directive_link
     };
   }]);
