const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/UserModel');
const Role = require('../models/RoleModel');
const { saveLogFromEndpointRequest } = require('../functions');
const API_RESULTS = require('../constants/apiResults');

const userChangePassword = async (req, res) => {
    /*
    #swagger.tags = ['Admin']
    #swagger.summary = 'tylko dla admina'

    #swagger.parameters['Token'] = {
        in: 'header',
        required: true
    }

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

        const hashedPassword = await bcrypt.hash(password, 10);

        await user.update({ password: hashedPassword, loginToken: null });

        res.status(API_RESULTS.SUCCESS_CHANGE_PASSWORD.status_code).json({ success: API_RESULTS.SUCCESS_CHANGE_PASSWORD.code });
    } catch (error) {
        res.status(API_RESULTS.ERR_INTERNAL_SERVER_ERROR.status_code).json({ error: API_RESULTS.ERR_INTERNAL_SERVER_ERROR.code });
    }
}

const userChangeRole = async (req, res) => {
    /*
    #swagger.tags = ['Admin']
    #swagger.summary = 'tylko dla admina'

    #swagger.parameters['Token'] = {
        in: 'header',
        required: true
    }

    #swagger.responses[403] = { 
        description: "Nie możesz sobie samemu zmienić roli albo nie masz uprawnień",
        schema: {
            error: ['ERR_CANNOT_CHANGE_SELF_ROLE', 'ERR_ADMIN_PRIVILEGES_REQUIRED']
        }  
    }

    #swagger.responses[404] = { 
        description: "User albo rola nie istnieje",
        schema: {
            error: ['ERR_USER_NOT_EXISTS', 'ERR_ROLE_NOT_EXISTS']
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
        res.status(API_RESULTS.ERR_INTERNAL_SERVER_ERROR.status_code).json({ error: API_RESULTS.ERR_INTERNAL_SERVER_ERROR.code });
    }
}

module.exports = { userChangePassword, userChangeRole }