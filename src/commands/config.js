const inquirer = require('inquirer')
const Conf = require('conf')
const { isPlatformAllowed, displayError, platformNotAllowedMessage, displayInfo, displaySuccess } = require('../utils')
const { default: axios } = require('axios')

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
                    message: displayInfo(`Enter ${platform} API key`)
                }
            ])
            .then ((value) => {
                if (!value.hasOwnProperty('apiKey')) {
                    console.error(displayError('API key is required'))
                }

                //store api key
                configstore.set(platform, value)

                console.log(displaySuccess('Configuration saved successfully'))
            })
            .catch ((err) => {
                console.error(err)
                console.error(displayError('An error occurred, please try again later.'))
            })
            break;
        case 'hashnode':
            inquirer.prompt([
                {
                    name: 'apiKey',
                    message: displayInfo(`Enter ${platform} API key`)
                },
                {
                    name: 'username',
                    message: displayInfo(`Enter username to get publication ID`)
                },
            ])
            .then ((value) => {
                if (!value.hasOwnProperty('apiKey')) {
                    console.error(displayError('API key is required'))
                }

                if (value.username) {
                    axios.post('https://api.hashnode.com', {
                        query: `
                            query user($username: String!) {
                                user(username: $username) {
                                    publication {
                                        _id
                                    }
                                }
                            }
                        `,
                        variables: {
                            username: value.username
                        }
                    }, {
                        headers: {
                            'Authorization': value.apiKey
                        }
                    })
                    .then ((res) => {
                        if (res.data.errors) {
                            console.error(
                                displayError('An error occured while fetching publication Id: ' + err.response.data.errors[0].message)
                                )
                        } else {
                            value.publicationId = res.data.data.user.publication._id
                            delete value.username
                            configstore.set(platform, value)
                            console.log(displaySuccess('Configuration saved successfully'))
                        }
                    })
                    .catch((err) => {
                        console.error(
                            displayError('An error occured while fetching publication Id: ' + err.response.data.errors[0].message)
                        )
                    })
                } else {
                    configstore.set(platform, value)
                    console.log(displaySuccess('Configuration saved successfully'))
                }
            })
            .catch ((err) => {
                console.error(displayError('An error occurred, please try again later.'))
            })
            break;
        case 'medium':
            inquirer.prompt([
                {
                    name: 'integrationToken',
                    message: displayInfo(`Enter ${platform} Integration Token`)
                }
            ])
            .then ((value) => {
                if (!value.hasOwnProperty('integrationToken')) {
                    console.error(displayError('Integration token is required'))
                }

                //get user information
                axios.get('https://api.medium.com/v1/me', {
                    headers: {
                        'Authorization': 'Bearer ' + value.integrationToken
                    }
                }).then((res) => {
                    if (res.data.data.id) {
                        value.authorId = res.data.data.id
                    }

                    configstore.set(platform, value)
                    console.log(displaySuccess('Configuration saved successfully'))
                }).catch((err) => {
                    console.error(displayError('An error occurred, please try again later.'))
                })

                //store integration token
                //configstore.set(platform, value)

            })
            .catch ((err) => {
                console.error(err)
                console.error(displayError('An error occurred, please try again later.'))
            })
            break;
    }
}

module.exports = config