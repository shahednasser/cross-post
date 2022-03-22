const configstore = require('../../../config-store');
const { displaySuccess } = require('../../../utils');

configstore.reset('hashnode');
console.log(displaySuccess('hashnode.com configuration has been reset successfully'));
