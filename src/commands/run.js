const Conf = require('conf')
const got = require('got')
const jsdom = require("jsdom")
const { JSDOM } = jsdom
const { NodeHtmlMarkdown } = require('node-html-markdown')
const axios = require('axios')
const html2markdown = new NodeHtmlMarkdown()
const CLI = require('clui')
const Spinner = CLI.Spinner
const { allowedPlatforms, displayError, displaySuccess, isPlatformAllowed, platformNotAllowedMessage, displayInfo } = 
    require('../utils')

const configstore = new Conf(),
    loading = new Spinner('Processing URL...')

let platformsPosted = 0, //incremental count of platforms the article is posted on
    chosenPlatforms = allowedPlatforms //the platforms chosen, defaults to all platforms

/**
 * 
 * @param {string} url URL of the blog post
 * @param {object} param1 The parameters from the command line
 */
function run (url, {title, platforms, selector, public}) {
    if (typeof public !== "boolean") {
        public = false;
    }

    //check if all platforms chosen are correct
    if (platforms) {
        const error = platforms.some((platform) => {
            return !isPlatformAllowed(platform)
        })
        if (error) {
            //if some of the platforms are not correct, return
            console.error(
                displayError(platformNotAllowedMessage)
            )
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
            displayError(`Please set the configurations required for ${errorPlatform}`)
        )
        return
    }

    if (!selector) {
        selector = 'article' //default value if no selector is supplied
    }

    //start loading
    loading.start()
    got(url).then((response) => {
        const dom = new JSDOM(response.body, {
                resources: 'usable',
                includeNodeLocations: true
            }),
            articleNode = dom.window.document.querySelector(selector)
        if (articleNode) {
            //if article element found, get its HTML content
            const html = articleNode.innerHTML
            let markdown = ""
            if (html) {
                markdown = html2markdown.translate(html)
            }
            //check if title is set in the command line arguments
            if (!title) {
                //get title of article
                title = search('title', articleNode)
                if (!title) {
                    title = ""
                }
            }
            //Get cover image of the article
            let image = search('image', articleNode)
            chosenPlatforms.forEach((platform) => {
                switch (platform) {
                    case 'dev':
                        postToDev(title, markdown, url, image, public)
                        break
                    case 'hashnode':
                        postToHashnode(title, markdown, url, image, public)
                        break;
                    case 'medium':
                        postToMedium(title, markdown, url, public)
                }
            })
        } else {
            loading.stop()
            console.error(
                displayError('No articles found in the URL.')
            )
            return
        }
    })
    .catch((err) => {
        loading.stop()
        console.error(displayError(err))
    })
}

/**
 * If the number of platforms posted on is complete stop the loading
 */
function checkIfShouldStopLoading () {
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
function search (type, node) {
    if ((type === 'title' && (node.tagName === 'H1' || node.tagName === 'H2' || node.tagName === 'H3' || 
            node.tagName === 'H4' || node.tagName === 'H5' || node.tagName === 'H6')) || 
        (type === "image" && node.tagName === 'IMG')) {
        return type === 'title' ? node.textContent : node.getAttribute('src')
    }

    if (node.childNodes && node.childNodes.length) {
        const childNodes = node.childNodes
        for(let i = 0; i < childNodes.length; i++) {
            const title = search(type, childNodes.item(i))
            if (title) {
                return title
            }
        }
    }

    return null
}

/**
 * Post article to dev.to 
 * 
 * @param {string} title Title of article
 * @param {string} body_markdown Content of the article in markdown
 * @param {string} canonical_url URL of original article
 * @param {string} main_image Cover image URL
 * @param {boolean} published whether to publish as draft or public
 */
function postToDev (title, body_markdown, canonical_url, main_image, published) {
    loading.message(`Posting article to dev.to`)
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
    axios.post('https://dev.to/api/articles', 
    {
        article
    },
    {
    headers: {
        'api-key': configstore.get('dev').apiKey
    }
    }).then ((devReponse) => {
        platformsPosted++
        checkIfShouldStopLoading()
        console.log(
            displaySuccess('Article added to drafts on DEV at ' + devReponse.data.url + '/edit')
        )
    }).catch((err) => {
        platformsPosted++
        checkIfShouldStopLoading()
        if (err.response) {
            console.error(
                displayError('Error occured while cross posting to DEV: ' + err.response.data.error)
            )
        } else {
            console.error(
                displayError('An error occurred, please try again later')
            )
            console.error(err)
        }
    })
}

/**
 * Post article to Hashnode
 * 
 * @param {string} title Title of article
 * @param {string} contentMarkdown Content of article in Markdown
 * @param {string} originalArticleURL URL of original article
 * @param {string} coverImageURL URL of cover image
 * @param {boolean} hideFromHashnodeFeed Whether to post it publically or not
 */
function postToHashnode (title, contentMarkdown, originalArticleURL, coverImageURL, hideFromHashnodeFeed) {
    loading.message(`Posting article to Hashnode...`)
    const configData = configstore.get('hashnode')
    const data = {
        input: {
            title,
            contentMarkdown,
            isRepublished: {
                originalArticleURL
            },
            tags: []
        },
        publicationId: configData.publicationId,
        hideFromHashnodeFeed
    }
    if (coverImageURL) {
        data.input.coverImageURL = coverImageURL
    }
    axios.post('https://api.hashnode.com', {
        query: 'mutation createPublicationStory($input: CreateStoryInput!, $publicationId: String!){ createPublicationStory(input: $input, publicationId: $publicationId){ post { slug, publication { domain } } } }',
        variables: data
    }, {
        headers: {
            'Authorization': configData.apiKey
        }
    })
    .then ((res) => {
        platformsPosted++
        checkIfShouldStopLoading()
        if (res.data.errors) {
            platformsPosted++
            checkIfShouldStopLoading()
            console.error(
                displayError('Error occured while cross posting to Hashnode: ' + res.data.errors[0].message)
            )
        } else {
            const post = res.data.data.createPublicationStory.post,
                postUrl = post.publication.domain + '/' + post.slug

            platformsPosted++
            checkIfShouldStopLoading()

            console.log(
                displaySuccess('Article added as hidden on Hashnode at ' + postUrl)
            )
        }
    })
    .catch((err) => {
        platformsPosted++
        checkIfShouldStopLoading()

        if (err.response) {
            console.error(
                displayError('Error occured while cross posting to Hashnode: ' + err.response.data.errors[0].message)
            )
        } else {
            console.error(
                displayError('An error occurred, please try again later.')
            )
        }
    })
}

/**
 * Post article to Medium
 * 
 * @param {string} title Title of article
 * @param {string} content Content of article in markdown
 * @param {string} canonicalUrl URL of original article
 * @param {boolean} public Whether to publish article publicly or not
 */
function postToMedium (title, content, canonicalUrl, public) {
    loading.message(`Posting article to Medium...`)
    const mediumConfig = configstore.get('medium')
    axios.post(`https://api.medium.com/v1/users/${mediumConfig.authorId}/posts`, {
        title,
        contentFormat: 'markdown',
        content,
        canonicalUrl,
        publishStatus: public ? 'public' : 'draft'
    }, {
        headers: {
            'Authorization': `Bearer ${mediumConfig.integrationToken}`
        }
    })
    .then ((res) => {
        platformsPosted++
        checkIfShouldStopLoading()
        console.log(
            displaySuccess('Article added as draft on Medium at ' + res.data.data.url)
        )
    })
    .catch ((res) => {
        platformsPosted++
        checkIfShouldStopLoading()

        if (res.data) {
            console.error(
                displayError('Error occured while cross posting to Medium: ' + res.data)
            )
        } else {
            console.error(
                displayError('An error occurred, please try again later.')
            )
        }
    })
}

module.exports = run