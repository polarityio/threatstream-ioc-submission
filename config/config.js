module.exports = {
  name: 'Anomali ThreatStream IOC Submission',
  acronym: 'TSI',
  description: 'TS',
  entityTypes: ['IPv4', 'IPv6', 'domain', 'hash', 'email'],
  styles: ['./styles/styles.less'],
  onDemandOnly: true,
  block: {
    component: {
      file: './components/block.js'
    },
    template: {
      file: './templates/block.hbs'
    }
  },
  request: {
    cert: '',
    key: '',
    passphrase: '',
    ca: '',
    proxy: '',
    rejectUnauthorized: false
  },
  logging: {
    level: 'trace' //trace, debug, info, warn, error, fatal
  },
  options: [
    {
      key: 'url',
      name: 'API Url',
      description:
        'The base URL for the Anomali ThreatStream API including the schema (i.e., https://)',
      default: '',
      type: 'text',
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'uiUrl',
      name: 'UI Url',
      description:
        'The base URL for the Anomali ThreatStream UI including the schema (i.e., https://)',
      default: '',
      type: 'text',
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'email',
      name: 'Email',
      description: 'The Email associated with your Anomali ThreatStream account.',
      default: '',
      type: 'text',
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'apiKey',
      name: 'API Key',
      description: 'The your API Key for Anomali ThreatStream.',
      default: '',
      type: 'password',
      userCanEdit: true,
      adminOnly: false
    }
  ]
};
