#! /usr/bin/env node
const { program } = require('commander')
const config = require('./src/commands/config')
const run = require('./src/commands/run')
const { allowedPlatforms } = require('./src/utils')

program.usage('[command] [options]')

program
    .command('run <url>')
    .description('Cross post a blog post')
    .option('-t, --title [title]', 'Title for the article')
    .option('-p, --platforms [platforms...]', 'Platforms to post articles to. Allowed values are: ' + allowedPlatforms.join(", "))
    .option('-s, --selector', 'The selector to look for in the document in the URL supplied. By default, it will be article')
    .option('-pu, --public', 'Publish it publically instead of to drafts by default.')
    .option('-i, --ignore-image', 'Ignore uploading image with the article. This helps mitigate errors when uploading images')
    .action(run)

program
    .command('config <platform>')
    .description('Add configuration for a platform. Allowed values are: ' + allowedPlatforms.join(", "))
    .action(config)

program.parse()