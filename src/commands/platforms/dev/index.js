const axios = require('axios');
const Conf = require('conf');

const configstore = new Conf();

/**
 * Post article to dev.to
 *
 * @param {string} title Title of article
 * @param {string} bodyMarkdown Content of the article in markdown
 * @param {string} canonicalUrl URL of original article
 * @param {string} mainImage Cover image URL
 * @param {boolean} published whether to publish as draft or public
 * @param {null|Function} cb callback function to run after posting is finished
 */
function postToDev(title, bodyMarkdown, canonicalUrl, mainImage, published, cb = null) {
  const article = {
    title,
    published,
    body_markdown: bodyMarkdown,
    canonical_url: canonicalUrl,
  };
  if (mainImage) {
    article.main_image = mainImage;
  }
  // send article to DEV.to
  return axios.post(
    'https://dev.to/api/articles',
    {
      article,
    },
    {
      headers: {
        'api-key': configstore.get('dev').apiKey,
      },
    },
  ).then((devReponse) => {
    if (cb) {
      cb({
        success: true, url: devReponse.data.url + (published ? '' : '/edit'), platform: 'DEV', public: published,
      });
    }
  }).catch((err) => {
    if (cb) {
      cb({ success: false });
    }
    throw new Error(err.response ? `Error occured while cross posting to DEV: ${err.response.data.error}`
      : 'An error occurred, please try again later');
  });
}

module.exports = postToDev;
