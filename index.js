#! /usr/bin/env node
const { program } = require('commander')
const config = require('./config')
const run = require('./run')

program.usage('[command] [options]')

program
    .command('run')
    .description('Cross post a blog post')
    .arguments('<url> [platforms...]')
    .action(run)

program
    .command('config')
    .description('Add configuration for a platform')
    .arguments('<platform>')
    .action(config)

program.parse()