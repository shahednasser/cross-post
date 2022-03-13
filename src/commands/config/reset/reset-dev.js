const configstore = require('../../../config-store');
const { displaySuccess } = require('../../../utils');

configstore.reset('dev');
console.log(displaySuccess('dev.to configuration has been reset successfully'));
