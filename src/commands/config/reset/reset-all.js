const configstore = require('../../../config-store');
const { displaySuccess } = require('../../../utils');

configstore.reset('imageSelector');
configstore.reset('titleSelector');
configstore.reset('selector');
console.log(displaySuccess('all non-platform configurations have been reset successfully'));
