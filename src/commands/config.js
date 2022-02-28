/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
const inquirer = require('inquirer');
const Conf = require('conf');
const { default: axios } = require('axios');
const {
  displayError,
  displayInfo, displaySuccess, imagePlatform,
} = require('../utils');

/**
 *
 * @param {string} name Name of configuration
 */
function config(name) {
  const configstore = new Conf();

  switch (name) {
    case 'dev':
      inquirer.prompt([
        {
          name: 'apiKey',
          message: displayInfo(`Enter ${name} API key`),
        },
      ])
        .then((value) => {
          if (!value.hasOwnProperty('apiKey')) {
            console.error(displayError('API key is required'));
          }

          // store api key
          configstore.set(name, value);

          console.log(displaySuccess('Configuration saved successfully'));
        })
        .catch((err) => {
          console.error(err);
          console.error(displayError('An error occurred, please try again later.'));
        });
      break;
    case 'hashnode':
      inquirer.prompt([
        {
          name: 'apiKey',
          message: displayInfo(`Enter ${name} API key`),
        },
        {
          name: 'username',
          message: displayInfo('Enter username to get publication ID'),
        },
      ])
        .then((value) => {
          if (!value.hasOwnProperty('apiKey')) {
            console.error(displayError('API key is required'));
          }

          if (value.username) {
            // get the publication id of the user to use it for creating publications
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
                username: value.username,
              },
            }, {
              headers: {
                Authorization: value.apiKey,
              },
            })
              .then((res) => {
                if (res.data.errors) {
                  console.error(
                    displayError(`An error occured while fetching publication Id: ${res.data.errors[0].message}`),
                  );
                } else {
                  value.publicationId = res.data.data.user.publication._id;
                  delete value.username;
                  configstore.set(name, value);
                  console.log(displaySuccess('Configuration saved successfully'));
                }
              })
              .catch((err) => {
                console.error(
                  displayError(`An error occured while fetching publication Id: ${err.response.data.errors[0].message}`),
                );
              });
          } else {
            console.error(displayError('Username is required'));
          }
        })
        .catch(() => {
          console.error(displayError('An error occurred, please try again later.'));
        });
      break;
    case 'medium':
      inquirer.prompt([
        {
          name: 'integrationToken',
          message: displayInfo(`Enter ${name} Integration Token`),
        },
      ])
        .then((value) => {
          if (!value.hasOwnProperty('integrationToken')) {
            console.error(displayError('Integration token is required'));
          }

          // get user informations to get authorId
          axios.get('https://api.medium.com/v1/me', {
            headers: {
              Authorization: `Bearer ${value.integrationToken}`,
            },
          }).then((res) => {
            if (res.data.data.id) {
              value.authorId = res.data.data.id;
            }

            configstore.set(name, value);
            console.log(displaySuccess('Configuration saved successfully'));
          }).catch(() => {
            console.error(displayError('An error occurred, please try again later.'));
          });
        })
        .catch((err) => {
          console.error(err);
          console.error(displayError('An error occurred, please try again later.'));
        });
      break;
    case imagePlatform:
      inquirer.prompt([
        {
          name: 'cloud_name',
          message: displayInfo('Enter cloud name'),
        },
        {
          name: 'api_key',
          message: displayInfo('Enter API key'),
        },
        {
          name: 'api_secret',
          message: displayInfo('Enter API secret'),
        },
      ])
        .then((value) => {
          if (!value.hasOwnProperty('cloud_name')) {
            console.error(displayError('Cloud name is required'));
          }

          if (!value.hasOwnProperty('api_key')) {
            console.error(displayError('API key is required'));
          }

          if (!value.hasOwnProperty('api_secret')) {
            console.error(displayError('API secret is required'));
          }

          // store keys
          configstore.set(name, value);

          console.log(displaySuccess('Configuration saved successfully'));
        })
        .catch((err) => {
          console.error(err);
          console.error(displayError('An error occurred, please try again later.'));
        });
      break;
    case 'imageSelector':
      inquirer.prompt([
        {
          name: 'imageSelector',
          message: displayInfo('Enter default image selector'),
        },
      ])
        .then((value) => {
          if (!value.hasOwnProperty('imageSelector')) {
            console.error(displayError('Image selector is required'));
          }

          // store api key
          configstore.set(name, value.imageSelector);

          console.log(displaySuccess('Configuration saved successfully'));
        })
        .catch((err) => {
          console.error(err);
          console.error(displayError('An error occurred, please try again later.'));
        });
      break;
    case 'titleSelector':
      inquirer.prompt([
        {
          name: 'titleSelector',
          message: displayInfo('Enter default title selector'),
        },
      ])
        .then((value) => {
          if (!value.hasOwnProperty('titleSelector')) {
            console.error(displayError('Title selector is required'));
          }

          // store api key
          configstore.set(name, value.titleSelector);

          console.log(displaySuccess('Configuration saved successfully'));
        })
        .catch((err) => {
          console.error(err);
          console.error(displayError('An error occurred, please try again later.'));
        });
      break;
    case 'selector':
      inquirer.prompt([
        {
          name: 'selector',
          message: displayInfo('Enter default selector'),
        },
      ])
        .then((value) => {
          if (!value.hasOwnProperty('selector')) {
            console.error(displayError('Selector is required'));
          }

          // store api key
          configstore.set(name, value.selector);

          console.log(displaySuccess('Configuration saved successfully'));
        })
        .catch((err) => {
          console.error(err);
          console.error(displayError('An error occurred, please try again later.'));
        });
      break;
    default:
      console.error(displayError('Config does not exist'));
  }
}

module.exports = config;
