const axios = require('axios');
const Conf = require('conf');

const configstore = new Conf();

/**
 * Post article to Hashnode
 *
 * @param {string} title Title of article
 * @param {string} contentMarkdown Content of article in Markdown
 * @param {string} originalArticleURL URL of original article
 * @param {string} coverImageURL URL of cover image
 * @param {boolean} hideFromHashnodeFeed Whether to post it publically or not
 * @param {null|Function} cb callback function to run after posting is finished
 */
function postToHashnode(
  title,
  contentMarkdown,
  originalArticleURL,
  coverImageURL,
  hideFromHashnodeFeed,
  cb = null,
) {
  const configData = configstore.get('hashnode');
  const data = {
    input: {
      title,
      contentMarkdown,
      isPartOfPublication: { publicationId: configData.publicationId },
      tags: [],
    },
    publicationId: configData.publicationId,
    hideFromHashnodeFeed,
  };
  if (originalArticleURL) {
    data.isRepublished = {
      originalArticleURL,
    };
  }
  if (coverImageURL) {
    data.input.coverImageURL = coverImageURL;
  }
  return axios.post('https://api.hashnode.com', {
    query: 'mutation createPublicationStory($input: CreateStoryInput!, $publicationId: String!){ createPublicationStory(input: $input, publicationId: $publicationId){ post { slug, publication { domain } } } }',
    variables: data,
  }, {
    headers: {
      Authorization: configData.apiKey,
    },
  })
    .then((res) => {
      if (res.data.errors) {
        throw new Error(`Error occured while cross posting to Hashnode: ${res.data.errors[0].message}`);
      } else {
        const { post } = res.data.data.createPublicationStory;
        const postUrl = `${post.publication.domain ? post.publication.domain : ''}/${post.slug}`;

        if (cb) {
          cb({
            success: true,
            url: postUrl,
            platform: 'Hashnode',
            public: !hideFromHashnodeFeed,
          });
        }
      }
    })
    .catch((err) => {
      if (cb) {
        cb({ success: false });
      }

      if (err.response) {
        throw new Error(`Error occured while cross posting to Hashnode: ${err.response.data.errors[0].message}`);
      } else {
        throw new Error(err);
      }
    });
}

module.exports = postToHashnode;
