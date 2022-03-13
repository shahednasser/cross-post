const { Command } = require('commander');

const reset = new Command();

reset.name('reset')
  .description('reset configuration for a given platform(s)')
  .executableDir('./reset')
  .command('dev', 'reset configuration for dev.to')
  .command('medium', 'reset configuration for medium.com');

reset.parse();
