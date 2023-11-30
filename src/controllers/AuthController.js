const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const User = require('../models/UserModel');
const Role = require('../models/RoleModel');
const AuthHistory = require('../models/AuthHistory')
const EmailSendHistory = require('../models/EmailSendHistoryModel')
const { saveLogFromEndpointRequest } = require('../functions');
const isValidEmail = require('../utils/isValidEmail')
const generateAuthPin = require('../utils/generateAuthPin')
const { SETTINGS } = require('../../settings');
const { DEFAULT_ROLE } = require('../constants/roleBlocked')
const HEADERS_KEYS = require('../constants/headersKeys')
const API_RESULTS = require('../constants/apiResults')
const emailClient = require('../utils/emailClient')
const getAppSetting = require('../utils/getAppSetting')
const APP_CONFIGURATION_DEFAULT = require('../constants/appConfigurationDefault')
const EMAIL_STATUSES = require('../constants/emailStatuses');
const validatePassword = require('../utils/validatePassword');

const register = async (req, res) => {
    /*
    #swagger.tags = ['Auth']
    #swagger.summary = 'Endpoint do rejestracji'

    #swagger.parameters['Device-Token'] = {
        in: 'header',
        required: true
    }

    #swagger.parameters['body'] = {
        in: 'body',
        required: true,
        schema: {
            email: "john@doe.com",
            password: "secret",
            userName: "johndoe123",
            nameLastname: "John Doe"
        }
    }

    #swagger.responses[423] = { 
        description: "Rejestracja wyłączona",
        schema: {
            error: 'ERR_REGISTRATION_DISABLED',
            reason: 'Under construction'
        }  
    }

    #swagger.responses[400] = { 
        description: "Musisz przekazać wszystkie poprawne dane",
        schema: { 
            error: ['ERR_WEAK_PASSWORD', 'ERR_PROVIDE_EMAIL_FIELD', 'ERR_PROVIDE_PASSWORD_FIELD'],
            PASSWORD_MIN_CHARS: 8,
            PASSWORD_MIN_SMALL_LETTERS: 1,
            PASSWORD_MIN_BIG_LETTERS: 1,
            PASSWORD_MIN_DIGITS: 1,
            PASSWORD_MIN_SPECIAL_CHARS: 1
        }   
    }

    #swagger.responses[403] = { 
        description: "Brakuje Device-Token w nagłówku",
        schema: {
            error: 'ERR_PROVIDE_DEVICE_TOKEN'
        }  
    }

    #swagger.responses[422] = { 
        description: "Nieprawidłowe dane wejściowe",
        schema: {
            error: 'ERR_INVALID_EMAIL_ADDRESS'
        }  
    }

    #swagger.responses[409] = { 
        description: "Konflikt, taki user już istnieje",
        schema: {
            error: 'ERR_USER_ALREADY_EXISTS'
        }  
    }

    #swagger.responses[503] = { 
        description: "Nie udało się wysłać maila z powodu niedostępności usługi pocztowej, ale konto się utworzyło",
        schema: {
            error: 'ERR_SEND_EMAIL'
        }  
    }

    #swagger.responses[500] = { 
        description: "Błąd serwerowy",
        schema: {
            error: 'ERR_INTERNAL_SERVER_ERROR'
        }  
    }

    #swagger.responses[200] = { 
        description: "Wszystko poszło GIT",
        schema: { 
            success: 'SUCCESS_USER_REGISTERED',
            user: { $ref: '#/definitions/User' } 
        }  
    }


    */

    saveLogFromEndpointRequest(req)
    const deviceToken = req.header(HEADERS_KEYS.DEVICE_TOKEN);

    const isRegistrationEnabled = await getAppSetting(APP_CONFIGURATION_DEFAULT.REGISTRATION_ENABLED.key)
    if(!isRegistrationEnabled) {
        const reason = await getAppSetting(APP_CONFIGURATION_DEFAULT.REGISTRATION_DISABLED_REASON.key)
        return res.status(API_RESULTS.ERR_REGISTRATION_DISABLED.status_code).send({ error: API_RESULTS.ERR_REGISTRATION_DISABLED.code, reason })
    }

    if(!deviceToken) {
        return res.status(API_RESULTS.ERR_PROVIDE_DEVICE_TOKEN.status_code).json({ error: API_RESULTS.ERR_PROVIDE_DEVICE_TOKEN.code });
    }

    try {
        const { email, password, userName, nameLastname } = req.body;

        if (!email) {
            return res.status(API_RESULTS.ERR_PROVIDE_EMAIL_FIELD.status_code).json({ error: API_RESULTS.ERR_PROVIDE_EMAIL_FIELD.code });
        }

        if (!isValidEmail(email)) {
            return res.status(API_RESULTS.ERR_INVALID_EMAIL_ADDRESS.status_code).json({ error: API_RESULTS.ERR_INVALID_EMAIL_ADDRESS.code });
        }

        if (!password) {
            return res.status(API_RESULTS.ERR_PROVIDE_PASSWORD_FIELD.status_code).json({ error: API_RESULTS.ERR_PROVIDE_PASSWORD_FIELD.code });
        }

        const { lowercaseCount, uppercaseCount, digitsCount, specialCharCount } = validatePassword(password)

        const minCharsCount = await getAppSetting(APP_CONFIGURATION_DEFAULT.PASSWORD_MIN_CHARS.key)
        const minLowercaseCount = await getAppSetting(APP_CONFIGURATION_DEFAULT.PASSWORD_MIN_SMALL_LETTERS.key)
        const minUppercaseCount = await getAppSetting(APP_CONFIGURATION_DEFAULT.PASSWORD_MIN_BIG_LETTERS.key)
        const minDigitsCount = await getAppSetting(APP_CONFIGURATION_DEFAULT.PASSWORD_MIN_DIGITS.key)
        const minSpecialcharsCount = await getAppSetting(APP_CONFIGURATION_DEFAULT.PASSWORD_MIN_SPECIAL_CHARS.key)

        if (password.length < minCharsCount || 
            lowercaseCount < minLowercaseCount || 
            uppercaseCount < minUppercaseCount || 
            digitsCount < minDigitsCount || 
            specialCharCount < minSpecialcharsCount) {

            return res.status(API_RESULTS.ERR_WEAK_PASSWORD.status_code).json({ 
                error: API_RESULTS.ERR_WEAK_PASSWORD.code,
                [APP_CONFIGURATION_DEFAULT.PASSWORD_MIN_CHARS.key]: parseInt(minCharsCount),
                [APP_CONFIGURATION_DEFAULT.PASSWORD_MIN_SMALL_LETTERS.key]: parseInt(minLowercaseCount),
                [APP_CONFIGURATION_DEFAULT.PASSWORD_MIN_BIG_LETTERS.key]: parseInt(minUppercaseCount),
                [APP_CONFIGURATION_DEFAULT.PASSWORD_MIN_DIGITS.key]: parseInt(minDigitsCount),
                [APP_CONFIGURATION_DEFAULT.PASSWORD_MIN_SPECIAL_CHARS.key]: parseInt(minSpecialcharsCount)
            });
        }

        const userExist = await User.findOne({ where: { email } });

        if (userExist) {
            return res.status(API_RESULTS.ERR_USER_ALREADY_EXISTS.status_code).json({ error: API_RESULTS.ERR_USER_ALREADY_EXISTS.code });
        }

        let default_role = await Role.findOne({ where: { name: DEFAULT_ROLE } })

        const hashedPassword = await bcrypt.hash(password, 10);
        const registerPin = generateAuthPin();
        const user = await User.create({ email, password: hashedPassword, userName, nameLastname, deviceToken, roleId: default_role?.id, authPin: registerPin });

        AuthHistory.create({ userId: user.id, type: 'register', content: 'Utworzenie konta przy rejestracji' })

        // TODO: treść szablonu do wysyłki maila trzeba przenieść gdzieś indziej

        const subject = 'RideClub - Kod aktywacyjny'
        let html = fs.readFileSync(path.join(__dirname, '../emailTemplates/registration.html'), 'utf-8');
        html = html.replace('{registerPin}', registerPin);

        const mailOptions = {
            from: SETTINGS.SMTP.AUTH.USER,
            to: email,
            subject: subject,
            html: html,
        };

        emailClient.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error(error);
                EmailSendHistory.create({ 
                    from: SETTINGS.SMTP.AUTH.USER, 
                    to: email,
                    subject: subject,
                    html: html,
                    status: EMAIL_STATUSES.ERROR,
                    errorLog: JSON.stringify(error)
                })
                res.status(API_RESULTS.ERR_SEND_EMAIL.status_code).json({ error: API_RESULTS.ERR_SEND_EMAIL.code });
            } else {
                console.log('E-mail wysłany: ' + info.response);

                EmailSendHistory.create({ 
                    from: SETTINGS.SMTP.AUTH.USER, 
                    to: email,
                    subject: subject,
                    html: html,
                    status: EMAIL_STATUSES.SUCCESS,
                    errorLog: info.response
                })

                const now = Date.now();
                user.update({ lastEmailSentTime: now })
                user.roleId = default_role
                res.status(API_RESULTS.SUCCESS_USER_REGISTERED.status_code).json({ success: API_RESULTS.SUCCESS_USER_REGISTERED.code, user });
            }
        });
    } catch (error) {
        console.error(error);
        res.status(API_RESULTS.ERR_INTERNAL_SERVER_ERROR.status_code).json({ error: API_RESULTS.ERR_INTERNAL_SERVER_ERROR.code });
    }
}

const activateAccount = async (req, res) => {
    /*
    #swagger.tags = ['Auth']
    #swagger.summary = 'Endpoint do aktywacji konta'

    #swagger.parameters['Device-Token'] = {
        in: 'header',
        required: true
    }

    #swagger.parameters['body'] = {
        in: 'body',
        required: true,
        schema: {
            authPin: "123456",
            email: "john@doe.com"
        }
    }


    #swagger.responses[400] = { 
        description: "Musisz przekazać wszystkie poprawne dane",
        schema: {
            error: 'ERR_PROVIDE_EMAIL_FIELD'
        }  
    }

    #swagger.responses[401] = { 
        description: "Kod do aktywacji konta jest niepoprawny",
        schema: {
            error: 'ERR_WRONG_AUTH_PIN'
        }  
    }

    #swagger.responses[403] = { 
        description: "Brakuje Device-Token w nagłówku lub jest nieprawidłowy",
        schema: {
            error: ['ERR_PROVIDE_DEVICE_TOKEN', 'ERR_WRONG_DEVICE_TOKEN']
        }  
    }

    #swagger.responses[409] = { 
        description: "Konto już jest aktywowane",
        schema: {
            error: 'ERR_USER_IS_ALREADY_ACTIVATED'
        }  
    }

    #swagger.responses[422] = { 
        description: "Nieprawidłowe dane wejściowe",
        schema: {
            error: 'ERR_INVALID_EMAIL_ADDRESS'
        }  
    }

    #swagger.responses[423] = { 
        description: "Logowanie wyłączone",
        schema: {
            error: 'ERR_LOGIN_DISABLED',
            reason: 'Maintenance'
        }  
    }

    #swagger.responses[500] = { 
        description: "Błąd serwerowy",
        schema: {
            error: 'ERR_INTERNAL_SERVER_ERROR'
        }  
    }

    #swagger.responses[200] = { 
        description: "Wszystko poszło GIT",
        schema: { 
            token: 'string',
            refreshToken: 'string',
            user: { $ref: '#/definitions/User' } 
        }  
    }

    */

    saveLogFromEndpointRequest(req)
    const deviceToken = req.header(HEADERS_KEYS.DEVICE_TOKEN);

    if(!deviceToken) {
        return res.status(API_RESULTS.ERR_PROVIDE_DEVICE_TOKEN.status_code).json({ error: API_RESULTS.ERR_PROVIDE_DEVICE_TOKEN.code });
    }

    const isLoginEnabled = await getAppSetting(APP_CONFIGURATION_DEFAULT.LOGIN_ENABLED.key)
    if(!isLoginEnabled) {
        const reason = await getAppSetting(APP_CONFIGURATION_DEFAULT.LOGIN_DISABLED_REASON.key)
        return res.status(API_RESULTS.ERR_LOGIN_DISABLED.status_code).send({ error: API_RESULTS.ERR_LOGIN_DISABLED.code, reason })
    }

    try {
        const { authPin, email } = req.body;

        if (!email) {
            return res.status(API_RESULTS.ERR_PROVIDE_EMAIL_FIELD.status_code).json({ error: API_RESULTS.ERR_PROVIDE_EMAIL_FIELD.code });
        }

        if (!isValidEmail(email)) {
            return res.status(API_RESULTS.ERR_INVALID_EMAIL_ADDRESS.status_code).json({ error: API_RESULTS.ERR_INVALID_EMAIL_ADDRESS.code });
        }

        const user = await User.findOne({ where: { email } });
    
        if (!user) {
          return res.status(API_RESULTS.ERR_WRONG_DEVICE_TOKEN.status_code).json({ error: API_RESULTS.ERR_WRONG_DEVICE_TOKEN.code });
        }

        if(deviceToken !== user.deviceToken) {
            return res.status(API_RESULTS.ERR_WRONG_DEVICE_TOKEN.status_code).json({ error: API_RESULTS.ERR_WRONG_DEVICE_TOKEN.code });
        }

        if(authPin !== user.authPin) {
            return res.status(API_RESULTS.ERR_WRONG_AUTH_PIN.status_code).json({ error: API_RESULTS.ERR_WRONG_AUTH_PIN.code });
        }

        if(user.isActivated) {
            return res.status(API_RESULTS.ERR_USER_IS_ALREADY_ACTIVATED.status_code).json({ error: API_RESULTS.ERR_USER_IS_ALREADY_ACTIVATED.code });
        }

        const newAuthPin = generateAuthPin()
        const loginTokenTTL = await getAppSetting(APP_CONFIGURATION_DEFAULT.LOGIN_TOKEN_LIFE_TIME.key)
        const loginToken = jwt.sign({ userId: user.id }, SETTINGS.JWT_SECRET, { algorithm: SETTINGS.LOGIN_TOKEN.ALGORITHM, expiresIn: loginTokenTTL });
        const refreshTokenTTL = await getAppSetting(APP_CONFIGURATION_DEFAULT.REFRESH_TOKEN_LIFE_TIME.key)
        const refreshToken = jwt.sign({ userId: user.id, deviceToken: deviceToken }, SETTINGS.REFRESH_TOKEN.PRIVATE_KEY, { algorithm: SETTINGS.REFRESH_TOKEN.ALGORITHM, expiresIn: refreshTokenTTL });

        await user.update({ loginToken, isActivated: true, authPin: newAuthPin });
        AuthHistory.create({ userId: user.id, type: 'activate', content: 'Aktywowano konto pinem z maila oraz zwrócono tokeny do logowania' })

        const user_role = await Role.findByPk(user.roleId)
        user.roleId = user_role
        res.json({ token: loginToken, refreshToken, user });

    } catch (error) {
        console.error(error);
        res.status(API_RESULTS.ERR_INTERNAL_SERVER_ERROR.status_code).json({ error: API_RESULTS.ERR_INTERNAL_SERVER_ERROR.code });
    }
}

const resendEmailActivationCode = async (req, res) => {
    /*
    #swagger.tags = ['Auth']
    #swagger.summary = 'Endpoint do ponownej wysyłki maila z PINem aktywacyjnym'

    #swagger.parameters['Device-Token'] = {
        in: 'header',
        required: true
    }

    #swagger.parameters['body'] = {
        in: 'body',
        required: true,
        schema: {
            email: "john@doe.com"
        }
    }

    #swagger.responses[423] = { 
        description: "Logowanie wyłączone",
        schema: {
            error: 'ERR_LOGIN_DISABLED',
            reason: 'Maintenance'
        }  
    }

    #swagger.responses[403] = { 
        description: "Brakuje Device-Token w nagłówku lub jest nieprawidłowy",
        schema: {
            error: ['ERR_PROVIDE_DEVICE_TOKEN', 'ERR_WRONG_DEVICE_TOKEN']
        }  
    }

    #swagger.responses[409] = { 
        description: "Konto już jest aktywowane",
        schema: {
            error: 'ERR_USER_IS_ALREADY_ACTIVATED'
        }  
    }

    #swagger.responses[400] = { 
        description: "Musisz przekazać wszystkie poprawne dane",
        schema: { 
            error: 'ERR_PROVIDE_EMAIL_FIELD'
        }   
    }

    #swagger.responses[422] = { 
        description: "Nieprawidłowe dane wejściowe",
        schema: {
            error: 'ERR_INVALID_EMAIL_ADDRESS'
        }  
    }

    #swagger.responses[429] = { 
        description: "Zbyt dużo rządań o wysyłkę email - można raz na minutę",
        schema: {
            error: 'ERR_EMAIL_SEND_THROTTLE',
            remainingTime: 50000
        }  
    }

    #swagger.responses[503] = { 
        description: "Nie udało się wysłać maila z powodu niedostępności usługi pocztowej",
        schema: {
            error: 'ERR_SEND_EMAIL'
        }  
    }

    #swagger.responses[500] = { 
        description: "Błąd serwerowy",
        schema: {
            error: 'ERR_INTERNAL_SERVER_ERROR'
        }  
    }

    #swagger.responses[200] = { 
        description: "Wszystko poszło GIT",
        schema: { 
            success: 'SUCCESS_RESEND_EMAIL'
        }  
    }

    */

    saveLogFromEndpointRequest(req)
    const deviceToken = req.header(HEADERS_KEYS.DEVICE_TOKEN);

    if(!deviceToken) {
        return res.status(API_RESULTS.ERR_PROVIDE_DEVICE_TOKEN.status_code).json({ error: API_RESULTS.ERR_PROVIDE_DEVICE_TOKEN.code });
    }

    const isLoginEnabled = await getAppSetting(APP_CONFIGURATION_DEFAULT.LOGIN_ENABLED.key)
    if(!isLoginEnabled) {
        const reason = await getAppSetting(APP_CONFIGURATION_DEFAULT.LOGIN_DISABLED_REASON.key)
        return res.status(API_RESULTS.ERR_LOGIN_DISABLED.status_code).send({ error: API_RESULTS.ERR_LOGIN_DISABLED.code, reason })
    }

    try {
        const email = req.body.email;

        if (!email) {
            return res.status(API_RESULTS.ERR_PROVIDE_EMAIL_FIELD.status_code).json({ error: API_RESULTS.ERR_PROVIDE_EMAIL_FIELD.code });
        }

        if (!isValidEmail(email)) {
            return res.status(API_RESULTS.ERR_INVALID_EMAIL_ADDRESS.status_code).json({ error: API_RESULTS.ERR_INVALID_EMAIL_ADDRESS.code });
        }

        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(API_RESULTS.ERR_WRONG_DEVICE_TOKEN.status_code).json({ error: API_RESULTS.ERR_WRONG_DEVICE_TOKEN.code });
        }

        if(deviceToken !== user.deviceToken) {
            return res.status(API_RESULTS.ERR_WRONG_DEVICE_TOKEN.status_code).json({ error: API_RESULTS.ERR_WRONG_DEVICE_TOKEN.code });
        }

        if(user.isActivated) {
            return res.status(API_RESULTS.ERR_USER_IS_ALREADY_ACTIVATED.status_code).json({ error: API_RESULTS.ERR_USER_IS_ALREADY_ACTIVATED.code });
        }

        const now = Date.now();
        const lastEmailSentTime = user.lastEmailSentTime || 0;
        const elapsedTimeSinceLastEmail = now - lastEmailSentTime;

        const time = await getAppSetting(APP_CONFIGURATION_DEFAULT.THROTTLE_TIME_SENDING_EMAILS.key)

        if (elapsedTimeSinceLastEmail < time) {
            return res.status(API_RESULTS.ERR_EMAIL_SEND_THROTTLE.status_code).json({ 
                error: API_RESULTS.ERR_EMAIL_SEND_THROTTLE.code,
                remainingTime: (time - elapsedTimeSinceLastEmail)
            });
        }

        const newAuthPin = generateAuthPin()
        await user.update({ authPin: newAuthPin });
        AuthHistory.create({ userId: user.id, type: 'resend', content: 'Ponownie wysłano maila z pinem do aktywacji konta' })

        const subject = 'RideClub - Kod aktywacyjny'
        let html = fs.readFileSync(path.join(__dirname, '../emailTemplates/resend.html'), 'utf-8');
        html = html.replace('{newAuthPin}', newAuthPin);

        const mailOptions = {
            from: SETTINGS.SMTP.AUTH.USER,
            to: email,
            subject: subject,
            html: html,
        };

        emailClient.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error(error);
                EmailSendHistory.create({ 
                    from: SETTINGS.SMTP.AUTH.USER, 
                    to: email,
                    subject: subject,
                    html: html,
                    status: EMAIL_STATUSES.ERROR,
                    errorLog: JSON.stringify(error)
                })
                res.status(API_RESULTS.ERR_SEND_EMAIL.status_code).json({ error: API_RESULTS.ERR_SEND_EMAIL.code });
            } else {
                console.log('E-mail wysłany ponownie: ' + info.response);

                EmailSendHistory.create({ 
                    from: SETTINGS.SMTP.AUTH.USER, 
                    to: email,
                    subject: subject,
                    html: html,
                    status: EMAIL_STATUSES.SUCCESS,
                    errorLog: info.response
                })

                user.update({ lastEmailSentTime: now })

                res.status(API_RESULTS.SUCCESS_RESEND_EMAIL.status_code).json({ success: API_RESULTS.SUCCESS_RESEND_EMAIL.code, user });
            }
        });
    } catch (error) {
        res.status(API_RESULTS.ERR_INTERNAL_SERVER_ERROR.status_code).json({ error: API_RESULTS.ERR_INTERNAL_SERVER_ERROR.code });
    }
}

const login = async (req, res) => {
    /*
    #swagger.tags = ['Auth']

    #swagger.parameters['Device-Token'] = {
        in: 'header',
        required: true
    }

    #swagger.parameters['body'] = {
        in: 'body',
        required: true,
        schema: {
            email: "john@doe.com",
            password: "secret"
        }
    }

    #swagger.responses[423] = { 
        description: "Logowanie wyłączone",
        schema: {
            error: 'ERR_LOGIN_DISABLED',
            reason: 'Maintenance'
        }  
    }

    #swagger.responses[500] = { 
        description: "Błąd serwerowy",
        schema: {
            error: 'ERR_INTERNAL_SERVER_ERROR'
        }  
    }

    #swagger.responses[200] = { 
        description: "Wszystko poszło GIT",
        schema: { 
            token: 'string',
            refreshToken: 'string',
            user: { $ref: '#/definitions/User' } 
        }  
    }

    #swagger.responses[400] = { 
        description: "Musisz przekazać wszystkie poprawne dane",
        schema: { 
            error: 'ERR_PROVIDE_LOGIN_DATA'
        }   
    }

    #swagger.responses[403] = { 
        description: "Brakuje Device-Token w nagłówku albo user nie jest aktywowany",
        schema: {
            error: ['ERR_PROVIDE_DEVICE_TOKEN', 'ERR_USER_IS_NOT_ACTIVATED']
        }  
    }

    #swagger.responses[422] = { 
        description: "Nieprawidłowe dane wejściowe",
        schema: {
            error: 'ERR_INVALID_EMAIL_ADDRESS'
        }  
    }

    #swagger.responses[401] = { 
        description: "Niepoprawne dane logowania",
        schema: {
            error: 'ERR_BAD_CREDENTIALS'
        }  
    }

    */

    saveLogFromEndpointRequest(req)
    const deviceToken = req.header(HEADERS_KEYS.DEVICE_TOKEN);
    try {
        const email = req.body.email;
        const password = req.body.password;

        if (!email || !password) {
            return res.status(API_RESULTS.ERR_PROVIDE_LOGIN_DATA.status_code).json({ error: API_RESULTS.ERR_PROVIDE_LOGIN_DATA.code });
        }

        if (!isValidEmail(email)) {
            return res.status(API_RESULTS.ERR_INVALID_EMAIL_ADDRESS.status_code).json({ error: API_RESULTS.ERR_INVALID_EMAIL_ADDRESS.code });
        }

        const user = await User.findOne({ where: { email } });
    
        if (!user) {
          return res.status(API_RESULTS.ERR_BAD_CREDENTIALS.status_code).json({ error: API_RESULTS.ERR_BAD_CREDENTIALS.code });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
          return res.status(API_RESULTS.ERR_BAD_CREDENTIALS.status_code).json({ error: API_RESULTS.ERR_BAD_CREDENTIALS.code });
        }

        const user_role = await Role.findByPk(user.roleId)

        // TODO: tutaj też może być luka - chyba trzeba zrobić oddzielny endpoint do logowania do panelu admina
        // konieczne do odświeżania loginToken
        if(!deviceToken && user_role?.short != "admin") {
            return res.status(API_RESULTS.ERR_PROVIDE_DEVICE_TOKEN.status_code).json({ error: API_RESULTS.ERR_PROVIDE_DEVICE_TOKEN.code });
        }

        // admin zawsze może się zalogować, nawet jeśli logowanie jest wyłączone
        if(user_role?.short != "admin") {
            const isLoginEnabled = await getAppSetting(APP_CONFIGURATION_DEFAULT.LOGIN_ENABLED.key)
            if(!isLoginEnabled) {
                const reason = await getAppSetting(APP_CONFIGURATION_DEFAULT.LOGIN_DISABLED_REASON.key)
                return res.status(API_RESULTS.ERR_LOGIN_DISABLED.status_code).send({ error: API_RESULTS.ERR_LOGIN_DISABLED.code, reason })
            }
        }

        if(!user.isActivated) {
            return res.status(API_RESULTS.ERR_USER_IS_NOT_ACTIVATED.status_code).json({ error: API_RESULTS.ERR_USER_IS_NOT_ACTIVATED.code });
        }

        const loginTokenTTL = await getAppSetting(APP_CONFIGURATION_DEFAULT.LOGIN_TOKEN_LIFE_TIME.key)
        const loginToken = jwt.sign({ userId: user.id }, SETTINGS.JWT_SECRET, { algorithm: SETTINGS.LOGIN_TOKEN.ALGORITHM, expiresIn: loginTokenTTL });
        const refreshTokenTTL = await getAppSetting(APP_CONFIGURATION_DEFAULT.REFRESH_TOKEN_LIFE_TIME.key)
        const refreshToken = jwt.sign({ userId: user.id, deviceToken: deviceToken }, SETTINGS.REFRESH_TOKEN.PRIVATE_KEY, { algorithm: SETTINGS.REFRESH_TOKEN.ALGORITHM, expiresIn: refreshTokenTTL });

        // jeśli user jeszcze nie ma role_id (jest nullem), to przy logowaniu od razu przypisujemy domyślną rolę
        if(!user.roleId) {
            const default_role = await Role.findOne({ where: { name: DEFAULT_ROLE } })
            if(default_role) {
                user.update({ roleId: default_role.id })
            }
        }

        if(!deviceToken) {
            await user.update({ loginToken });
        } else {
            await user.update({ loginToken, deviceToken });
        }

        user.roleId = user_role
    
        AuthHistory.create({ userId: user.id, type: 'login', content: 'Pomyślnie zalogowano' })
        res.json({ token: loginToken, refreshToken, user });
    } catch (error) {
        console.error(error);
        res.status(API_RESULTS.ERR_INTERNAL_SERVER_ERROR.status_code).json({ error: API_RESULTS.ERR_INTERNAL_SERVER_ERROR.code });
    }
}

const refreshLoginToken = async (req, res) => {
    /* 
    #swagger.tags = ['Auth']

    
    #swagger.security = [{
        TokenAuth: []
    }]

    #swagger.responses[400] = { 
        description: "Musisz dostarczyć Token w nagłówku",
        schema: {
            error: ['ERR_PROVIDE_LOGIN_TOKEN', 'ERR_PROVIDE_REFRESH_TOKEN']
        }  
    }

    #swagger.parameters['Refresh-Token'] = {
        in: 'header',
        required: true
    }

    #swagger.parameters['Device-Token'] = {
        in: 'header',
        required: true
    }

    #swagger.responses[404] = { 
        description: "Udało się zdekodować Token z nagłówka, ale user_id w nim zakodowany nie istnieje w bazie",
        schema: {
            error: 'ERR_USER_FROM_TOKEN_NOT_EXISTS'
        }  
    }

    #swagger.responses[403] = { 
        description: "Brakuje Device-Token w nagłówku lub jest nieprawidłowy",
        schema: {
            error: ['ERR_PROVIDE_DEVICE_TOKEN', 'ERR_WRONG_DEVICE_TOKEN']
        }  
    }

    #swagger.responses[401] = { 
        description: "Refresh-Token wygasł",
        schema: {
            error: 'ERR_REFRESH_TOKEN_EXPIRED'
        }  
    }

    #swagger.responses[423] = { 
        description: "Logowanie wyłączone",
        schema: {
            error: 'ERR_LOGIN_DISABLED',
            reason: 'Maintenance'
        }  
    }

    #swagger.responses[500] = { 
        description: "Błąd serwerowy",
        schema: {
            error: 'ERR_INTERNAL_SERVER_ERROR'
        }  
    }

    #swagger.responses[200] = { 
        description: "Wszystko poszło GIT",
        schema: { 
            token: 'string'
        }  
    }

    */

    saveLogFromEndpointRequest(req)
    const token = req.header(HEADERS_KEYS.LOGIN_TOKEN);
    const refreshToken = req.header(HEADERS_KEYS.REFRESH_TOKEN);
    const deviceToken = req.header(HEADERS_KEYS.DEVICE_TOKEN);

    if (!token) {
        return res.status(API_RESULTS.ERR_PROVIDE_LOGIN_TOKEN.status_code).json({ error: API_RESULTS.ERR_PROVIDE_LOGIN_TOKEN.code });
    }

    if(!refreshToken) {
        return res.status(API_RESULTS.ERR_PROVIDE_REFRESH_TOKEN.status_code).json({ error: API_RESULTS.ERR_PROVIDE_REFRESH_TOKEN.code });
    }

    try {
        const decodedRefreshToken = jwt.verify(refreshToken, SETTINGS.REFRESH_TOKEN.PUBLIC_KEY, { algorithms: SETTINGS.REFRESH_TOKEN.ALGORITHM });

        const user = await User.findByPk(decodedRefreshToken.userId);

        if (!user) {
            return res.status(API_RESULTS.ERR_USER_FROM_TOKEN_NOT_EXISTS.status_code).json({ error: API_RESULTS.ERR_USER_FROM_TOKEN_NOT_EXISTS.code });
        }

        // to nie jest dobre, ponieważ loginToken nie jest odświeżany wewnątrz refreshTokena - czyli refreshToken działałby tylko dla jednego odświeżenia, a przy drugim requeście już byłby wygasły
        /*
        if(user.loginToken !== decodedRefreshToken.loginToken) {
            res.status(API_RESULTS.ERR_REFRESH_TOKEN_EXPIRED.status_code).json({ error: API_RESULTS.ERR_REFRESH_TOKEN_EXPIRED.code });
        }
        */

        // jeśli loginToken tego usera został wyczyszczony (np. przez globalne wylogowanie)
        if(!user.loginToken) {
            // tutaj nie ma po co czyścić loginToken - i tak jest nullem
            AuthHistory.create({ userId: user.id, type: 'logout', content: 'Refresh-Token wygasł - wylogowano - !user.loginToken' })
            return res.status(API_RESULTS.ERR_REFRESH_TOKEN_EXPIRED.status_code).json({ error: API_RESULTS.ERR_REFRESH_TOKEN_EXPIRED.code });
        }

        // jeśli zapisany w bazie ostatni loginToken jest inny od tego przekazanego z żądaniem o odświeżenie tokena
        if(user.loginToken !== token) {
            // tutaj nie powinniśmy czyścić loginToken, może być sytuacja że ktoś użyje starego (ale jeszcze ważnego) refreshToken + jakiś randomowy token w celu ataku
            AuthHistory.create({ userId: user.id, type: 'logout', content: 'Refresh-Token wygasł - wylogowano - user.loginToken !== token' })
            return res.status(API_RESULTS.ERR_REFRESH_TOKEN_EXPIRED.status_code).json({ error: API_RESULTS.ERR_REFRESH_TOKEN_EXPIRED.code });
        }

        const user_role = await Role.findByPk(user.roleId)

        // ominięcie deviceToken jeśli token odświeża admin
        if(user_role?.short != "admin") {
            if(!deviceToken) {
                return res.status(API_RESULTS.ERR_PROVIDE_DEVICE_TOKEN.status_code).json({ error: API_RESULTS.ERR_PROVIDE_DEVICE_TOKEN.code });
            }

            if(deviceToken !== user.deviceToken
                || decodedRefreshToken.deviceToken !== user.deviceToken 
                || decodedRefreshToken.deviceToken !== deviceToken) {
                return res.status(API_RESULTS.ERR_WRONG_DEVICE_TOKEN.status_code).json({ error: API_RESULTS.ERR_WRONG_DEVICE_TOKEN.code });
            }
        }

        // admin zawsze może odświeżyć token, nawet jeśli logowanie jest wyłączone
        if(user_role?.short != "admin") {
            const isLoginEnabled = await getAppSetting(APP_CONFIGURATION_DEFAULT.LOGIN_ENABLED.key)
            if(!isLoginEnabled) {
                const reason = await getAppSetting(APP_CONFIGURATION_DEFAULT.LOGIN_DISABLED_REASON.key)
                return res.status(API_RESULTS.ERR_LOGIN_DISABLED.status_code).send({ error: API_RESULTS.ERR_LOGIN_DISABLED.code, reason })
            }
        }

        if(!user.isActivated) {
            AuthHistory.create({ userId: user.id, type: 'logout', content: 'użytkownik nie jest aktywowany - wylogowano - !user.isActivated' })
            return res.status(API_RESULTS.ERR_REFRESH_TOKEN_EXPIRED.status_code).json({ error: API_RESULTS.ERR_REFRESH_TOKEN_EXPIRED.code });
        }

        const loginTokenTTL = await getAppSetting(APP_CONFIGURATION_DEFAULT.LOGIN_TOKEN_LIFE_TIME.key)
        const newToken = jwt.sign({ userId: user.id }, SETTINGS.JWT_SECRET, { algorithm: SETTINGS.LOGIN_TOKEN.ALGORITHM, expiresIn: loginTokenTTL });

        await user.update({ loginToken: newToken });

        res.json({ token: newToken });
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            // jeśli refreshToken wygasł to wylogowujemy usera w apce

            const user = await User.findOne({ where: { loginToken: token } });

            if(user) {
                user.update({ loginToken: null });
                AuthHistory.create({ userId: user.id, type: 'logout', content: 'Refresh-Token wygasł - wylogowano - wyczyszczno loginToken' })
                // TODO: tutaj prawdopodobnie trzeba będzie wygenerować nowy token i refreshToken (bo stary przekazany token się zgadza z ostatnim zapisanym)
                
            } else {
                // tutaj nie możemy zapisać, bo nie znamy user.id
                // AuthHistory.create({ userId: user.id, type: 'logout', content: 'Refresh-Token wygasł - wylogowano - nie udało się wyczyścić loginToken' })
            }

            // tutaj nie jesteśmy w stanie wyczyścić loginToken usera, bo nie wiemy do kogo należał ten wygaśnięty refreshToken
            res.status(API_RESULTS.ERR_REFRESH_TOKEN_EXPIRED.status_code).json({ error: API_RESULTS.ERR_REFRESH_TOKEN_EXPIRED.code });
        } else {
            console.error(error);
            res.status(API_RESULTS.ERR_INTERNAL_SERVER_ERROR.status_code).json({ error: API_RESULTS.ERR_INTERNAL_SERVER_ERROR.code });
        }
    } 
}

const logout = async (req, res) => {
    /*
    #swagger.tags = ['Auth']

    #swagger.security = [{
        TokenAuth: []
    }]

    #swagger.responses[400] = { 
        description: "Musisz dostarczyć Token w nagłówku",
        schema: {
            error: 'ERR_PROVIDE_LOGIN_TOKEN'
        }  
    }

    #swagger.responses[401] = { 
        description: "Token logowania wygasł lub jest niepoprawny",
        schema: {
            error: ['ERR_TOKEN_EXPIRED', 'ERR_VERIFY_TOKEN']
        }  
    }

    #swagger.responses[404] = { 
        description: "Udało się zdekodować Token z nagłówka, ale user_id w nim zakodowany nie istnieje w bazie",
        schema: {
            error: 'ERR_USER_FROM_TOKEN_NOT_EXISTS'
        }  
    }

    #swagger.responses[200] = { 
        description: "Wszystko poszło GIT",
        schema: { 
            success: 'SUCCESS_LOGOUT'
        }  
    }

    #swagger.responses[500] = { 
        description: "Błąd serwerowy",
        schema: {
            error: 'ERR_INTERNAL_SERVER_ERROR'
        }  
    }

    */

    saveLogFromEndpointRequest(req)
    const token = req.header(HEADERS_KEYS.LOGIN_TOKEN);

    if (!token) {
        return res.status(API_RESULTS.ERR_PROVIDE_LOGIN_TOKEN.status_code).json({ error: API_RESULTS.ERR_PROVIDE_LOGIN_TOKEN.code });
    }

    // TODO: jeśli token będzie wygaśnięty, to nie będzie się dało go wyzerować w bazie danych
    // W takiej sytuacji token zostanie odświeżony przy użyciu refreshToken i ponownie zostanie wykonany request do /logout
    // Ale jeśli refreshToken również będzie wygaśnięty to co w takiej sytuacji?
    // Użytkownik w apce po prostu zostanie wylogowany, wyczyszczony będzie localStorage z tokenów
    // Ale zamiast tego może zróbmy jeszcze raz request do tego endpointa, tylko z przekazanym userId w body requesta? const { userId } = req.body;
    // Mimo tego że tokeny byłyby wygaśnięte, to w pamięci apki powinien być gdzieś zapisany zalogowany userId ?
    // Jeśli udałoby się tutaj w takiej sytuacji przekazać userId w body requesta, to wtedy mógłbym wyzerować loginToken w bazie danych tego użytkownika
    // Ale nie możemy wyzerować loginToken tylko na podstawie przekazanego userId w body requesta - to będzie niebezpieczne. Musimy przekazać coś jeszcze... może deviceToken, ewentualnie przekazać też ostatni zapisany token do logowania i oczekiwać, że będzie on taki sam jak zapisany w bazie danych? 
    // user.update({ loginToken: null });
    // res.status(API_RESULTS.SUCCESS_LOGOUT.status_code).json({ success: API_RESULTS.SUCCESS_LOGOUT.code, user });

    try {
        const decoded = jwt.verify(token, SETTINGS.JWT_SECRET, { algorithms: SETTINGS.LOGIN_TOKEN.ALGORITHM });
        const user = await User.findByPk(decoded.userId);

        if (!user) {
            return res.status(API_RESULTS.ERR_USER_FROM_TOKEN_NOT_EXISTS.status_code).json({ error: API_RESULTS.ERR_USER_FROM_TOKEN_NOT_EXISTS.code });
        }

        // tutaj można jeszcze sprawdzić, czy token == user.loginToken , ale może nie będzie to konieczne

        // bez await, bo odpowiedź API nie musi czekać na aktualizację w bazie danych
        user.update({ loginToken: null });
        AuthHistory.create({ userId: user.id, type: 'logout', content: 'Pomyślnie wylogowano' })
        res.status(API_RESULTS.SUCCESS_LOGOUT.status_code).json({ success: API_RESULTS.SUCCESS_LOGOUT.code });

    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            const user = await User.findOne({ where: { loginToken: token } });

            if(user) {
                user.update({ loginToken: null });
                AuthHistory.create({ userId: user.id, type: 'logout', content: 'Pomyślnie wylogowano' })
                res.status(API_RESULTS.SUCCESS_LOGOUT.status_code).json({ success: API_RESULTS.SUCCESS_LOGOUT.code });
            } else {
                // tutaj nie jesteśmy w stanie wyczyścić loginToken usera, bo nie wiemy do kogo należał ten wygaśnięty token i nie znaleziono go w bazie
                return res.status(API_RESULTS.ERR_TOKEN_EXPIRED.status_code).json({ error: API_RESULTS.ERR_TOKEN_EXPIRED.code });   
            } 
        } else if (error instanceof jwt.JsonWebTokenError) {
            console.error(error);
            res.status(API_RESULTS.ERR_VERIFY_TOKEN.status_code).json({ error: API_RESULTS.ERR_VERIFY_TOKEN.code });
        } else {
            console.error(error);
            res.status(API_RESULTS.ERR_INTERNAL_SERVER_ERROR.status_code).json({ error: API_RESULTS.ERR_INTERNAL_SERVER_ERROR.code });
        }
    }
}

module.exports = { register, activateAccount, resendEmailActivationCode, login, refreshLoginToken, logout }