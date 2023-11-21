const AppConfiguration = require('../models/AppConfiguration')
const { saveLogFromEndpointRequest } = require('../functions');
const APP_CONFIGURATION_DEFAULT = require('../constants/appConfigurationDefault')
const API_RESULTS = require('../constants/apiResults')

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

module.exports = { getAppConfigurations, editAppConfigurations }