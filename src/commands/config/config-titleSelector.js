/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
const inquirer = require('inquirer');
const configstore = require('../../config-store');
const { displayInfo, displayError, displaySuccess } = require('../../utils');

inquirer
  .prompt([
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
    configstore.set('titleSelector', value.titleSelector);

    console.log(displaySuccess('Configuration saved successfully'));
  })
  .catch((err) => {
    console.error(err);
    console.error(displayError('An error occurred, please try again later.'));
  });
