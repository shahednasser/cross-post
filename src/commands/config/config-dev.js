// /* eslint-disable no-param-reassign */
// /* eslint-disable no-underscore-dangle */
const inquirer = require('inquirer');
const configstore = require('../../config-store');
const { displayInfo, displayError, displaySuccess } = require('../../utils');

inquirer
  .prompt([
    {
      name: 'apiKey',
      message: displayInfo('Enter dev.to API key'),
    },
  ])
  .then((value) => {
    if (!value.hasOwnProperty('apiKey')) {
      console.error(displayError('API key is required'));
    }

    // store api key
    configstore.set('dev', value);

    console.log(displaySuccess('Configuration saved successfully'));
  })
  .catch((err) => {
    console.error(err);
    console.error(displayError('An error occurred, please try again later.'));
  });
