const chalk = require('chalk');
const { get } = require('axios');
const { JSDOM } = require('jsdom');

const allowedPlatforms = ['dev', 'hashnode', 'medium'];

/**
 * Replaces the 'http' scheme with 'https' in a given URL.
 *
 * @function
 * @name enforceHTTPS
 * @param {string} url - The URL to be converted to HTTPS.
 * @returns {string|null} - The URL with 'https' scheme, or null if the input is null.
 *
 * @example
 * const url = "http://example.com";
 * const httpsUrl = enforceHTTPS(url);  // Output will be "https://example.com"
 */
const enforceHTTPS = (url) => url?.replace(/^(http:\/\/)/, 'https://');

/**
 * Fetches the HTML content from a remote URL and returns it as a JSDOM object.
 *
 * @async
 * @function
 * @name getRemoteArticleDOM
 * @param {string} url - The URL of the remote article to fetch.
 * @returns {Promise<JSDOM>} - A promise that resolves to a JSDOM object containing
 * the HTML content of the remote article.
 */
const getRemoteArticleDOM = async (url) => {
  const { data } = await get(enforceHTTPS(url));
  return new JSDOM(data);
};

/**
 * Finds the nearest common ancestor of an array of HTML elements.
 *
 * @function
 * @name findNearestCommonAncestor
 * @param {HTMLElement[]} elements - An array of HTML elements for which to find
 * the nearest common ancestor.
 * @returns {HTMLElement|null} - The nearest common ancestor element, or null
 * if the input array is empty or null.
 *
 * @example
 * const elem1 = document.getElementById('elem1');
 * const elem2 = document.getElementById('elem2');
 * const commonAncestor = findNearestCommonAncestor([elem1, elem2]);
 *
 * // commonAncestor will contain the nearest common ancestor HTMLElement or null.
 */
const findNearestCommonAncestor = (elements) => {
  if (elements?.length === 0) {
    return null;
  }
  const findAncestors = (element, ancestorsSet) => {
    if (element) {
      ancestorsSet.add(element);
      findAncestors(element.parentElement, ancestorsSet);
    }
  };
  const ancestorsList = elements.map((element) => {
    const ancestors = new Set();
    findAncestors(element, ancestors);
    return ancestors;
  });

  const commonAncestors = ancestorsList.reduce((acc, currSet) => acc
    .filter((ancestor) => currSet.has(ancestor)), [...ancestorsList[0]]);

  return commonAncestors[0] || null;
};

/**
 * Ranks HTML elements based on how many text density it has
 * and returns the top 20 elements that contain a `<p>` tag.
 *
 * @function
 * @name rankingTag
 * @param {HTMLElement} document - The HTML jsdom element representing the root of the document.
 * @returns {HTMLElement[]} - An array of the top 20 HTMLElements that contain a `<p>` tag.
 *
 */
const rankingTag = (document) => {
  const elements = document.querySelectorAll('p, blockquote, h1, h2, h3, h4, h5, h6');
  const scoreTag = {
    p: 0.8,
    blockquote: 0.9,
    h1: 0.6,
    h2: 0.6,
    h3: 0.6,
    h4: 0.6,
    h5: 0.6,
    h6: 0.6,
  };

  const { elementScores, elementHasPTag } = Array.from(elements).reduce(
    (acc, element) => {
      const textLength = element.textContent.length;
      const tagName = element.tagName.toLowerCase();

      if (tagName.includes('-')) {
        return acc;
      }

      const scoreMultiplier = scoreTag[tagName];
      const score = textLength * scoreMultiplier;
      const { parentElement } = element;

      if (parentElement && !parentElement.tagName.toLowerCase().includes('-')) {
        if (acc.elementScores.has(parentElement)) {
          acc.elementScores.set(parentElement, acc.elementScores.get(parentElement) + score);
        } else {
          acc.elementScores.set(parentElement, score);
        }

        if (tagName === 'p') {
          acc.elementHasPTag.set(parentElement, true);
        }
      }

      return acc;
    },
    { elementScores: new Map(), elementHasPTag: new Map() },
  );

  return Array.from(elementScores.entries())
    .filter(([parentElement]) => elementHasPTag.has(parentElement))
    .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
    .slice(0, 20)
    .map(([element]) => element);
};
const findMainContentElements = (document) => findNearestCommonAncestor(rankingTag(document));

/**
 * Formats Markdown images within the provided Markdown string.
 *
 * @function
 * @name formatMarkdownImages
 * @param {string} markdown - The Markdown text that needs to be formatted.
 * @param {HTMLElement} element - The HTMLElement (from jsdom) where images will be extracted.
 * @param {string} url - The URL to be used for setting the images absolute path
 * @returns {string} - The formatted Markdown string.
 *
 * @example
 * const markdown = "![Alt text](/path/to/image.jpg)";
 * const element = new jsdom.window.HTMLElement('body');
 * const url = "https://example.com";
 * const result = '![Alt text](https://example.com/imagefromElement.png)'
 */
const formatMarkdownImages = (markdown, element, url) => {
  const formattedUrl = new URL(url);
  formattedUrl.pathname = '';
  formattedUrl.search = '';
  formattedUrl.hash = '';

  const baseUrl = formattedUrl.toString();

  const prefixUrl = (URL) => enforceHTTPS(!URL.startsWith('http://') && !URL.startsWith('https://') ? baseUrl + URL : URL);

  const imagesSrc = Array.from(element.querySelectorAll('img, picture')).map((HTMLImage) => {
    const { src, tagName } = HTMLImage || {};

    if (tagName.toLowerCase() === 'img') return src ? prefixUrl(src) : null;
    if (tagName.toLowerCase() === 'picture') {
      const { srcset } = HTMLImage.querySelector('source') || {};
      const srcsetItems = srcset.split(',');
      if (srcset) return prefixUrl(srcsetItems[srcsetItems.length - 1].trim().split(' ')[0]);
    }
    return null;
  }).filter(Boolean);

  if (url.includes('medium.com')) { imagesSrc.shift(); } // first image is always the profile image

  const GRAB_IMAGES_MARKDOWN_REGEX = /!\[(.*?)]\((.*?)\)/g;
  return markdown.replace(GRAB_IMAGES_MARKDOWN_REGEX, (match, p1, p2) => {
    const newUrl = imagesSrc.shift() || p2;
    return `![${p1}](${newUrl})`;
  });
};

module.exports = {
  allowedPlatforms,
  displayError: chalk.bold.red,
  displaySuccess: chalk.bold.green,
  displayInfo: chalk.bold.blue,
  isPlatformAllowed(platform, config = false) {
    if (config) {
      return allowedPlatforms.includes(platform) || module.exports.imagePlatform === platform
                || platform === 'imageSelector' || platform === 'selector';
    }
    return allowedPlatforms.includes(platform);
  },
  platformNotAllowedMessage: `Platforms specified are not all allowed. Allowed platform values are: ${allowedPlatforms.join(', ')}`,
  isDataURL(s) {
    const regex = /^data:((?:\w+\/(?:(?!;).)+)?)((?:;[\w\W]*?[^;])*),(.+)$/i;
    return !!s.match(regex);
  },
  imagePlatform: 'cloudinary',
  findMainContentElements,
  getRemoteArticleDOM,
  formatMarkdownImages,
};
