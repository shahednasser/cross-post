/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
const inquirer = require('inquirer');
const configstore = require('../../config-store');
const { displayError, displayInfo, displaySuccess } = require('../../utils');

inquirer
  .prompt([
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
    configstore.set('selector', value.selector);

    console.log(displaySuccess('Configuration saved successfully'));
  })
  .catch((err) => {
    console.error(err);
    console.error(displayError('An error occurred, please try again later.'));
  });
