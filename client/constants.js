var util = require('./util');

var PLOT_TYPES = {
  ESTIMATES : 'Estimates',
  FULL_MODEL : 'Full Model',
  FACTORIAL : 'Factorial'
};

util.freeze(PLOT_TYPES);

var STRATEGIES = {
  SELECTION: 'Selection',
  AVERAGING: 'Averaging',
  MATCHING: 'Matching'
};

util.freeze(STRATEGIES);

var MODEL_VARS = [
  {
    name: 'p_common',
    init: 0.5,
    step: 0.05,
    bounds: [0, 1]
  },
  {
    name: 'Disparity',
    init: 20,
    get step () {
      return 1/(this.bounds[0], this.bounds[1]);
    },
    bounds: [0, 80]
  },
  {
    name: 'sigma_X1',
    init: 2,
    get step () {
      return 1/(this.bounds[0], this.bounds[1]);
    },
    bounds: [1, 50]
  },
  {
    name: 'sigma_X2',
    init: 10,
    get step () {
      return 1/(this.bounds[0], this.bounds[1]);
    },
    bounds: [1, 50]
  },
  {
    name: 'sigma_Pr',
    init: 20,
    get step () {
      return 1/(this.bounds[0], this.bounds[1]);
    },
    bounds: [1, 100]
  },
  {
    name: 'mean_Pr',
    init: 0,
    get step () {
      return 3/(this.bounds[0], this.bounds[1]);
    },
    bounds: [-30, 30]
  }
];

util.freeze(MODEL_VARS);

var CONST = {};

CONST.STRATEGIES = STRATEGIES;
CONST.MODEL_VARS = MODEL_VARS;
CONST.PLOT_TYPES = PLOT_TYPES;
CONST.APP_NAME = 'dcim';
CONST.PARTIAL_BASE = 'partials/';

util.freeze(CONST);

module.exports = CONST;
