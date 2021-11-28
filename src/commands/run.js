const Conf = require('conf')
const got = require('got')
const jsdom = require('jsdom')
const { JSDOM } = jsdom
const { NodeHtmlMarkdown } = require('node-html-markdown')
const html2markdown = new NodeHtmlMarkdown()
const CLI = require('clui')
const Spinner = CLI.Spinner
const { displayError, isDataURL, validatePlatforms } = require('../utils')
const publish = require('../commands/platforms/publish.js')
const uploadToCloudinary = require('./platforms/cloudinary')

const configstore = new Conf(),
    loading = new Spinner('Processing URL...')

async function sourceRemotePost(
    url,
    { title, platforms, selector, public, ignoreImage, imageSelector, imageUrl }
) {
    got(url)
        .then(async (response) => {
            const dom = new JSDOM(response.body, {
                    resources: 'usable',
                    includeNodeLocations: true,
                }),
                articleNode = dom.window.document.querySelector(selector)
            if (articleNode) {
                //if article element found, get its HTML content
                const html = articleNode.innerHTML
                let markdown = ''
                if (html) {
                    markdown = html2markdown.translate(html)
                }
                //check if title is set in the command line arguments
                if (!title) {
                    //get title of article
                    title = search('title', articleNode)
                    if (!title) {
                        title = ''
                    }
                }
                let image = null
                if (!ignoreImage) {
                    if (imageUrl) {
                        //use image url that is provided
                        image = imageUrl
                    } else {
                        //Get cover image of the article
                        if (imageSelector) {
                            //get image using selector specified
                            image =
                                dom.window.document.querySelector(imageSelector)
                            if (image) {
                                image = image.getAttribute('src')
                            }
                        } else {
                            //check if there's a default image selector in config
                            imageSelector = configstore.get('imageSelector')
                            if (imageSelector) {
                                image =
                                    dom.window.document.querySelector(
                                        imageSelector
                                    )
                                if (image) {
                                    image = image.getAttribute('src')
                                }
                            } else {
                                image = search('image', articleNode)
                            }
                        }
                        //check if image is dataurl
                        if (image && isDataURL(image)) {
                            const response = await uploadToCloudinary(image)
                            image = response.url
                        }
                    }
                }
                publish(
                    platforms,
                    {
                        title,
                        markdown,
                        url,
                        image,
                        public,
                    },
                    (message) => loading.message(message),
                    () => loading.stop(),
                    handleError
                )
            } else {
                throw new Error('No articles found in the URL.')
            }
        })
        .catch(handleError)
}

/**
 *
 * @param {string} url URL of the blog post
 * @param {object} param1 The parameters from the command line
 */
async function run(
    url,
    { title, platforms, selector, public, ignoreImage, imageSelector, imageUrl }
) {
    if (typeof public !== 'boolean') {
        public = false
    }

    const validatedPlatforms = validatePlatforms(platforms)
    if (!validatedPlatforms) {
        return
    }

    if (!selector) {
        //check if a default selector is set in the configurations
        selector = configstore.get('selector')
        if (!selector) {
            selector = 'article' //default value if no selector is supplied
        }
    }

    //start loading
    loading.start()
    return await sourceRemotePost(url, {
        title,
        platforms,
        selector,
        public,
        ignoreImage,
        imageSelector,
        imageUrl,
    })
}

function handleError(err) {
    loading.stop()
    console.error(displayError(err))
}

/**
 *
 * @param {string} type Type to search for. Can be either title or
 * @param {HTMLElement} node element to search in
 * @returns
 */
function search(type, node) {
    if (
        (type === 'title' &&
            (node.tagName === 'H1' ||
                node.tagName === 'H2' ||
                node.tagName === 'H3' ||
                node.tagName === 'H4' ||
                node.tagName === 'H5' ||
                node.tagName === 'H6')) ||
        (type === 'image' && node.tagName === 'IMG')
    ) {
        return type === 'title' ? node.textContent : node.getAttribute('src')
    }

    if (node.childNodes && node.childNodes.length) {
        const childNodes = node.childNodes
        for (let i = 0; i < childNodes.length; i++) {
            const title = search(type, childNodes.item(i))
            if (title) {
                return title
            }
        }
    }

    return null
}

module.exports = run
