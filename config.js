const inquirer = require('inquirer')
const Conf = require('conf')
const { isPlatformAllowed, displayError, platformNotAllowedMessage, displayInfo, displaySuccess } = require('./utils')

function config (platform) {
    //check if platform is allowed
    if (!isPlatformAllowed) {
        console.error(
            displayError(platformNotAllowedMessage)
        )
        return
    }

    const configstore = new Conf()

    switch (platform) {
        case 'dev':
            inquirer.prompt([
                {
                    name: 'apiKey',
                    message: displayInfo('Enter dev.to API key')
                }
            ])
            .then ((value) => {
                if (!value.hasOwnProperty('apiKey')) {
                    console.error(displayError('API key is required'))
                }

                //store api key
                configstore.set(platform, value.apiKey)

                console.log(displaySuccess('API key added successfully'))
            })
            .catch ((err) => {
                console.error(err)
                console.error(displayError('An error occurred, please try again later.'))
            })
            break;
    }
}

module.exports = config