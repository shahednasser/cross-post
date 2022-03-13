const Conf = require('conf');

const CONFIG_SCHEMA = {
  dev: {
    type: 'object',
    properties: {
      apiKey: {
        type: 'string',
        default: '',
      },
    },
  },
  hashnode: {
    type: 'object',
    properties: {
      apiKey: {
        type: 'string',
        default: '',
      },
      username: {
        type: 'string',
        default: '',
      },
    },
  },
  medium: {
    type: 'object',
    properties: {
      integrationToken: {
        type: 'string',
        default: '',
      },
      authorId: {
        type: 'string',
        default: '',
      },
    },
  },
  imageSelector: {
    type: 'string',
    default: '',
  },
  titleSelector: {
    type: 'string',
    default: '',
  },
  selector: {
    type: 'string',
    default: '',
  },
};
const CONFIG_DEFAULTS = {
  dev: {
    apiKey: '',
  },
  hashnode: {
    apiKey: '',
    username: '',
  },
  medium: {
    integrationToken: '',
    authorId: '',
  },
  imageSelector: '',
  titleSelector: '',
  selector: '',
};
const configstore = new Conf({ schema: CONFIG_SCHEMA, defaults: CONFIG_DEFAULTS });
module.exports = configstore;
