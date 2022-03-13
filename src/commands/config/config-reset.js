const { Command } = require('commander');

const reset = new Command();

reset.name('reset')
  .description('reset configuration for a given platform(s)')
  .executableDir('./reset');

reset.parse();
