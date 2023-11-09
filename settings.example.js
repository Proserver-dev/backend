const fs = require('fs');

// RSA256 2048b
const privateKey = fs.readFileSync('./private-key.pem', 'utf8');
const publicKey = fs.readFileSync('./public-key.pem', 'utf8');

const SETTINGS = {
    'PORT': 3000,
    'ENV': '', // prod OR dev
    'JWT_SECRET': 'secret_key',
    'SOCKET_IO': {
        'CORS': {
            origin: '*', // Możesz dostosować '*' do odpowiednich adresów, aby ograniczyć dostęp.
            methods: ['GET', 'POST'],
        }
    },
    'LOGIN_TOKEN': {
        'ALGORITHM': '',
        'TTL': '' // Xm, Xd
    },
    'REFRESH_TOKEN': {
        'ALGORITHM': 'RS256',
        'TTL': '', // Xm, Xd
        'PRIVATE_KEY': privateKey,
        'PUBLIC_KEY': publicKey
    },
    'SMTP': {
        'HOST': 'host',
        'PORT': 465,
        'SECURE': true,
        'AUTH': {
            'USER': 'user@domain.com',
            'PASS': 'secret'
        }
    }
}

module.exports = { SETTINGS }