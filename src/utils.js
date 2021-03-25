const chalk = require('chalk')
const allowedPlatforms = ['dev', 'hashnode']

module.exports = {
    allowedPlatforms,
    displayError: chalk.bold.red,
    displaySuccess: chalk.bold.green,
    displayInfo: chalk.bold.blue,
    isPlatformAllowed: function (platform) {
        return allowedPlatforms.includes(platform)
    },
    platformNotAllowedMessage: 'Platforms specified are not all allowed. Allowed platform values are: ' + allowedPlatforms.join(", ")
}