/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
const inquirer = require('inquirer');
const { default: axios } = require('axios');
const { displayError, displayInfo, displaySuccess } = require('../../utils');
const configstore = require('../../config-store');

inquirer
  .prompt([
    {
      name: 'integrationToken',
      message: displayInfo('Enter medium.com Integration Token'),
    },
  ])
  .then((value) => {
    if (!value.hasOwnProperty('integrationToken')) {
      console.error(displayError('Integration token is required'));
    }

    // get user informations to get authorId
    axios
      .get('https://api.medium.com/v1/me', {
        headers: {
          Authorization: `Bearer ${value.integrationToken}`,
        },
      })
      .then((res) => {
        if (res.data.data.id) {
          value.authorId = res.data.data.id;
        }

        configstore.set('medium', value);
        console.log(displaySuccess('Configuration saved successfully'));
      })
      .catch(() => {
        console.error(
          displayError('An error occurred, please try again later.'),
        );
      });
  })
  .catch((err) => {
    console.error(err);
    console.error(displayError('An error occurred, please try again later.'));
  });
