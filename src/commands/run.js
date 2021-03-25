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
let platformsPosted = 0,
    chosenPlatforms = allowedPlatforms

function run (url, {title, platforms}) {

    //check if all platforms chosen are correct
    if (platforms) {
        const error = platforms.some((platform) => {
            return !isPlatformAllowed(platform)
        })
        if (error) {
            console.error(
                displayError(platformNotAllowedMessage)
            )
            return
        }
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

    loading.start()
    got(url).then((response) => {
        const dom = new JSDOM(response.body),
            articleNode = dom.window.document.querySelector('article')
        if (articleNode) {
            const html = articleNode.innerHTML
            let markdown = ""
            if (html) {
                markdown = html2markdown.translate(html)
            }
            if (!title) {
                //get title of article
                title = searchTitle(articleNode)
                if (!title) {
                    title = ""
                }
            }
            chosenPlatforms.forEach((platform) => {
                switch (platform) {
                    case 'dev':
                        postToDev(title, markdown, url)
                        break
                    case 'hashnode':
                        postToHashnode(title, markdown, url)
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

    function searchTitle (node) {
        if (node.tagName === 'H1' || node.tagName === 'H2' || node.tagName === 'H3' || node.tagName === 'H4' || node.tagName === 'H5' || node.tagName === 'H6') {
            return node.textContent
        }

        if (node.childNodes.length) {
            const childNodes = node.childNodes
            for(let i = 0; i < childNodes.length; i++) {
                const title = searchTitle(childNodes.item(i))
                if (title) {
                    return title
                }
            }
        }

        return null
    }
}

function postToDev (title, body_markdown, canonical_url) {
    loading.message(`Posting article to dev.to`)
    //send article to DEV.to
    axios.post('https://dev.to/api/articles', 
    {
        article: {
            title,
            published: false,
            body_markdown,
            canonical_url
        }
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
        console.error(
            displayError('Error occured while cross posting to DEV: ' + err.response.data.error)
        )
    })
}

function postToHashnode (title, contentMarkdown, originalArticleURL) {
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
        hideFromHashnodeFeed: true
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

function checkIfShouldStopLoading () {
    if (platformsPosted === chosenPlatforms.length) {
        loading.stop()
    }
}

module.exports = run