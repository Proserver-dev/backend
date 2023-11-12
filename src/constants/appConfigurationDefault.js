const { SETTINGS } = require("../../settings")

const APP_CONFIGURATION_DEFAULT = {
    REGISTRATION_ENABLED: {
        key: 'REGISTRATION_ENABLED',
        value: true
    },
    REGISTRATION_DISABLED_REASON: {
        key: 'REGISTRATION_DISABLED_REASON',
        value: 'Under construction'
    },
    LOGIN_ENABLED: {
        key: 'LOGIN_ENABLED',
        value: true
    },
    LOGIN_DISABLED_REASON: {
        key: 'LOGIN_DISABLED_REASON',
        value: 'Maintenance'
    },
    LOGIN_TOKEN_LIFE_TIME: {
        key: 'LOGIN_TOKEN_LIFE_TIME',
        value: SETTINGS.LOGIN_TOKEN.TTL
    },
    REFRESH_TOKEN_LIFE_TIME: {
        key: 'REFRESH_TOKEN_LIFE_TIME',
        value: SETTINGS.REFRESH_TOKEN.TTL
    }
}

module.exports = APP_CONFIGURATION_DEFAULT