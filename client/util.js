var deepFreeze = function (obj) {
  var propNames = Object.getOwnPropertyNames(obj);
  propNames.forEach(function(name) {
    var prop = obj[name];
    if (typeof prop == 'object' && prop !== null && !Object.isFrozen(prop))
      deepFreeze(prop);
  });
  return Object.freeze(obj);
};

module.exports.spread = function (arr, fn) {
  arr.map(function (sub_arr) {
    return fn.apply(null, sub_arr);
  });
};

module.exports.freeze = deepFreeze;
