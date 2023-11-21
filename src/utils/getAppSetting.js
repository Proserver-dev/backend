const AppConfigurations = require('../models/AppConfiguration')
const APP_CONFIGURATION_DEFAULT = require('../constants/appConfigurationDefault')

const getAppSetting = async (key) => {
    const option = await AppConfigurations.findOne({
        where: { key },
    });

    if(option) {
        if(option.type == "main") {
            if(option.value == 1)
                return true;

            if(option.value == 0)
                return false
        }

        return option.value
    }

    return APP_CONFIGURATION_DEFAULT[key].value
}

module.exports = getAppSetting;