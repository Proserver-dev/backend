const SETTINGS = {
    'PORT': 3000,
    'SOCKET_IO': {
        'CORS': {
            origin: '*', // Możesz dostosować '*' do odpowiednich adresów, aby ograniczyć dostęp.
            methods: ['GET', 'POST'],
        }
    }
}

module.exports = { SETTINGS }