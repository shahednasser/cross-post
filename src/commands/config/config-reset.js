const { Command } = require('commander');

const reset = new Command();

reset.name('reset')
  .description('reset configuration for a given platform(s)')
  .addHelpText('after', `
Example:
    # to reset dev.to configuration
    $ cross-post config reset dev

    # to reset all non-platform configuration
    $ cross-post config reset all
        (or just)
    $ cross-post config reset
  `)
  .executableDir('./reset')
  .command('dev', 'reset configuration for dev.to')
  .command('medium', 'reset configuration for medium.com')
  .command('hashnode', 'reset configuration for hashnode.com')
  .command('cloudinary', 'reset configuration for cloudinary')
  .command('all', 'reset all *non-platform* configuration', { isDefault: true });

reset.parse();
