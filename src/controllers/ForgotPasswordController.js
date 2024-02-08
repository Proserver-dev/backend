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

const forgotPasswordMain = async (req, res) => {
    /*
    #swagger.tags = ['Forgot-password']
    #swagger.summary = 'Endpoint do przekazania maila w celu resetu hasła'

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
        AuthHistory.create({ userId: user.id, type: 'forgot', content: 'Wysłano maila z pinem do resetu hasła' })


        const subject = 'RideClub - Kod aktywacyjny'
        let html = fs.readFileSync(path.join(__dirname, '../emailTemplates/forgot.html'), 'utf-8');
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
                EmailSendHistory.create({ 
                    from: SETTINGS.SMTP.AUTH.USER, 
                    to: email,
                    subject: subject,
                    html: html,
                    status: EMAIL_STATUSES.SUCCESS,
                    errorLog: info.response
                })

                user.update({ lastEmailSentTime: now })

                res.status(API_RESULTS.SUCCESS_SEND_EMAIL_FORGOT_PASSWORD.status_code).json({ success: API_RESULTS.SUCCESS_SEND_EMAIL_FORGOT_PASSWORD.code, user });
            }
        });


    } catch (error) {
        res.status(API_RESULTS.ERR_INTERNAL_SERVER_ERROR.status_code).json({ error: API_RESULTS.ERR_INTERNAL_SERVER_ERROR.code });
    }
}

const forgotPasswordCheckPin = async (req, res) => {
    /*
    #swagger.tags = ['Forgot-password']
    #swagger.summary = 'Endpoint do sprawdzenia PINu w celu resetu hasła. Jeśli się zgadza, to można przekierować usera do kolejnego widoku z formularzem do zmiany hasła'

    #swagger.parameters['Device-Token'] = {
        in: 'header',
        required: true
    }

    #swagger.parameters['body'] = {
        in: 'body',
        required: true,
        schema: {
            email: "john@doe.com",
            authPin: "123456"
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

    #swagger.responses[401] = { 
        description: "Kod do resetu hasła jest niepoprawny",
        schema: {
            error: 'ERR_WRONG_AUTH_PIN'
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
            success: 'SUCCESS_CHECK_PIN'
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
        const authPin = req.body.authPin;

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

        res.status(API_RESULTS.SUCCESS_CHECK_PIN.status_code).json({ success: API_RESULTS.SUCCESS_CHECK_PIN.code });

    } catch (error) {
        res.status(API_RESULTS.ERR_INTERNAL_SERVER_ERROR.status_code).json({ error: API_RESULTS.ERR_INTERNAL_SERVER_ERROR.code });
    }

}

const forgotPasswordChangePassword = async (req, res) => {
    /*
    #swagger.tags = ['Forgot-password']
    #swagger.summary = 'Endpoint do zmiany hasła z funkcji przypomnij hasło'

    #swagger.parameters['Device-Token'] = {
        in: 'header',
        required: true
    }

    #swagger.parameters['body'] = {
        in: 'body',
        required: true,
        schema: {
            email: "john@doe.com",
            authPin: "123456",
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

    #swagger.responses[403] = { 
        description: "Brakuje Device-Token w nagłówku lub jest nieprawidłowy",
        schema: {
            error: ['ERR_PROVIDE_DEVICE_TOKEN', 'ERR_WRONG_DEVICE_TOKEN']
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

    #swagger.responses[401] = { 
        description: "Kod do resetu hasła jest niepoprawny",
        schema: {
            error: 'ERR_WRONG_AUTH_PIN'
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
            success: 'SUCCESS_CHANGE_PASSWORD'
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
        const authPin = req.body.authPin;
        const password = req.body.password;

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

        const hashedPassword = await bcrypt.hash(password, 10);
        const newPin = generateAuthPin();

        await user.update({ password: hashedPassword, authPin: newPin });
        AuthHistory.create({ userId: user.id, type: 'forgot', content: 'Pomyślnie zmieniono hasło za pomocą funkcji przypomnij hasło' })

        res.status(API_RESULTS.SUCCESS_CHANGE_PASSWORD.status_code).json({ success: API_RESULTS.SUCCESS_CHANGE_PASSWORD.code });

    } catch (error) {
        res.status(API_RESULTS.ERR_INTERNAL_SERVER_ERROR.status_code).json({ error: API_RESULTS.ERR_INTERNAL_SERVER_ERROR.code });
    }
}

module.exports = { forgotPasswordMain, forgotPasswordCheckPin, forgotPasswordChangePassword }