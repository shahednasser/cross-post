/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
const inquirer = require('inquirer');
const { default: axios } = require('axios');
const { displayError, displayInfo, displaySuccess } = require('../../utils');
const configstore = require('../../config-store');

inquirer
  .prompt([
    {
      name: 'apiKey',
      message: displayInfo('Enter hashnode.com API key'),
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
      axios
        .post(
          'https://api.hashnode.com',
          {
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
          },
          {
            headers: {
              Authorization: value.apiKey,
            },
          },
        )
        .then((res) => {
          if (res.data.errors) {
            console.error(
              displayError(
                `An error occured while fetching publication Id: ${res.data.errors[0].message}`,
              ),
            );
          } else {
            value.publicationId = res.data.data.user.publication._id;
            delete value.username;
            configstore.set('hashnode', value);
            console.log(displaySuccess('Configuration saved successfully'));
          }
        })
        .catch((err) => {
          console.error(
            displayError(
              `An error occured while fetching publication Id: ${err.response.data.errors[0].message}`,
            ),
          );
        });
    } else {
      console.error(displayError('Username is required'));
    }
  })
  .catch(() => {
    console.error(displayError('An error occurred, please try again later.'));
  });
