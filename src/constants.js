const IGNORED_IPS = new Set(['127.0.0.1', '255.255.255.255', '0.0.0.0']);

const THREAT_TYPES = {
  IPv4: [
    { type: 'bot', name: 'Bot' },
    { type: 'brute', name: 'Brute' },
    { type: 'c2', name: 'C2' },
    { type: 'compromised', name: 'Compromised' },
    { type: 'crypto', name: 'Crypto' },
    { type: 'ddos', name: 'DDOS' },
    { type: 'exfil', name: 'Exfil' },
    { type: 'exploit', name: 'Exploit' },
    { type: 'i2p', name: 'I2P' },
    { type: 'informational', name: 'Informational' },
    { type: 'p2p', name: 'P2P' },
    { type: 'parked', name: 'Parked' },
    { type: 'phish', name: 'Phish' },
    { type: 'scan', name: 'Scan' },
    { type: 'sinkhole', name: 'Sinkhole' },
    { type: 'spam', name: 'Spam' },
    { type: 'suspicious', name: 'Suspicious' },
    { type: 'tor', name: 'TOR' },
    { type: 'vps', name: 'VPS' }
  ],
  domain: [
    { type: 'adware', name: 'Adware' },
    { type: 'anonymization', name: 'Anonymization' },
    { type: 'apt', name: 'Actor' },
    { type: 'c2', name: 'C2' },
    { type: 'compromised', name: 'Compromised' },
    { type: 'exfil', name: 'Exfil' },
    { type: 'exploit', name: 'Exploit' },
    { type: 'informational', name: 'Informational' },
    { type: 'malware', name: 'Malware' },
    { type: 'parked', name: 'Parked' },
    { type: 'phish', name: 'Phish' },
    { type: 'sinkhole', name: 'Sinkhole' },
    { type: 'spam', name: 'Spam' },
    { type: 'suspicious', name: 'Suspicious' }
  ],
  email: [
    { type: 'apt', name: 'Actor' },
    { type: 'compromised', name: 'Compromised' },
    { type: 'informational', name: 'Informational' },
    { type: 'malware', name: 'Malware' },
    { type: 'phish', name: 'Phish' },
    { type: 'spam', name: 'Spam' },
    { type: 'suspicious', name: 'Suspicious' }
  ],
  url: [
    { type: 'anomalous', name: 'Anomalous' },
    { type: 'apt', name: 'Actor' },
    { type: 'c2', name: 'C2' },
    { type: 'compromised', name: 'Compromised' },
    { type: 'crypto', name: 'Crypto' },
    { type: 'data_leakage', name: 'DataLeakage' },
    { type: 'exfil', name: 'Exfil' },
    { type: 'exploit', name: 'Exploit' },
    { type: 'malware', name: 'Malware' },
    { type: 'p2p', name: 'P2P' },
    { type: 'parked', name: 'Parked' },
    { type: 'phish', name: 'Phish' },
    { type: 'spam', name: 'Spam' },
    { type: 'suspicious', name: 'Suspicious' }
  ],
  hash: [
    { type: 'apt', name: 'Actor' },
    { type: 'crypto', name: 'Crypto' },
    { type: 'malware', name: 'Malware' }
  ],
  IPv6: [
    { type: 'anonymization', name: 'Anonymization' },
    { type: 'apt', name: 'Actor' }
  ]
};

module.exports = {
  IGNORED_IPS,
  THREAT_TYPES
};
