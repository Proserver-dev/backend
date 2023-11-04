const API_RESULTS = {
    ERR_LOGIN_ERROR: {
        descripiton: "Błąd logowania",
        code: 'ERR_LOGIN_ERROR',
        status_code: 500
    },
    ERR_REGISTER_ERROR: {
        descripiton: "Błąd rejestracji",
        code: 'ERR_REGISTER_ERROR',
        status_code: 500
    },
    ERR_REFRESH_TOKEN: {
        descripiton: "Błąd odświeżania tokena",
        code: 'ERR_REFRESH_TOKEN',
        status_code: 500
    },
    ERR_VERIFY_TOKEN: {
        descripiton: "Błąd weryfikacji tokenu",
        code: 'ERR_VERIFY_TOKEN',
        status_code: 500
    },
    ERR_READ_FILE: {
        descripiton: "Błąd odczytu pliku",
        code: 'ERR_READ_FILE',
        status_code: 500
    },
    ERR_PROVIDE_LOGIN_DATA: {
        descripiton: "Musisz wprowadzić dane logowania",
        code: 'ERR_PROVIDE_LOGIN_DATA',
        status_code: 400
    },
    ERR_PROVIDE_EMAIL_FIELD: {
        descripiton: "Musisz wypełnić pole \"email\"",
        code: 'ERR_PROVIDE_EMAIL_FIELD',
        status_code: 400
    },
    ERR_PROVIDE_PASSWORD_FIELD: {
        descripiton: "Musisz wypełnić pole \"password\"",
        code: 'ERR_PROVIDE_PASSWORD_FIELD',
        status_code: 400
    },
    ERR_WRONG_PASSWORD: {
        descripiton: "Niepoprawne hasło",
        code: 'ERR_WRONG_PASSWORD',
        status_code: 401
    },
    ERR_PROVIDE_DEVICE_TOKEN: {
        descripiton: "Musisz przekazać Device-Token w nagłówku",
        code: 'ERR_PROVIDE_DEVICE_TOKEN',
        status_code: 400
    },
    ERR_PROVIDE_LOGIN_TOKEN: {
        descripiton: "Musisz przekazać Token w nagłówku",
        code: 'ERR_PROVIDE_LOGIN_TOKEN',
        status_code: 400
    },
    ERR_PROVIDE_REFRESH_TOKEN: {
        descripiton: "Musisz przekazać Refresh-Token w nagłówku",
        code: 'ERR_PROVIDE_REFRESH_TOKEN',
        status_code: 400
    },
    ERR_REFRESH_TOKEN_EXPIRED: {
        descripiton: "Refresh-Token jest nieaktualny",
        code: 'ERR_REFRESH_TOKEN_EXPIRED',
        status_code: 401
    },
    ERR_TOKEN_EXPIRED: {
        descripiton: "Token jest nieaktualny",
        code: 'ERR_TOKEN_EXPIRED',
        status_code: 401
    },
    ERR_WRONG_DEVICE_TOKEN: {
        descripiton: "Device-Token jest niepoprawny",
        code: 'ERR_WRONG_DEVICE_TOKEN',
        status_code: 401
    },
    ERR_USER_FROM_TOKEN_NOT_EXISTS: {
        descripiton: "Użytkownik z tokena nie istnieje",
        code: 'ERR_USER_FROM_TOKEN_NOT_EXISTS',
        status_code: 404
    },
    ERR_USER_NOT_EXISTS: {
        descripiton: "Użytkownik nie istnieje",
        code: 'ERR_USER_NOT_EXISTS',
        status_code: 404
    },
    ERR_USER_ALREADY_EXISTS: {
        descripiton: "Użytkownik z takim mailem już istnieje",
        code: 'ERR_USER_ALREADY_EXISTS',
        status_code: 400
    }
}

module.exports = API_RESULTS