module.exports = {
    userMe: {
        summary: 'Endpoint do pobierania informacji o aktualnie zalogowanym użytkowniku',
        security: [{ Token: [] }],
        responses: {
            200: {
                description: 'Pomyślnie pobrano informacje o użytkowniku.',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                id: { type: 'integer', description: 'Identyfikator użytkownika.' },
                                isActivated: { type: 'boolean', description: 'Informacja o tym, czy użytkownik jest aktywowany.' },
                                email: { type: 'string', format: 'email', description: 'Adres e-mail użytkownika.' },
                                userName: { type: 'string', description: 'Nazwa użytkownika (może być null).' },
                                nameLastname: { type: 'string', description: 'Imię i nazwisko użytkownika (może być null).' },
                                role: {
                                    type: 'object',
                                    properties: {
                                        id: { type: 'integer', description: 'Identyfikator roli.' },
                                        name: { type: 'string', description: 'Nazwa roli.' },
                                        short: { type: 'string', description: 'Skrócona nazwa roli.' },
                                    },
                                },
                                isLoggedIn: { type: 'boolean', description: 'Informacja o tym, czy użytkownik jest zalogowany.' },
                                updatedAt: { type: 'string', format: 'date-time', description: 'Data ostatniej aktualizacji rekordu.' },
                                createdAt: { type: 'string', format: 'date-time', description: 'Data utworzenia rekordu.' },
                            },
                        },
                    },
                },
            },
        },
    },
};
