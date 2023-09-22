#! /usr/bin/env node
const path = require('path');
const { program } = require('commander');
const run = require('./src/commands/run');
const { allowedPlatforms } = require('./src/utils');

program.usage('[command] [options]');

program
  .command('run <url>')
  .description('Cross post a blog post')
  .option('-l, --local [canonicalUrl]', 'For using a local Markdown file, <url> will be the path and <canonicalUrl> is optional')
  .option('-t, --title [title]', 'Title for the article')
  .option('-p, --platforms [platforms...]', `Platforms to post articles to. Allowed values are: ${allowedPlatforms.join(', ')}`)
  .option('-s, --selector [selector]', 'The selector to look for in the document in the URL supplied. By default, it will be article. '
        + 'This will override the selector set in the config.')
  .option('-pu, --public', 'Publish it publically instead of to drafts by default.')
  .option('-i, --ignore-image', 'Ignore uploading image with the article. This helps mitigate errors when uploading images')
  .option('-is, --image-selector [imageSelector]', 'By default, article images will be the first image detected in the article. This '
        + 'allows you to specify the selector of the image to be used instead. This will override the selector set in the config.')
  .option('-ts, --title-selector [titleSelector]', 'By default, the article title is the first heading detected. This will allow '
        + 'you to change the default selector. This will override the selector set in the config.')
  .option('-iu, --image-url [imageUrl]', 'URL of image to use for the article\'s main image.')
  .action(run);

program
  .command('config')
  .description(`Add configuration for a platform or other options. Allowed values are: ${allowedPlatforms.join(', ')}`)
  .executableDir(path.join(__dirname, './src/commands/config'))
  .command('dev', 'configure for dev.to platform')
  .command('medium', 'configure for medium.com platform')
  .command('hashnode', 'configure for hashnode.com platform')
  .command('cloudinary', 'configure for cloudinary platform')
  .command('imageSelector', 'set article hero image selector CSS rule')
  .command('titleSelector', 'set article title selector CSS rule')
  .command('selector', 'set article selector CSS rule (for articles retrieved from URL)')
  .command('reset', 'reset configuration for a given platform(s)');

program.parse();
