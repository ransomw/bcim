var _ = require('lodash');

var util = require('./util');
var CONST = require('./constants');

/// matlab-like fns

/* return an array of `num` evenly spaced points on the interval
 * [`lo`, `hi`]
 */
var linspace = function (lo, hi, num) {
  var len = hi - lo;
  if (lo >= hi) {
    throw new Error("linspace expects hi > lo");
  }
  if (num < 2) {
    throw new Error("linspace expects at least two points (num >= 2)");
  }
  return _.range(num).map(function (pt) {
      return (pt * len)/num + lo;
    });
};

var hist = function (vals, bin_centers) {
  var bin_bounds = _.zip(
    [null].concat(bin_centers),
    bin_centers.concat([null])).slice(1, -1).map(_.spread(
      function (a, b) {
        return (a + b) / 2;
      }));
  var counts = _.range(bin_centers.length)
        .map(function () {return 0;});
  vals.forEach(function (val) {
    // since bin_bounds is sorted, binary search would be faster
    var bin_idx = _.findIndex(bin_bounds, function (hi_bound) {
      return val < hi_bound;
    });
    bin_idx = bin_idx === -1 ? bin_centers.length : bin_idx;
    counts[bin_idx] += 1;
  });
  // debugger;
  return counts;
};

/// functional util

var diff_sq = function (a, b) {
  return Math.pow(a - b, 2);
};

/// probability util

/* normally-distrubuted random numbers */
var rand_norm = (function () {
  var N = 6; // enough (?) for good approximation
  return function () {
    return (_.range(N).map(function () {
      return Math.random();
    }).reduce(function (a, b) {return a + b;}, 0) - 3) / 3;
  };
}());

// ??? not certain about this vs. normal distribution
var norm_non_dist = function(mean, variance) {
  return function (x) {
    return Math.exp((x - mean)/(2 * variance)) /
      (2 * Math.PI * Math.sqrt(variance));
  };
};

var norm_dist = function(mean, variance) {
  return function (x) {
    return Math.exp((x - mean)/(2 * variance)) /
      Math.sqrt(2 * Math.PI * variance);
  };
};

var lowerBnd = -42;
var upperBnd = 42;
var numBins = 50;
var NUM = 10000;

module.exports.bci_model = function (
  p_common,
  disparity,
  sigV,
  sigT,
  sigP,
  xP,
  opts
) {
  var varV = Math.pow(sigV, 2);
  var varT = Math.pow(sigT, 2);
  var varP = Math.pow(sigP, 2);
  var var_common = varV * varT + varV * varP + varT * varP; // ?
  var varVT_hat = 1/(1/varV + 1/varT + 1/varP);
  var varV_hat = 1/(1/varV + 1/varP);
  var varT_hat = 1/(1/varT + 1/varP);
  var varV_indep = varV + varP;
  var varT_indep = varT + varP;

  var plot_type = opts.plot_type;
  var strategy = opts.strategy;

  var trueV;
  var trueT;
  var xV;
  var xT;
  if ([CONST.PLOT_TYPES.ESTIMATES, CONST.PLOT_TYPES.FULL_MODEL]
      .indexOf(plot_type) !== -1) {
    trueV = 0 + disparity/2;
    trueT = 0 - disparity/2;
    xV = _.range(NUM).map(function () {
      return rand_norm() * sigV + trueV;
    });
    xT = _.range(NUM).map(function () {
      return rand_norm() * sigT + trueT;
    });
  } else if ([CONST.PLOT_TYPES.FACTORIAL].indexOf(plot_type) !== -1) {
    throw new Error("factorial unimplemented (need data file)");
  } else {
    throw new Error("unknown plot type: '" + plot_type + "'");
  }

  // xV and xT appear to be distributed around trueV and trueT
  // with defaults

  // console.log(xV.filter(function(x) { return x < trueV }).length);
  // console.log(xT.filter(function(x) { return x < trueT }).length);

  var quadV_indep = xV.map(function (xV_i) {return diff_sq(xV_i, xP);});
  var quadT_indep = xT.map(function (xT_i) {return diff_sq(xT_i, xP);});
  var quad_common = _.zip(xV, xT, quadV_indep, quadT_indep)
        .map(_.spread(
          function(xV_i, xT_i, quadV_indep_i, quadT_indep_i) {
            return diff_sq(xV_i, xT_i) * varP +
              quadV_indep_i * varT +
              quadT_indep_i * varV;
          }));
  var likelihood_common = quad_common.map(function (a) {
    // ??? why not norm_dist??
    // matlab source norm_non_dist is used here
    return (norm_dist(a, var_common))(0);
  });
  var likelihoodV_indep = quadV_indep.map(function (a) {
    return (norm_dist(a, varV_indep))(0);
  });
  var likelihoodT_indep = quadT_indep.map(function (a) {
    return (norm_dist(a, varT_indep))(0);
  });
  var likelihood_indep = _.zip(likelihoodV_indep, likelihoodT_indep)
        .map(_.spread(function (a, b) {return a * b;}));
  var post_common = likelihood_common
        .map(function (a) { return a * p_common; });
  var post_indep = likelihood_indep
        .map(function (a) { return a * (1 - p_common); });
  var pC = _.zip(post_common, post_indep)
        .map(_.spread(function (a, b) {return a/(a + b);}));

  // XXX pC does not always appear to be evenly distributed around 0

  // console.log(pC.filter(function(x) { return x < .265; }).length);
  // debugger;

  var s_hat_common;
  var sV_hat_indep;
  var sT_hat_indep;
  if ([CONST.PLOT_TYPES.ESTIMATES, CONST.PLOT_TYPES.FULL_MODEL]
      .indexOf(plot_type) !== -1) {
    (function () {
      var xP_div_varP = xP/varP; // for faster
      s_hat_common = _.zip(xV, xT).map(_.spread(function (a, b) {
        return (a/varV + b/varT + xP_div_varP) * varVT_hat;
      }));
      sV_hat_indep = xV.map(function (a) {
        return (a/varV + xP_div_varP) * varV_hat;
      });
      sT_hat_indep = xT.map(function (a) {
        return (a/varT + xP_div_varP) * varT_hat;
      });
    }());
  } else if ([CONST.PLOT_TYPES.FACTORIAL].indexOf(plot_type) !== -1) {
    throw new Error("factorial unimplemented (need data file)");
  } else {
    throw new Error("unknown plot type: '" + plot_type + "'");
  }

  var sV_hat_bi;
  var sT_hat_bi;
  (function () {
    var calc_bi;
    if (strategy === CONST.STRATEGIES.SELECTION) {
      // _i is for index.. distinguishes elements from arrays
      calc_bi = function (pC_i, s_hat_common_i, s_hat_indep_i) {
        return pC_i > 0.5 ? s_hat_common_i : s_hat_indep_i;
      };
    } else if (strategy === CONST.STRATEGIES.AVERAGING) {
      calc_bi = function (pC_i, s_hat_common_i, s_hat_indep_i) {
        return pC_i * s_hat_common_i +
          (1 - pC_i) * s_hat_indep_i;
      };
    } else if (strategy === CONST.STRATEGIES.MATCHING) {
      if ([CONST.PLOT_TYPES.ESTIMATES, CONST.PLOT_TYPES.FULL_MODEL]
          .indexOf(plot_type) === -1) {
        throw new Error("expected either estimate " +
                        "or full model plot type");
      }
      calc_bi = function (pC_i, s_hat_common_i, s_hat_indep_i) {
        var match = rand_norm(); // XXX modify for factorial plot
        return pC_i > match ? s_hat_common_i : s_hat_indep_i;
      };
    } else {
      throw new Error("unknown strategy '" + strategy + "'");
    }
    sV_hat_bi = _.zip(pC, s_hat_common, sV_hat_indep)
      .map(_.spread(calc_bi));
    sT_hat_bi = _.zip(pC, s_hat_common, sT_hat_indep)
      .map(_.spread(calc_bi));
  }());

  if(_.zip(sV_hat_bi, sT_hat_bi)
     .filter(_.spread(function (a, b) { return a === b;}))
     .length === sV_hat_bi.length) {
    console.log("sV_hat_bi, sT_hat_bi pairwise equal");
    console.log("this is either a bug or lack of understanding");
    debugger;
  }

  var freq_predV_bi;
  var freq_predT_bi;
  var bins_spc = linspace(lowerBnd, upperBnd, numBins);
  (function () {
    var binned_counts;
    // this will always be equal to the number of elems being binned,
    // but as this is currently a direct port of the .m file...
    var bins_sum;
    var h;
    h = hist(sV_hat_bi, bins_spc);
    bins_sum = h.reduce(function (a, b) {return a + b;}, 0);
    freq_predV_bi = h.map(function (a) {return a / bins_sum;});
    // debugger;
    h = hist(sT_hat_bi, bins_spc);
    bins_sum = h.reduce(function (a, b) {return a + b;}, 0);
    freq_predT_bi = h.map(function (a) {return a / bins_sum;});
  }());

  return {
    x: bins_spc,
    freq_predV_bi: freq_predV_bi,
    freq_predT_bi: freq_predT_bi,
    trueV: trueV,
    trueT: trueT
  };
};
