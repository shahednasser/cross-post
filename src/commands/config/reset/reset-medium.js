const configstore = require('../../../config-store');
const { displaySuccess } = require('../../../utils');

configstore.reset('medium');
console.log(displaySuccess('medium.com configuration has been reset successfully'));
