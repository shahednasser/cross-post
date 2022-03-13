const configstore = require('../../../config-store');
const { displaySuccess } = require('../../../utils');

configstore.reset('cloudinary');
console.log(displaySuccess('cloudinary configuration has been reset successfully'));
