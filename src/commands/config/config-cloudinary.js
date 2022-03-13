/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
const inquirer = require('inquirer');
const { displayError, displayInfo, displaySuccess } = require('../../utils');
const configstore = require('../../config-store');

inquirer
  .prompt([
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
    configstore.set('cloudinary', value);

    console.log(displaySuccess('Configuration saved successfully'));
  })
  .catch((err) => {
    console.error(err);
    console.error(displayError('An error occurred, please try again later.'));
  });
