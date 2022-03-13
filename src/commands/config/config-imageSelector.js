/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
const inquirer = require('inquirer');
const configstore = require('../../config-store');
const { displayError, displayInfo, displaySuccess } = require('../../utils');

inquirer
  .prompt([
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
    configstore.set('imageSelector', value.imageSelector);

    console.log(displaySuccess('Configuration saved successfully'));
  })
  .catch((err) => {
    console.error(err);
    console.error(displayError('An error occurred, please try again later.'));
  });
