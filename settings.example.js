const SETTINGS = {
    'PORT': 3000,
    'SOCKET_IO': {
        'CORS': {
            origin: '*', // Możesz dostosować '*' do odpowiednich adresów, aby ograniczyć dostęp.
            methods: ['GET', 'POST'],
        }
    },
    'JWT_SECRET': 'secret_key',
    'ENV': '' // prod OR dev
}

module.exports = { SETTINGS }