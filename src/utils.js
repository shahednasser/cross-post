const chalk = require('chalk')
const allowedPlatforms = ['dev', 'hashnode', 'medium']

module.exports = {
    allowedPlatforms,
    displayError: chalk.bold.red,
    displaySuccess: chalk.bold.green,
    displayInfo: chalk.bold.blue,
    isPlatformAllowed: function (platform, config = false) {
        if (config) {
            return allowedPlatforms.includes(platform) || module.exports.imagePlatform === platform || 
                platform === 'imageSelector' || platform === 'selector'
        }
        return allowedPlatforms.includes(platform)
    },
    platformNotAllowedMessage: 'Platforms specified are not all allowed. Allowed platform values are: ' + allowedPlatforms.join(", "),
    isDataURL: function (s) {
        const regex = /^data:((?:\w+\/(?:(?!;).)+)?)((?:;[\w\W]*?[^;])*),(.+)$/i;
        return !!s.match(regex);
    },
    imagePlatform: 'cloudinary'
}