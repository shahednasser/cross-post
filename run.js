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
    require('./utils')

/**
 * 
 * @param {string} url URL to cross post from
 * @param {array} platforms platforms to cross post to
 */
function run (url, platforms) {
    let chosenPlatforms = allowedPlatforms

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

    const configstore = new Conf()

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

    const loading = new Spinner('Processing URL...')
    got(url).then((response) => {
        const dom = new JSDOM(response.body),
            articleNode = dom.window.document.querySelector('article')
        if (articleNode) {
            const html = articleNode.html
            let markdown = ""
            if (html) {
                markdown = html2markdown.translate(html)
            }
            //get title of article
            let title = searchTitle(articleNode)
            if (!title) {
                title = ""
            }
            chosenPlatforms.forEach((platform) => {
                loading.message(`Posting article ${title} to ${platform}`)
                switch (platform) {
                    case 'dev':
                        postToDev(title, markdown)
                        break
                }
            })
        } else {
            console.error(
                displayError('No articles found in the URL.')
            )
            return
        }
    })
    .catch((err) => console.error(displayError(err)))

    function searchTitle (node) {
        console.log(node.tagName)
        if (node.tagName === 'H1' || node.tagName === 'H2' || node.tagName === 'H3' || node.tagName === 'H4' || node.tagName === 'H5' || node.tagName === 'H6') {
            console.log("innerText", node.textContent)
            return node.textContent
        }

        if (node.childNodes.length) {
            const childNodes = node.childNodes
            for(let i = 0; i < childNodes.length; i++) {
                const title = searchTitle(childNodes.item(i))
                console.log("title", title)
                if (title) {
                    return title
                }
            }
        }

        return null
    }
}

function postToDev (title, body_markdown) {
    //send article to DEV.to
    axios.post('https://dev.to/api/articles', 
    {
        article: {
            title,
            published: false,
            body_markdown
        }
    },
    {
    headers: {
        'api-key': configstore.get('dev')
    }
    }).then ((devReponse) => {
        console.log(
            displaySuccess('Article added to drafts on DEV at ' + devReponse.data.url + '/edit')
        )
    }).catch((err) => {
        console.error(
            displayError('Error occured while cross posting to DEV: ' + err.data.message)
        )
    })
}

module.exports = run