require('dotenv').config()
const fastify = require('fastify')({
    logger: true
})
const got = require('got')
const jsdom = require("jsdom")
const { JSDOM } = jsdom
const { NodeHtmlMarkdown, NodeHtmlMarkdownOptions } = require('node-html-markdown')
const axios = require('axios')
const port = process.env.PORT || 3000

const html2markdown = new NodeHtmlMarkdown()

fastify.get('/toMarkdown/:url', function (req, res) {
    got(req.params.url).then((response) => {
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
            fastify.log.info(title)
            const article = {
                title,
                published: false,
                body_markdown: markdown
            }
            //send article to DEV.to
            axios.post('https://dev.to/api/articles', 
                {
                    article
                }, {
                headers: {
                    'api-key': process.env.DEV_TO_API_KEY
                }
            }).then ((devReponse) => {
                res.send({success: true, message: 'Article added to drafts on DEV at ' + devReponse.data.url + '/edit'})
            }).catch((err) => {
                console.error(err.data)
                res.send({success: false, message: 'An error ocurred'})
            })
        } else {
            res.send({success: false, message: 'No articles found in the URL.'})
        }
    })
    .catch((err) => fastify.log.error(err))
})

fastify.listen(port, (err, address) => {
    if (err) {
        fastify.log.error(err)
        process.exit(1)
    }
    fastify.log.info(`listening on port ${port}`)
})

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