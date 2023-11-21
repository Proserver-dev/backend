const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/UserModel');
const Role = require('../models/RoleModel');
const AuthHistory = require('../models/AuthHistory')
const EmailSendHistory = require('../models/EmailSendHistoryModel')
const { saveLogFromEndpointRequest } = require('../functions');
const isValidEmail = require('../utils/isValidEmail')
const generateAuthPin = require('../utils/generateAuthPin')
const API_RESULTS = require('../constants/apiResults');
const emailClient = require('../utils/emailClient')
const { SETTINGS } = require('../../settings');
const EMAIL_STATUSES = require('../constants/emailStatuses');

const userChangePassword = async (req, res) => {
    /*
    #swagger.tags = ['Admin']
    #swagger.summary = 'tylko dla admina'

    #swagger.security = [{
        TokenAuth: []
    }]

    #swagger.responses[500] = { 
        description: "Błąd serwerowy",
        schema: {
            error: 'ERR_INTERNAL_SERVER_ERROR'
        }  
    }

    #swagger.responses[404] = { 
        description: "User nie istnieje",
        schema: {
            error: 'ERR_USER_NOT_EXISTS'
        }  
    }

    #swagger.responses[400] = { 
        description: "Musisz przekazać hasło",
        schema: {
            error: 'ERR_PROVIDE_PASSWORD_FIELD'
        }  
    }

    #swagger.responses[200] = { 
        description: "Wszystko poszło GIT",
        schema: {
            success: 'SUCCESS_CHANGE_PASSWORD'
        }  
    }

    */

    saveLogFromEndpointRequest(req);
    try {
        const user_id = req.params.userId
        const new_password = req.body.password

        if (!new_password) {
            return res.status(API_RESULTS.ERR_PROVIDE_PASSWORD_FIELD.status_code).json({ error: API_RESULTS.ERR_PROVIDE_PASSWORD_FIELD.code });
        }

        // TODO: tutaj może jeszcze sprawdzać, czy hasło nie jest zbyt proste

        const user = await User.findByPk(user_id)

        if(!user) {
            return res.status(API_RESULTS.ERR_USER_NOT_EXISTS.status_code).json({ error: API_RESULTS.ERR_USER_NOT_EXISTS.code });
        }

        const hashedPassword = await bcrypt.hash(new_password, 10);

        await user.update({ password: hashedPassword, loginToken: null });

        res.status(API_RESULTS.SUCCESS_CHANGE_PASSWORD.status_code).json({ success: API_RESULTS.SUCCESS_CHANGE_PASSWORD.code });
    } catch (error) {
        console.log(error)
        res.status(API_RESULTS.ERR_INTERNAL_SERVER_ERROR.status_code).json({ error: API_RESULTS.ERR_INTERNAL_SERVER_ERROR.code });
    }
}

const userChangeRole = async (req, res) => {
    /*
    #swagger.tags = ['Admin']
    #swagger.summary = 'tylko dla admina'

    #swagger.security = [{
        TokenAuth: []
    }]

    #swagger.responses[403] = { 
        description: "Nie możesz sobie samemu zmienić roli albo nie masz uprawnień",
        schema: {
            error: ['ERR_CANNOT_CHANGE_SELF_ROLE', 'ERR_ADMIN_PRIVILEGES_REQUIRED']
        }  
    }

    #swagger.responses[404] = { 
        description: "User albo rola nie istnieje",
        schema: {
            error: ['ERR_USER_FROM_TOKEN_NOT_EXISTS', 'ERR_USER_NOT_EXISTS', 'ERR_ROLE_NOT_EXISTS']
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
            success: 'SUCCESS_EDIT_ROLE'
        }  
    }

    */

    saveLogFromEndpointRequest(req);
    try {
        const user_id = req.params.userId
        const role_id = req.body.roleId

        const user = await User.findByPk(user_id)

        if(!user) {
            return res.status(API_RESULTS.ERR_USER_NOT_EXISTS.status_code).json({ error: API_RESULTS.ERR_USER_NOT_EXISTS.code });
        }

        if(req.user.id === user.id) {
            return res.status(API_RESULTS.ERR_CANNOT_CHANGE_SELF_ROLE.status_code).json({ error: API_RESULTS.ERR_CANNOT_CHANGE_SELF_ROLE.code })
        }

        const role = await Role.findByPk(role_id)

        if(!role) {
            return res.status(API_RESULTS.ERR_ROLE_NOT_EXISTS.status_code).json({ error: API_RESULTS.ERR_ROLE_NOT_EXISTS.code });
        }

        await user.update({ roleId: role.id });

        res.status(API_RESULTS.SUCCESS_EDIT_ROLE.status_code).json({ success: API_RESULTS.SUCCESS_EDIT_ROLE.code });

    } catch (error) {
        console.log(error)
        res.status(API_RESULTS.ERR_INTERNAL_SERVER_ERROR.status_code).json({ error: API_RESULTS.ERR_INTERNAL_SERVER_ERROR.code });
    }
}

const createNewAccount = async (req, res) => {
    /*
    #swagger.tags = ['Admin']
    #swagger.summary = 'tylko dla admina'

    #swagger.security = [{
        TokenAuth: []
    }]

    #swagger.parameters['body'] = {
        in: 'body',
        required: true,
        schema: {
            email: "john@doe.com",
            password: "secret",
            userName: "johndoe123",
            nameLastname: "John Doe",
            roleId: 2,
            isActivated: true,
            sendEmail: false
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

    #swagger.responses[400] = { 
        description: "Musisz przekazać wszystkie poprawne dane",
        schema: {
            error: ['ERR_PROVIDE_EMAIL_FIELD', 'ERR_PROVIDE_PASSWORD_FIELD']
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

    saveLogFromEndpointRequest(req);
    try {
        const { email, password, userName, nameLastname, roleId, isActivated, sendEmail } = req.body;

        if (!email) {
            return res.status(API_RESULTS.ERR_PROVIDE_EMAIL_FIELD.status_code).json({ error: API_RESULTS.ERR_PROVIDE_EMAIL_FIELD.code });
        }

        if (!isValidEmail(email)) {
            return res.status(API_RESULTS.ERR_INVALID_EMAIL_ADDRESS.status_code).json({ error: API_RESULTS.ERR_INVALID_EMAIL_ADDRESS.code });
        }

        if (!password) {
            return res.status(API_RESULTS.ERR_PROVIDE_PASSWORD_FIELD.status_code).json({ error: API_RESULTS.ERR_PROVIDE_PASSWORD_FIELD.code });
        }

        // TODO: tutaj może jeszcze sprawdzać, czy hasło nie jest zbyt proste

        const userExist = await User.findOne({ where: { email } });

        if (userExist) {
            return res.status(API_RESULTS.ERR_USER_ALREADY_EXISTS.status_code).json({ error: API_RESULTS.ERR_USER_ALREADY_EXISTS.code });
        }

        const role = await Role.findByPk(roleId)

        if(!role) {
            return res.status(API_RESULTS.ERR_ROLE_NOT_EXISTS.status_code).json({ error: API_RESULTS.ERR_ROLE_NOT_EXISTS.code });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const registerPin = generateAuthPin();
        const user = await User.create({ 
            email, 
            password: hashedPassword, 
            userName, 
            nameLastname,
            roleId: role?.id, 
            authPin: registerPin,
            isActivated
        });

        AuthHistory.create({ userId: user.id, type: 'register', content: 'Utworzenie konta przez administratora' })


        if(sendEmail) {
            let html = `<p>Login: ${email}</p>`
            html += `<p>Hasło: ${password}</p>`

            if(!user.isActivated) {
                html += `<p>Twój kod aktywacyjny: <strong>${registerPin}</strong></p>`
            }

            const subject = 'RideClub - dane dostępowe'

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
                    user.roleId = role
                    res.status(API_RESULTS.SUCCESS_USER_REGISTERED.status_code).json({ success: API_RESULTS.SUCCESS_USER_REGISTERED.code, user });
                }
            });
        } else {
            user.roleId = role
            res.status(API_RESULTS.SUCCESS_USER_REGISTERED.status_code).json({ success: API_RESULTS.SUCCESS_USER_REGISTERED.code, user });
        }



    } catch (error) {
        console.log(error)
        res.status(API_RESULTS.ERR_INTERNAL_SERVER_ERROR.status_code).json({ error: API_RESULTS.ERR_INTERNAL_SERVER_ERROR.code });
    }  
}

const changeIsActivated = async (req, res) => {
    /*
    #swagger.tags = ['Admin']
    #swagger.summary = 'tylko dla admina'

    #swagger.security = [{
        TokenAuth: []
    }]

    #swagger.responses[404] = { 
        description: "User nie istnieje",
        schema: {
            error: ['ERR_USER_FROM_TOKEN_NOT_EXISTS', 'ERR_USER_NOT_EXISTS']
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
            success: ['SUCCESS_USER_ACTIVATED', 'SUCCESS_USER_DEACTIVATED'],
            user: { $ref: '#/definitions/User' } 
        }  
    }

    */

    saveLogFromEndpointRequest(req);
    try {
        const user_id = req.params.userId

        const user = await User.findByPk(user_id)

        if(!user) {
            return res.status(API_RESULTS.ERR_USER_NOT_EXISTS.status_code).json({ error: API_RESULTS.ERR_USER_NOT_EXISTS.code });
        }

        if(req.user.id === user.id) {
            return res.status(API_RESULTS.ERR_CANNOT_CHANGE_SELF_ACTIVATION.status_code).json({ error: API_RESULTS.ERR_CANNOT_CHANGE_SELF_ACTIVATION.code })
        }

        if(user.isActivated) {
            await user.update({ isActivated: false });
            res.status(API_RESULTS.SUCCESS_USER_DEACTIVATED.status_code).json({ success: API_RESULTS.SUCCESS_USER_DEACTIVATED.code, user });
        } else {
            await user.update({ isActivated: true });
            res.status(API_RESULTS.SUCCESS_USER_ACTIVATED.status_code).json({ success: API_RESULTS.SUCCESS_USER_ACTIVATED.code, user });
        }

    } catch (error) {
        console.log(error)
        res.status(API_RESULTS.ERR_INTERNAL_SERVER_ERROR.status_code).json({ error: API_RESULTS.ERR_INTERNAL_SERVER_ERROR.code });
    } 
}

module.exports = { userChangePassword, userChangeRole, createNewAccount, changeIsActivated }
