module.exports = {
  name: 'Anomali ThreatStream IOC Submission',
  acronym: 'TSI',
  description:
    "Submit Indicators of Compromise to Anomali's ThreatStream platform.",
  entityTypes: ['IPv4', 'IPv6', 'email', 'md5', 'sha1', 'sha256', 'domain', 'url'],
  defaultColor: 'light-purple',
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
  summary: {
    component: {
      file: './components/summary.js'
    },
    template: {
      file: './templates/summary.hbs'
    }
  },
  request: {
    cert: '',
    key: '',
    passphrase: '',
    ca: '',
    proxy: '',
    rejectUnauthorized: true
  },
  logging: {
    level: 'info' //trace, debug, info, warn, error, fatal
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
      description: 'The email associated with your Anomali ThreatStream account.',
      default: '',
      type: 'text',
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'apiKey',
      name: 'API Key',
      description: 'The API Key for Anomali ThreatStream.',
      default: '',
      type: 'password',
      userCanEdit: true,
      adminOnly: false
    },
    {
      key: 'allowDelete',
      name: 'Allow IOC Deletion',
      description:
        'If checked, users will be able to permanently delete an indicator from Anomali Threatstream. (this setting must be set to `User can view only`).',
      default: true,
      type: 'boolean',
      userCanEdit: true,
      adminOnly: false
    },
    {
      key: 'allowResubmission',
      name: 'Allow IOC Resubmission',
      description:
        'If checked, users will be able to resubmit already found indicators to Anomali Threatstream. (this setting must be set to `User can view only`).',
      default: false,
      type: 'boolean',
      userCanEdit: false,
      adminOnly: false
    }
  ]
};
