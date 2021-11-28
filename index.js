#! /usr/bin/env node
const { program } = require('commander')
const config = require('./src/commands/config')
const run = require('./src/commands/run')
const run_local = require('./src/commands/run_local')
const { allowedPlatforms } = require('./src/utils')

program.usage('[command] [options]')

program
    .command('run <url>')
    .description('Cross post a blog post')
    .option('-t, --title [title]', 'Title for the article')
    .option(
        '-p, --platforms [platforms...]',
        'Platforms to post articles to. Allowed values are: ' +
            allowedPlatforms.join(', ')
    )
    .option(
        '-s, --selector [selector]',
        'The selector to look for in the document in the URL supplied. By default, it will be article'
    )
    .option(
        '-pu, --public',
        'Publish it publically instead of to drafts by default.'
    )
    .option(
        '-i, --ignore-image',
        'Ignore uploading image with the article. This helps mitigate errors when uploading images'
    )
    .option(
        '-is, --image-selector [imageSelector]',
        'By default, article images will be the first image detected in the article. This ' +
            'allows you to specify the selector of the image to be used instead.'
    )
    .option(
        '-iu, --image-url [imageUrl]',
        "URL of image to use for the article's main image."
    )
    .action(run)

program
    .command('run_local <path>')
    .description('Cross post a blog post from a local markdown fiel')
    .option('-t, --title [title]', 'Title for the article')
    .option('-url --url [url]', 'Canonical URl')
    .option(
        '-p, --platforms [platforms...]',
        'Platforms to post articles to. Allowed values are: ' +
            allowedPlatforms.join(', ')
    )
    .option(
        '-pu, --public',
        'Publish it publically instead of to drafts by default.'
    )
    .action(run_local)

program
    .command('config <platform>')
    .description(
        'Add configuration for a platform. Allowed values are: ' +
            allowedPlatforms.join(', ')
    )
    .action(config)

program.parse()
