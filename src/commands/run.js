const Conf = require('conf')
const got = require('got')
const jsdom = require('jsdom')
const { JSDOM } = jsdom
const { NodeHtmlMarkdown } = require('node-html-markdown')
const html2markdown = new NodeHtmlMarkdown()
const CLI = require('clui')
const Spinner = CLI.Spinner
const {
    allowedPlatforms,
    displayError,
    displaySuccess,
    isPlatformAllowed,
    platformNotAllowedMessage,
    isDataURL,
    imagePlatform,
} = require('../utils')
const postToDev = require('./platforms/dev')
const postToHashnode = require('./platforms/hashnode')
const postToMedium = require('./platforms/medium')
const uploadToCloudinary = require('./platforms/cloudinary')

const configstore = new Conf(),
    loading = new Spinner('Processing URL...')

let platformsPosted = 0, //incremental count of platforms the article is posted on
    chosenPlatforms = allowedPlatforms //the platforms chosen, defaults to all platforms

/**
 *
 * @param {string} url URL of the blog post
 * @param {object} param1 The parameters from the command line
 */
function run(
    url,
    { title, platforms, selector, public, ignoreImage, imageSelector, imageUrl }
) {
    if (typeof public !== 'boolean') {
        public = false
    }

    //check if all platforms chosen are correct
    if (platforms) {
        const error = platforms.some((platform) => {
            return !isPlatformAllowed(platform)
        })
        if (error) {
            //if some of the platforms are not correct, return
            console.error(displayError(platformNotAllowedMessage))
            return
        }
        //set chosen platforms to platforms chosen
        chosenPlatforms = platforms
    }

    //check if configurations exist for the platforms
    const errorPlatform = chosenPlatforms.find((platform) => {
        if (!configstore.get(platform)) {
            return true
        }
        return false
    })

    if (errorPlatform) {
        console.error(
            displayError(
                `Please set the configurations required for ${errorPlatform}`
            )
        )
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
                chosenPlatforms.forEach((platform) => {
                    switch (platform) {
                        case 'dev':
                            loading.message(`Posting article to dev.to...`)
                            postToDev(
                                title,
                                markdown,
                                url,
                                image,
                                public,
                                afterPost
                            ).catch(handleError)
                            break
                        case 'hashnode':
                            loading.message(`Posting article to Hashnode...`)
                            postToHashnode(
                                title,
                                markdown,
                                url,
                                image,
                                public,
                                afterPost
                            ).catch(handleError)
                            break
                        case 'medium':
                            loading.message(`Posting article to Medium...`)
                            postToMedium(
                                title,
                                markdown,
                                url,
                                public,
                                afterPost
                            ).catch(handleError)
                    }
                })
            } else {
                throw new Error('No articles found in the URL.')
            }
        })
        .catch(handleError)
}

function handleError(err) {
    loading.stop()
    console.error(displayError(err))
}

/**
 * Function to run after posting on a platform is done
 */
function afterPost({ success, url = '', platform = '', public = false }) {
    if (success) {
        console.log(
            displaySuccess(
                `Article ${
                    public ? 'published' : 'added to drafts'
                } on ${platform} at ${url}`
            )
        )
    }
    platformsPosted++
    checkIfShouldStopLoading()
}

/**
 * If the number of platforms posted on is complete stop the loading
 */
async function checkIfShouldStopLoading() {
    if (platformsPosted === chosenPlatforms.length) {
        loading.stop()
    }
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
