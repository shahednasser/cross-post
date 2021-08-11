const axios = require('axios')
const Conf = require('conf')

const configstore = new Conf()

/**
 * Post article to dev.to 
 * 
 * @param {string} title Title of article
 * @param {string} body_markdown Content of the article in markdown
 * @param {string} canonical_url URL of original article
 * @param {string} main_image Cover image URL
 * @param {boolean} published whether to publish as draft or public
 * @param {null|Function} cb callback function to run after posting is finished
 */
function postToDev (title, body_markdown, canonical_url, main_image, published, cb = null) {
    const article = {
        title,
        published,
        body_markdown,
        canonical_url
    }
    if (main_image) {
        article.main_image = main_image
    }
    //send article to DEV.to
    return axios.post('https://dev.to/api/articles', 
    {
        article
    },
    {
    headers: {
        'api-key': configstore.get('dev').apiKey
    }
    }).then ((devReponse) => {
        if (cb) {
            cb({success: true, url: devReponse.data.url + (published ? '' : '/edit'), platform: 'DEV', public: published})
        }
    }).catch((err) => {
        if (cb) {
            cb({success: false});
        }
        throw new Error(err.response ? 'Error occured while cross posting to DEV: ' + err.response.data.error : 
            'An error occurred, please try again later')
    })
}

module.exports = postToDev