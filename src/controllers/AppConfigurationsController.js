const AppConfiguration = require('../models/AppConfiguration')
const { saveLogFromEndpointRequest } = require('../functions');
const APP_CONFIGURATION_DEFAULT = require('../constants/appConfigurationDefault')
const API_RESULTS = require('../constants/apiResults')
const getAppSetting = require('../utils/getAppSetting')

const getAppConfigurations = async (req, res) => {
    /*
    #swagger.tags = ['Admin']

    #swagger.security = [{
        TokenAuth: []
    }]

    */

    saveLogFromEndpointRequest(req)
    try {
        const type = req.query.type
        const filters = {}
        if(type) {
            filters.type = type
        }

        const config = await AppConfiguration.findAll({ where: filters });
        res.json(config);
    } catch (error) {
        res.status(API_RESULTS.ERR_GET_APP_CONFIG.status_code).json({ error: API_RESULTS.ERR_GET_APP_CONFIG.code });
    }
}

const editAppConfigurations = async (req, res) => {
    /*
    #swagger.tags = ['Admin']

    #swagger.security = [{
        TokenAuth: []
    }]

    */
    
    saveLogFromEndpointRequest(req)
    try {
        const fields = req.query;
        let result = {}

        for (const key in APP_CONFIGURATION_DEFAULT) {
            if (APP_CONFIGURATION_DEFAULT.hasOwnProperty(key)) {
                const item = APP_CONFIGURATION_DEFAULT[key];
                if(fields[key]) {
                    // upsert utworzy rekord, jeśli przy próbie aktualizacji nie będzie istniał
                    await AppConfiguration.upsert( 
                        { 
                            key: key,
                            value: fields[key]
                        },
                        { where: { key: key } }
                    );
                    result[key] = fields[key]
                }
            }
        }

        res.json(result);
    } catch (error) {
        res.status(API_RESULTS.ERR_EDIT_APP_CONFIG.status_code).json({ error: API_RESULTS.ERR_EDIT_APP_CONFIG.code });
    }
}

const getPublicAppConfig = async (req, res) => {
    /*
    #swagger.tags = ['Config']

    #swagger.responses[200] = { 
        description: "Wszystko poszło GIT",
        schema: {
            "password": {
                "PASSWORD_MIN_CHARS": 8,
                "PASSWORD_MIN_SMALL_LETTERS": 1,
                "PASSWORD_MIN_BIG_LETTERS": 1,
                "PASSWORD_MIN_DIGITS": 1,
                "PASSWORD_MIN_SPECIAL_CHARS": 1
            },
            "isRegistrationEnabled": true,
            "registrationDisableReason": null,
            "isLoginEnabled": false,
            "loginDisableReason": "Logowanko wyłączone, bo tak"
        }  
    }

    */

    saveLogFromEndpointRequest(req)
    try {
        const minCharsCount = await getAppSetting(APP_CONFIGURATION_DEFAULT.PASSWORD_MIN_CHARS.key)
        const minLowercaseCount = await getAppSetting(APP_CONFIGURATION_DEFAULT.PASSWORD_MIN_SMALL_LETTERS.key)
        const minUppercaseCount = await getAppSetting(APP_CONFIGURATION_DEFAULT.PASSWORD_MIN_BIG_LETTERS.key)
        const minDigitsCount = await getAppSetting(APP_CONFIGURATION_DEFAULT.PASSWORD_MIN_DIGITS.key)
        const minSpecialcharsCount = await getAppSetting(APP_CONFIGURATION_DEFAULT.PASSWORD_MIN_SPECIAL_CHARS.key)

        let registrationDisableReason = null
        const isRegistrationEnabled = await getAppSetting(APP_CONFIGURATION_DEFAULT.REGISTRATION_ENABLED.key)
        if(!isRegistrationEnabled) {
            registrationDisableReason = await getAppSetting(APP_CONFIGURATION_DEFAULT.REGISTRATION_DISABLED_REASON.key)
        }

        let loginDisableReason = null
        const isLoginEnabled = await getAppSetting(APP_CONFIGURATION_DEFAULT.LOGIN_ENABLED.key)
        if(!isLoginEnabled) {
            loginDisableReason = await getAppSetting(APP_CONFIGURATION_DEFAULT.LOGIN_DISABLED_REASON.key)
        }


        const response = {
            password: {
                [APP_CONFIGURATION_DEFAULT.PASSWORD_MIN_CHARS.key]: parseInt(minCharsCount),
                [APP_CONFIGURATION_DEFAULT.PASSWORD_MIN_SMALL_LETTERS.key]: parseInt(minLowercaseCount),
                [APP_CONFIGURATION_DEFAULT.PASSWORD_MIN_BIG_LETTERS.key]: parseInt(minUppercaseCount),
                [APP_CONFIGURATION_DEFAULT.PASSWORD_MIN_DIGITS.key]: parseInt(minDigitsCount),
                [APP_CONFIGURATION_DEFAULT.PASSWORD_MIN_SPECIAL_CHARS.key]: parseInt(minSpecialcharsCount),
            },
            isRegistrationEnabled: isRegistrationEnabled,
            registrationDisableReason: registrationDisableReason,
            isLoginEnabled: isLoginEnabled,
            loginDisableReason: loginDisableReason,
        }

        res.json(response);
    } catch (error) {
        console.log(error)
        res.status(API_RESULTS.ERR_INTERNAL_SERVER_ERROR.status_code).json({ error: API_RESULTS.ERR_INTERNAL_SERVER_ERROR.code });
    }
}

module.exports = { getAppConfigurations, editAppConfigurations, getPublicAppConfig }