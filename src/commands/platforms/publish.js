const postToDev = require('./dev')
const postToHashnode = require('./hashnode')
const postToMedium = require('./medium')
const { displaySuccess } = require('../../utils.js')

async function publish(
    chosenPlatforms,
    { title, markdown, url, image, public },
    beforePosting,
    afterAll,
    handleError
) {
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
    }

    chosenPlatforms.forEach((platform) => {
        switch (platform) {
            case 'dev':
                beforePosting(`Posting article to dev.to...`)
                postToDev(title, markdown, url, image, public, afterPost).catch(
                    handleError
                )
                break
            case 'hashnode':
                beforePosting(`Posting article to Hashnode...`)
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
                beforePosting(`Posting article to Medium...`)
                postToMedium(title, markdown, url, public, afterPost).catch(
                    handleError
                )
        }
    })
    afterAll()
}

module.exports = publish
