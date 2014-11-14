
var injections = {};
exports.set = function(key, value) {
  console.log('setting ', key);
  injections[key] = value;
};
exports.get = function(key) {
  return injections[key];
};