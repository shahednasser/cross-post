const fs = require('fs').promises
const CLI = require('clui')
const Spinner = CLI.Spinner
const { displayError, validatePlatforms } = require('../utils')
const publish = require('../commands/platforms/publish.js')
const loading = new Spinner('Processing URL...')
/**
 * Retrieve markdown directly from a local file
 *
 * @param {string} the path to the markdown file
 */
async function sourceMarkdownFile(path) {
    try {
        const data = await fs.readFile(path)
        return data.toString()
    } catch (error) {
        displayError(
            `The following error was raised while trygin to read ${path}: ${path}`
        )
    }
}

async function run_local(path, { title, platforms, public, url }) {
    if (typeof public !== 'boolean') {
        public = false
    }

    const validatedPlatforms = validatePlatforms(platforms)
    if (!validatedPlatforms) {
        return
    }

    //start loading
    loading.start()
    const markdown = await sourceMarkdownFile(path)
    publish(
        validatedPlatforms,
        {
            title: title,
            markdown,
            url: url,
            public: false,
        },
        (message) => loading.message(message),
        () => loading.stop(),
        handleError
    )
}

function handleError(err) {
    loading.stop()
    console.error(displayError(err))
}

module.exports = run_local
