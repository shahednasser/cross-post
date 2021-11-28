const chalk = require('chalk')
const Conf = require('conf')

const allowedPlatforms = ['dev', 'hashnode', 'medium']

const imagePlatform = 'cloudinary'
const configstore = new Conf()
const platformNotAllowedMessage =
    'Platforms specified are not all allowed. Allowed platform values are: ' +
    allowedPlatforms.join(', ')

function isPlatformAllowed(platform, config = false) {
    if (config) {
        return (
            allowedPlatforms.includes(platform) ||
            imagePlatform === platform ||
            platform === 'imageSelector' ||
            platform === 'selector'
        )
    }
    return allowedPlatforms.includes(platform)
}

function validatePlatforms(platforms) {
    let chosenPlatforms = allowedPlatforms //the platforms chosen, defaults to all platforms
    //let
    //check if all platforms chosen are correct
    if (platforms) {
        const error = platforms.some((platform) => {
            return !isPlatformAllowed(platform)
        })
        if (error) {
            //if some of the platforms are not correct, return
            console.error(displayError(platformNotAllowedMessage))
            return
        }
        //set chosen platforms to platforms chosen
        chosenPlatforms = platforms
    }

    //check if configurations exist for the platforms
    const errorPlatform = chosenPlatforms.find((platform) => {
        if (!configstore.get(platform)) {
            return true
        }
        return false
    })

    if (errorPlatform) {
        console.error(
            displayError(
                `Please set the configurations required for ${errorPlatform}`
            )
        )
        return false
    }
    return chosenPlatforms
}

module.exports = validatePlatforms
module.exports = {
    displayError: chalk.bold.red,
    displaySuccess: chalk.bold.green,
    displayInfo: chalk.bold.blue,
    allowedPlatforms: allowedPlatforms,
    validatePlatforms: validatePlatforms,
    isDataURL: function (s) {
        const regex = /^data:((?:\w+\/(?:(?!;).)+)?)((?:;[\w\W]*?[^;])*),(.+)$/i
        return !!s.match(regex)
    },
}
