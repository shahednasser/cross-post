const fs = require('fs');
const path = require('path');
const Conf = require('conf');
const got = require('got');
const { JSDOM } = require('jsdom');
const htmlparser2 = require('htmlparser2');
const { URLSearchParams } = require('url');
const { marked } = require('marked');

const TurndownService = require('turndown');
const CLI = require('clui');

const turndownService = new TurndownService({
  codeBlockStyle: 'fenced',
});
const { Spinner } = CLI;
const {
  allowedPlatforms,
  displayError,
  displaySuccess,
  isPlatformAllowed,
  platformNotAllowedMessage,
  isDataURL, getRemoteArticleDOM, findMainContentElements, formatMarkdownImages,
} = require('../utils');
const postToDev = require('./platforms/dev');
const postToHashnode = require('./platforms/hashnode');
const postToMedium = require('./platforms/medium');
const uploadToCloudinary = require('./platforms/cloudinary');

const configstore = new Conf();
const loading = new Spinner('Processing URL...');

let platformsPosted = 0; // incremental count of platforms the article is posted on
let chosenPlatforms = allowedPlatforms; // the platforms chosen, defaults to all platforms

/**
 *
 * @param {string} type Type to search for. Can be either title or
 * @param {HTMLElement} node element to search in
 * @returns
 */
function search(type, node) {
  if ((type === 'title' && (node.tagName === 'H1' || node.tagName === 'H2' || node.tagName === 'H3'
              || node.tagName === 'H4' || node.tagName === 'H5' || node.tagName === 'H6'))
          || (type === 'image' && node.tagName === 'IMG')) {
    return type === 'title' ? node.textContent : node.getAttribute('src');
  }

  if (node.childNodes && node.childNodes.length) {
    const { childNodes } = node;
    for (let i = 0; i < childNodes.length; i += 1) {
      const title = search(type, childNodes.item(i));
      if (title) {
        return title;
      }
    }
  }

  return null;
}

/**
 *
 * @param {*} url the string that has provided by the user
 * @returns
 */
async function getImageForHashnode(url) {
  const response = await got(url);
  let count = 0;
  let imageUrl;
  const parser = new htmlparser2.Parser({
    onopentag(name, attribs) {
      if (name === 'img' && attribs.src && attribs.src.includes('/_next/image')) {
        count += 1;
        if (count === 2) {
          imageUrl = attribs.src;
        }
      }
    },
  });
  parser.write(response.body);
  parser.end();
  return imageUrl;
}

/**
 *
 * @param {string} err Error message to display
 */
function handleError(err) {
  loading.stop();
  console.error(displayError(err));
}

/**
 * If the number of platforms posted on is complete stop the loading
 * @param {boolean} success whether it was successful or not
 */
function checkIfShouldStopLoading(success) {
  if (platformsPosted === chosenPlatforms.length) {
    loading.stop();
    if (success) {
      process.exit();
    }
  }
}

/**
   * Function to run after posting on a platform is done
   */
function afterPost({
  success, url = '', platform = '', p = false,
}) {
  if (success) {
    console.log(
      displaySuccess(`Article ${p ? 'published' : 'added to drafts'} on ${platform} at ${url}`),
    );
  }
  platformsPosted += 1;
  checkIfShouldStopLoading(success);
}

function postToPlatforms(title, markdown, url, image, p) {
  chosenPlatforms.forEach((platform) => {
    switch (platform) {
      case 'dev':
        loading.message('Posting article to dev.to...');
        postToDev(title, markdown, url, image, p, afterPost)
          .catch(handleError);
        break;
      case 'hashnode':
        loading.message('Posting article to Hashnode...');
        postToHashnode(title, markdown, url, image, p, afterPost)
          .catch(handleError);
        break;
      case 'medium':
        loading.message('Posting article to Medium...');
        postToMedium(title, markdown, url, p, afterPost)
          .catch(handleError);
        break;
      default:
        break;
    }
  });
}

/**
 *
 * @param {string} url URL of the blog post
 * @param {object} options The parameters from the command line
 */
async function run(url, options) {
  let {
    title, selector, imageSelector, titleSelector,
  } = options;

  const {
    platforms,
    ignoreImage,
    imageUrl,
    local,
    public: p = false,
  } = options;

  // check if all platforms chosen are correct
  if (platforms) {
    const error = platforms.some((platform) => !isPlatformAllowed(platform));
    if (error) {
      // if some of the platforms are not correct, return
      console.error(
        displayError(platformNotAllowedMessage),
      );
      return;
    }
    // set chosen platforms to platforms chosen
    chosenPlatforms = platforms;
  }

  // check if configurations exist for the platforms
  const errorPlatform = chosenPlatforms.find((platform) => !configstore.get(platform));

  if (errorPlatform) {
    console.error(
      displayError(`Please set the configurations required for ${errorPlatform}`),
    );
    return;
  }

  if (!selector) {
    // check if a default selector is set in the configurations
    selector = configstore.get('selector');
    if (!selector) {
      selector = 'article'; // default value if no selector is supplied
    }
  }

  // start loading
  loading.start();
  let articleContent;
  let markdown = '';
  try {
    if (local) {
      // publish from a local file
      const filePath = path.resolve(process.cwd(), url);
      if (path.extname(filePath).toLowerCase().indexOf('md') === -1) {
        handleError('File extension not allowed. Only markdown files are accepted');
        return;
      }
      markdown = fs.readFileSync(filePath, 'utf-8');
      articleContent = marked.parse(markdown);
    } else {
      // publish from the web
      articleContent = (await got(url, {
        https: {
          rejectUnauthorized: false,
        },
      })).body;
    }
  } catch (e) {
    handleError(e);
    return;
  }

  const dom = new JSDOM(articleContent, {
    resources: 'usable',
    includeNodeLocations: true,
  });
  const articleNode = local ? dom.window.document.querySelector('body') : dom.window.document.querySelector(selector);
  if (articleNode) {
    // if article element found, get its HTML content
    const html = articleNode.innerHTML;
    if (!markdown.length && html) {
      markdown = turndownService.remove('style').turndown(html);
    }
    // check if title is set in the command line arguments
    if (!title) {
      if (!titleSelector) {
        titleSelector = configstore.get('titleSelector');
      }

      if (titleSelector) {
        title = dom.window.document.querySelector(titleSelector).textContent;
      }

      if (!title) {
        // get title of article
        title = search('title', articleNode);
        if (!title) {
          title = '';
        }
      }
    }
    let image = null;
    if (!ignoreImage) {
      if (imageUrl) {
        // use image url that is provided
        image = imageUrl;
      } else {
        // Get cover image of the article
        if (imageSelector) {
          // get image using selector specified
          image = dom.window.document.querySelector(imageSelector);
          if (image) {
            image = image.getAttribute('src');
          }
        } else {
          // check if there's a default image selector in config
          imageSelector = configstore.get('imageSelector');
          if (imageSelector) {
            image = dom.window.document.querySelector(imageSelector);
            if (image) {
              image = image.getAttribute('src');
            }
          } else if (url.includes('hashnode')) {
            await getImageForHashnode(url).then((img) => {
              const params = new URLSearchParams(img.split('?')[1]);
              image = params.get('url');
            });
          } else {
            image = search('image', articleNode);
          }
        }
        // check if image is data-url
        if (image && isDataURL(image)) {
          const res = await uploadToCloudinary(image);
          image = res.url;
        } else if (image.indexOf('/') === 0 && !local) {
          // get domain name of url and prepend it to the image URL
          const urlObject = new URL(url);
          image = `${urlObject.protocol}//${urlObject.hostname}${image}`;
        }
      }
    }
    // create links for images in files
    const articleDOM = local && await getRemoteArticleDOM(local);
    const mainElement = local && findMainContentElements(articleDOM.window.document.body);
    markdown = local ? formatMarkdownImages(markdown, mainElement, local) : markdown;

    postToPlatforms(title, markdown, local || url, image, p);
  } else {
    handleError('No articles found in the URL.');
  }
}

module.exports = run;
