const axios = require('axios');
const Conf = require('conf');

const configstore = new Conf();

/**
 * Post article to Medium
 *
 * @param {string} title Title of article
 * @param {string} content Content of article in markdown
 * @param {string} canonicalUrl URL of original article
 * @param {boolean} p Whether to publish article publicly or not
 * @param {null|Function} cb callback function to run after posting is finished
 */
function postToMedium(title, content, canonicalUrl, p, cb = null) {
  const mediumConfig = configstore.get('medium');
  return axios.post(`https://api.medium.com/v1/users/${mediumConfig.authorId}/posts`, {
    title,
    contentFormat: 'markdown',
    content,
    canonicalUrl,
    publishStatus: p ? 'public' : 'draft',
  }, {
    headers: {
      Authorization: `Bearer ${mediumConfig.integrationToken}`,
    },
  })
    .then((res) => {
      if (cb) {
        cb({
          success: true,
          url: res.data.data.url,
          platform: 'Medium',
          public: p,
        });
      }
    })
    .catch((res) => {
      if (cb) {
        cb({
          success: false,
        });
      }

      if (res.data) {
        throw new Error(`Error occured while cross posting to Medium: ${res.data}`);
      } else {
        throw new Error('An error occurred, please try again later.');
      }
    });
}

module.exports = postToMedium;
