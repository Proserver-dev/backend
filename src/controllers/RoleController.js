const { ROLE_BLOCKED } = require('../constants/roleBlocked')
const Role = require('../models/RoleModel')
const API_RESULTS = require('../constants/apiResults')
const { saveLogFromEndpointRequest } = require('../functions');

/// Middleware do generowania sluga z nazwy
const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/\s/g, '-') // Zamienia spacje na myślniki
      .replace(/[^a-z0-9-]/g, ''); // Usuwa znaki specjalne
};
  
/// Middleware do sprawdzania, czy rola jest zablokowana
const isRoleBlocked = (name) => {
    return ROLE_BLOCKED.includes(name);
};

/// Middleware do sprawdzania, czy wartość "short" jest unikalna
const isShortFieldUnique = async (short, id) => {
    const existingRole = await Role.findOne({ where: { short } });
    return !existingRole || (id && existingRole.id === id);
};

const getRoles = async (req, res) => {
    /*
    #swagger.tags = ['Roles']
    #swagger.summary = 'tylko dla admina'

    #swagger.security = [{
        TokenAuth: []
    }]

    #swagger.responses[200] = {
        description: 'Wszystko poszło GIT',
        schema: [ { $ref: '#/definitions/Role' } ]
    }

    #swagger.responses[500] = {
        description: 'Błąd serwerowy',
        schema: { error: 'ERR_INTERNAL_SERVER_ERROR' }
    }

    */

    saveLogFromEndpointRequest(req)

    try {
        const roles = await Role.findAll();
        res.json(roles);
    } catch (error) {
        res.status(API_RESULTS.ERR_INTERNAL_SERVER_ERROR.status_code).json({ error: API_RESULTS.ERR_INTERNAL_SERVER_ERROR.code });
    } 
}

const getOneRole = async (req, res) => {
    /*
    #swagger.tags = ['Roles']
    #swagger.summary = 'tylko dla admina'

    #swagger.security = [{
        TokenAuth: []
    }]

    #swagger.responses[200] = {
        description: 'Wszystko poszło GIT',
        schema: { $ref: '#/definitions/Role' }
    }

    #swagger.responses[500] = {
        description: 'Błąd serwerowy',
        schema: { error: 'ERR_INTERNAL_SERVER_ERROR' }
    }

    */

    saveLogFromEndpointRequest(req)
    try {
        if(req.params.id) {
            const role = await Role.findByPk(req.params.id)
            if(role) {
                return res.json(role)
            } else {
                return res.json({})
            }
        }
    } catch (error) {
        res.status(API_RESULTS.ERR_INTERNAL_SERVER_ERROR.status_code).json({ error: API_RESULTS.ERR_INTERNAL_SERVER_ERROR.code });
    } 
}

const addRole = async (req, res) => {
    /*
    #swagger.tags = ['Roles']
    #swagger.summary = 'tylko dla admina'

    #swagger.security = [{
        TokenAuth: []
    }]

    #swagger.parameters['body'] = {
        in: 'body',
        required: true,
        schema: {
            name: "Testowa rola"
        }
    }

    #swagger.responses[400] = { 
        description: "Musisz przekazać nazwę roli - pole name",
        schema: {
            error: ['ERR_PROVIDE_NAME_FIELD', 'ERR_PROVIDE_LOGIN_TOKEN']
        }  
    }

    #swagger.responses[403] = { 
        description: "Nazwa roli jest zarezerwowana albo nie masz uprawnień",
        schema: {
            error: ['ERR_ROLE_NAME_IS_RESERVED', 'ERR_ADMIN_PRIVILEGES_REQUIRED']
        }  
    }

    #swagger.responses[409] = { 
        description: "Taka rola już istnieje",
        schema: {
            error: 'ERR_ROLE_ALREADY_EXISTS'
        }  
    }

    #swagger.responses[201] = {
        description: 'Wszystko poszło GIT',
        schema: { 
            success: 'SUCCESS_CREATED_ROLE',
            role: { $ref: '#/definitions/Role' }
        }
    }

    #swagger.responses[500] = {
        description: 'Błąd serwerowy',
        schema: { error: 'ERR_INTERNAL_SERVER_ERROR' }
    }

    */

    saveLogFromEndpointRequest(req)
  
    try {
        const name = req.body.name;
        const short = generateSlug(name);
    
        if(!name) {
            return res.status(API_RESULTS.ERR_PROVIDE_NAME_FIELD.status_code).json({ error: API_RESULTS.ERR_PROVIDE_NAME_FIELD.code });
        }
      
        if (isRoleBlocked(name)) {
            return res.status(API_RESULTS.ERR_ROLE_NAME_IS_RESERVED.status_code).json({ error: API_RESULTS.ERR_ROLE_NAME_IS_RESERVED.code });
        }
    
        if (!(await isShortFieldUnique(short))) {
            return res.status(API_RESULTS.ERR_ROLE_ALREADY_EXISTS.status_code).json({ error: API_RESULTS.ERR_ROLE_ALREADY_EXISTS.code });
        }

        const role = await Role.create({ name, short });
        res.status(API_RESULTS.SUCCESS_CREATED_ROLE.status_code).json({ success: API_RESULTS.SUCCESS_CREATED_ROLE.code, role });
    } catch (error) {
        res.status(API_RESULTS.ERR_INTERNAL_SERVER_ERROR.status_code).json({ error: API_RESULTS.ERR_INTERNAL_SERVER_ERROR.code });
    }
}

const editRole = async (req, res) => {
    /*
    #swagger.tags = ['Roles']
    #swagger.summary = 'tylko dla admina'

    #swagger.security = [{
        TokenAuth: []
    }]

    #swagger.responses[400] = { 
        description: "Musisz przekazać nazwę roli - pole name",
        schema: {
            error: ['ERR_PROVIDE_NAME_FIELD', 'ERR_PROVIDE_LOGIN_TOKEN']
        }  
    }

    #swagger.responses[403] = { 
        description: "Nazwa roli jest zarezerwowana albo nie masz uprawnień",
        schema: {
            error: ['ERR_ROLE_NAME_IS_RESERVED', 'ERR_ADMIN_PRIVILEGES_REQUIRED']
        }  
    }

    #swagger.responses[404] = { 
        description: "Rola o takim id nie istnieje",
        schema: {
            error: ['ERR_ROLE_NOT_EXISTS', 'ERR_USER_FROM_TOKEN_NOT_EXISTS']
        }  
    }

    #swagger.responses[409] = { 
        description: "Rola o takiej nazwie już istnieje",
        schema: {
            error: 'ERR_ROLE_ALREADY_EXISTS'
        }  
    }

    #swagger.responses[200] = {
        description: 'Wszystko poszło GIT',
        schema: { 
            success: 'SUCCESS_EDIT_ROLE',
            role: { $ref: '#/definitions/Role' }
        }
    }

    #swagger.responses[500] = {
        description: 'Błąd serwerowy',
        schema: { error: 'ERR_INTERNAL_SERVER_ERROR' }
    }

    */

    saveLogFromEndpointRequest(req)
  
    try {
        const name = req.query.name;

        if(!name) {
            return res.status(API_RESULTS.ERR_PROVIDE_NAME_FIELD.status_code).json({ error: API_RESULTS.ERR_PROVIDE_NAME_FIELD.code });
        }
    
        const short = generateSlug(name);
        const role = await Role.findByPk(req.params.id);
    
        if (!role) {
            return res.status(API_RESULTS.ERR_ROLE_NOT_EXISTS.status_code).json({ error: API_RESULTS.ERR_ROLE_NOT_EXISTS.code });
        }
      
        if (isRoleBlocked(role.name)) {
            return res.status(API_RESULTS.ERR_ROLE_NAME_IS_RESERVED.status_code).json({ error: API_RESULTS.ERR_ROLE_NAME_IS_RESERVED.code });
        }
    
        if (isRoleBlocked(name)) {
            return res.status(API_RESULTS.ERR_ROLE_NAME_IS_RESERVED.status_code).json({ error: API_RESULTS.ERR_ROLE_NAME_IS_RESERVED.code });
        }
    
        if(name != role.name && !(await isShortFieldUnique(short))) {
            return res.status(API_RESULTS.ERR_ROLE_ALREADY_EXISTS.status_code).json({ error: API_RESULTS.ERR_ROLE_ALREADY_EXISTS.code });
        }

        await role.update({ name, short })

        // TODO: tutaj kwestia, czy przy aktualizowaniu danych w bazie potrzebna będzie jakaś zwrotka jeśli się udało
        // jeśli nie, to można zrobić: res.status(204).send() i wtedy nie trzeba będzie pobierać ponownie aktualnych danych z bazy - będzie działało szybciej
        // res.status(204).send() 

        res.status(API_RESULTS.SUCCESS_EDIT_ROLE.status_code).json({ success: API_RESULTS.SUCCESS_EDIT_ROLE.code, role });
    } catch (error) {
        res.status(API_RESULTS.ERR_INTERNAL_SERVER_ERROR.status_code).json({ error: API_RESULTS.ERR_INTERNAL_SERVER_ERROR.code });
    }
}

const deleteRole = async (req, res) => {
    /*
    #swagger.tags = ['Roles']
    #swagger.summary = 'tylko dla admina'

    #swagger.security = [{
        TokenAuth: []
    }]

    #swagger.responses[403] = { 
        description: "Nazwa roli jest zarezerwowana albo nie masz uprawnień",
        schema: {
            error: ['ERR_ROLE_NAME_IS_RESERVED', 'ERR_ADMIN_PRIVILEGES_REQUIRED']
        }  
    }

    #swagger.responses[200] = {
        description: 'Wszystko poszło GIT',
        schema: { 
            success: 'SUCCESS_DELETE_ROLE',
            role: { $ref: '#/definitions/Role' }
        }
    }

    #swagger.responses[500] = {
        description: 'Błąd serwerowy',
        schema: { error: 'ERR_INTERNAL_SERVER_ERROR' }
    }

    */
    
    saveLogFromEndpointRequest(req)
  
    try {
        const role = await Role.findByPk(req.params.id);

        if (!role) {
            return res.status(API_RESULTS.ERR_ROLE_NOT_EXISTS.status_code).json({ error: API_RESULTS.ERR_ROLE_NOT_EXISTS.code });
        }
      
        if (isRoleBlocked(role.name)) {
            return res.status(API_RESULTS.ERR_ROLE_NAME_IS_RESERVED.status_code).json({ error: API_RESULTS.ERR_ROLE_NAME_IS_RESERVED.code });
        }

        await Role.destroy({
            where: { id: req.params.id },
        });

        // TODO: tutaj kwestia, czy przy aktualizowaniu danych w bazie potrzebna będzie jakaś zwrotka jeśli się udało
        // jeśli nie, to można zrobić: res.status(204).send() będzie działało szybciej
        // res.status(204).send() 

        res.status(API_RESULTS.SUCCESS_DELETE_ROLE.status_code).json({ success: API_RESULTS.SUCCESS_DELETE_ROLE.code, role });
    } catch (error) {
        res.status(API_RESULTS.ERR_INTERNAL_SERVER_ERROR.status_code).json({ error: API_RESULTS.ERR_INTERNAL_SERVER_ERROR.code });
    }
}

module.exports = { getRoles, getOneRole, addRole, editRole, deleteRole }