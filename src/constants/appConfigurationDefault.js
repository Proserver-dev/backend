const { SETTINGS } = require("../../settings")

const APP_CONFIGURATION_DEFAULT = {
    REGISTRATION_ENABLED: {
        key: 'REGISTRATION_ENABLED',
        value: true,
        type: 'main'
    },
    REGISTRATION_DISABLED_REASON: {
        key: 'REGISTRATION_DISABLED_REASON',
        value: 'Under construction',
        type: 'main'
    },
    LOGIN_ENABLED: {
        key: 'LOGIN_ENABLED',
        value: true,
        type: 'main'
    },
    LOGIN_DISABLED_REASON: {
        key: 'LOGIN_DISABLED_REASON',
        value: 'Maintenance',
        type: 'main'
    },
    LOGIN_TOKEN_LIFE_TIME: {
        key: 'LOGIN_TOKEN_LIFE_TIME',
        value: SETTINGS.LOGIN_TOKEN.TTL,
        type: 'main'
    },
    REFRESH_TOKEN_LIFE_TIME: {
        key: 'REFRESH_TOKEN_LIFE_TIME',
        value: SETTINGS.REFRESH_TOKEN.TTL,
        type: 'main'
    },
    THROTTLE_TIME_SENDING_EMAILS: {
        key: 'THROTTLE_TIME_SENDING_EMAILS',
        value: 60000,
        type: 'main'
    },
    PASSWORD_MIN_CHARS: {
        key: 'PASSWORD_MIN_CHARS',
        value: 8,
        type: 'password'
    },
    PASSWORD_MIN_SMALL_LETTERS: {
        key: 'PASSWORD_MIN_SMALL_LETTERS',
        value: 1,
        type: 'password'
    },
    PASSWORD_MIN_BIG_LETTERS: {
        key: 'PASSWORD_MIN_BIG_LETTERS',
        value: 1,
        type: 'password'
    },
    PASSWORD_MIN_DIGITS: {
        key: 'PASSWORD_MIN_DIGITS',
        value: 1,
        type: 'password'
    },
    PASSWORD_MIN_SPECIAL_CHARS: {
        key: 'PASSWORD_MIN_SPECIAL_CHARS',
        value: 1,
        type: 'password'
    }
}

module.exports = APP_CONFIGURATION_DEFAULT