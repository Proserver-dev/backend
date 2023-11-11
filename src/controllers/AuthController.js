const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/UserModel');
const Role = require('../models/RoleModel');
const { saveLogFromEndpointRequest } = require('../functions');
const isValidEmail = require('../utils/isValidEmail')
const { SETTINGS } = require('../../settings');
const { DEFAULT_ROLE } = require('../constants/roleBlocked')
const HEADERS_KEYS = require('../constants/headersKeys')
const API_RESULTS = require('../constants/apiResults')
const emailClient = require('../utils/emailClient')

const generateAuthPin = () => {
    return Math.floor(100000 + Math.random() * 900000)
}

const register = async (req, res) => {
    saveLogFromEndpointRequest(req)
    const deviceToken = req.header(HEADERS_KEYS.DEVICE_TOKEN);

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

        const userExist = await User.findOne({ where: { email } });

        if (userExist) {
            return res.status(API_RESULTS.ERR_USER_ALREADY_EXISTS.status_code).json({ error: API_RESULTS.ERR_USER_ALREADY_EXISTS.code });
        }

        let default_role = await Role.findOne({ where: { name: DEFAULT_ROLE } })

        if(default_role) {
            default_role = default_role.id
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const registerPin = generateAuthPin();
        const user = await User.create({ email, password: hashedPassword, userName, nameLastname, deviceToken, roleId: default_role, authPin: registerPin });

        // TODO: treść szablonu do wysyłki maila trzeba przenieść gdzieś indziej

        const mailOptions = {
            from: SETTINGS.SMTP.AUTH.USER,
            to: email,
            subject: 'ProServer - Kod aktywacyjny',
            html: `<p>Twój kod aktywacyjny: <strong>${registerPin}</strong></p>`,
        };

        emailClient.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error(error);
                res.status(API_RESULTS.ERR_SEND_EMAIL.status_code).json({ error: API_RESULTS.ERR_SEND_EMAIL.code });
            } else {
                console.log('E-mail wysłany: ' + info.response);
                res.status(API_RESULTS.SUCCESS_USER_REGISTERED.status_code).json({ success: API_RESULTS.SUCCESS_USER_REGISTERED.code, user });
            }
        });
    } catch (error) {
        console.error(error);
        res.status(API_RESULTS.ERR_REGISTER_ERROR.status_code).json({ error: API_RESULTS.ERR_REGISTER_ERROR.code });
    }
}

const activateAccount = async (req, res) => {
    saveLogFromEndpointRequest(req)
    const deviceToken = req.header(HEADERS_KEYS.DEVICE_TOKEN);
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
          return res.status(API_RESULTS.ERR_USER_NOT_EXISTS.status_code).json({ error: API_RESULTS.ERR_USER_NOT_EXISTS.code });
        }

        if(user.isActivated) {
            return res.status(API_RESULTS.ERR_USER_IS_ALREADY_ACTIVATED.status_code).json({ error: API_RESULTS.ERR_USER_IS_ALREADY_ACTIVATED.code });
        }

        if(!deviceToken) {
            return res.status(API_RESULTS.ERR_PROVIDE_DEVICE_TOKEN.status_code).json({ error: API_RESULTS.ERR_PROVIDE_DEVICE_TOKEN.code });
        }

        if(deviceToken !== user.deviceToken) {
            return res.status(API_RESULTS.ERR_WRONG_DEVICE_TOKEN.status_code).json({ error: API_RESULTS.ERR_WRONG_DEVICE_TOKEN.code });
        }

        if(authPin !== user.authPin) {
            return res.status(API_RESULTS.ERR_WRONG_AUTH_PIN.status_code).json({ error: API_RESULTS.ERR_WRONG_AUTH_PIN.code });
        }

        const newAuthPin = generateAuthPin()
        const loginToken = jwt.sign({ userId: user.id }, SETTINGS.JWT_SECRET, { algorithm: SETTINGS.LOGIN_TOKEN.ALGORITHM, expiresIn: SETTINGS.LOGIN_TOKEN.TTL });
        const refreshToken = jwt.sign({ userId: user.id, deviceToken: deviceToken }, SETTINGS.REFRESH_TOKEN.PRIVATE_KEY, { algorithm: SETTINGS.REFRESH_TOKEN.ALGORITHM, expiresIn: SETTINGS.REFRESH_TOKEN.TTL });

        await user.update({ loginToken, isActivated: true, authPin: newAuthPin });

        const user_role = await Role.findByPk(user.roleId)
        user.roleId = user_role
        res.json({ token: loginToken, refreshToken, user });

    } catch (error) {
        console.error(error);
        res.status(API_RESULTS.ERR_ACTIVATE_ACCOUNT_ERROR.status_code).json({ error: API_RESULTS.ERR_ACTIVATE_ACCOUNT_ERROR.code });
    }
}

const resendEmailActivationCode = async (req, res) => {
    saveLogFromEndpointRequest(req)
    const deviceToken = req.header(HEADERS_KEYS.DEVICE_TOKEN);
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(API_RESULTS.ERR_PROVIDE_EMAIL_FIELD.status_code).json({ error: API_RESULTS.ERR_PROVIDE_EMAIL_FIELD.code });
        }

        if (!isValidEmail(email)) {
            return res.status(API_RESULTS.ERR_INVALID_EMAIL_ADDRESS.status_code).json({ error: API_RESULTS.ERR_INVALID_EMAIL_ADDRESS.code });
        }

        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(API_RESULTS.ERR_USER_NOT_EXISTS.status_code).json({ error: API_RESULTS.ERR_USER_NOT_EXISTS.code });
        }

        if(user.isActivated) {
            return res.status(API_RESULTS.ERR_USER_IS_ALREADY_ACTIVATED.status_code).json({ error: API_RESULTS.ERR_USER_IS_ALREADY_ACTIVATED.code });
        }

        if(!deviceToken) {
            return res.status(API_RESULTS.ERR_PROVIDE_DEVICE_TOKEN.status_code).json({ error: API_RESULTS.ERR_PROVIDE_DEVICE_TOKEN.code });
        }

        if(deviceToken !== user.deviceToken) {
            return res.status(API_RESULTS.ERR_WRONG_DEVICE_TOKEN.status_code).json({ error: API_RESULTS.ERR_WRONG_DEVICE_TOKEN.code });
        }

        // TODO: treść szablonu do wysyłki maila trzeba przenieść gdzieś indziej

        const newAuthPin = generateAuthPin()
        await user.update({ authPin: newAuthPin });

        const mailOptions = {
            from: SETTINGS.SMTP.AUTH.USER,
            to: email,
            subject: 'ProServer - Kod aktywacyjny',
            html: `<p>Twój kod aktywacyjny: <strong>${newAuthPin}</strong></p>`,
        };

        emailClient.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error(error);
                res.status(API_RESULTS.ERR_SEND_EMAIL.status_code).json({ error: API_RESULTS.ERR_SEND_EMAIL.code });
            } else {
                console.log('E-mail wysłany ponownie: ' + info.response);
                res.status(API_RESULTS.SUCCESS_USER_REGISTERED.status_code).json({ success: API_RESULTS.SUCCESS_USER_REGISTERED.code, user });
            }
        });
    } catch (error) {
        res.status(API_RESULTS.ERR_SEND_EMAIL.status_code).json({ error: API_RESULTS.ERR_SEND_EMAIL.code });
    }
}

const login = async (req, res) => {
    saveLogFromEndpointRequest(req)
    const deviceToken = req.header(HEADERS_KEYS.DEVICE_TOKEN);
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(API_RESULTS.ERR_PROVIDE_LOGIN_DATA.status_code).json({ error: API_RESULTS.ERR_PROVIDE_LOGIN_DATA.code });
        }

        if (!isValidEmail(email)) {
            return res.status(API_RESULTS.ERR_INVALID_EMAIL_ADDRESS.status_code).json({ error: API_RESULTS.ERR_INVALID_EMAIL_ADDRESS.code });
        }

        const user = await User.findOne({ where: { email } });
    
        if (!user) {
          return res.status(API_RESULTS.ERR_USER_NOT_EXISTS.status_code).json({ error: API_RESULTS.ERR_USER_NOT_EXISTS.code });
        }

        if(!user.isActivated) {
            return res.status(API_RESULTS.ERR_USER_IS_NOT_ACTIVATED.status_code).json({ error: API_RESULTS.ERR_USER_IS_NOT_ACTIVATED.code });
        }

        const user_role = await Role.findByPk(user.roleId)

        // konieczne do odświeżania loginToken
        if(!deviceToken && user_role?.short != "admin") {
            return res.status(API_RESULTS.ERR_PROVIDE_DEVICE_TOKEN.status_code).json({ error: API_RESULTS.ERR_PROVIDE_DEVICE_TOKEN.code });
        }
    
        const passwordMatch = await bcrypt.compare(password, user.password);
    
        if (!passwordMatch) {
          return res.status(API_RESULTS.ERR_WRONG_PASSWORD.status_code).json({ error: API_RESULTS.ERR_WRONG_PASSWORD.code });
        }

        const loginToken = jwt.sign({ userId: user.id }, SETTINGS.JWT_SECRET, { algorithm: SETTINGS.LOGIN_TOKEN.ALGORITHM, expiresIn: SETTINGS.LOGIN_TOKEN.TTL });
        const refreshToken = jwt.sign({ userId: user.id, deviceToken: deviceToken }, SETTINGS.REFRESH_TOKEN.PRIVATE_KEY, { algorithm: SETTINGS.REFRESH_TOKEN.ALGORITHM, expiresIn: SETTINGS.REFRESH_TOKEN.TTL });

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
    
        res.json({ token: loginToken, refreshToken, user });
    } catch (error) {
        console.error(error);
        res.status(API_RESULTS.ERR_LOGIN_ERROR.status_code).json({ error: API_RESULTS.ERR_LOGIN_ERROR.code });
    }
}

const refreshLoginToken = async (req, res) => {
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
            return res.status(API_RESULTS.ERR_REFRESH_TOKEN_EXPIRED.status_code).json({ error: API_RESULTS.ERR_REFRESH_TOKEN_EXPIRED.code });
        }

        // jeśli zapisany w bazie ostatni loginToken jest inny od tego przekazanego z żądaniem o odświeżenie tokena
        if(user.loginToken !== token) {
            // tutaj nie powinniśmy czyścić loginToken, może być sytuacja że ktoś użyje starego (ale jeszcze ważnego) refreshToken + jakiś randomowy token w celu ataku
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

        const newToken = jwt.sign({ userId: user.id }, SETTINGS.JWT_SECRET, { algorithm: SETTINGS.LOGIN_TOKEN.ALGORITHM, expiresIn: SETTINGS.LOGIN_TOKEN.TTL });

        await user.update({ loginToken: newToken });

        res.json({ token: newToken });
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            // jeśli refreshToken wygasł to wylogowujemy usera w apce

            const user = await User.findOne({ where: { loginToken: token } });

            if(user) {
                user.update({ loginToken: null });
            }

            // tutaj nie jesteśmy w stanie wyczyścić loginToken usera, bo nie wiemy do kogo należał ten wygaśnięty refreshToken
            res.status(API_RESULTS.ERR_REFRESH_TOKEN_EXPIRED.status_code).json({ error: API_RESULTS.ERR_REFRESH_TOKEN_EXPIRED.code });
        } else {
            console.error(error);
            res.status(API_RESULTS.ERR_REFRESH_TOKEN.status_code).json({ error: API_RESULTS.ERR_REFRESH_TOKEN.code });
        }
    } 
}

const logout = async (req, res) => {
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
        res.status(API_RESULTS.SUCCESS_LOGOUT.status_code).json({ success: API_RESULTS.SUCCESS_LOGOUT.code, user });

    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            const user = await User.findOne({ where: { loginToken: token } });

            if(user) {
                user.update({ loginToken: null });
                res.status(API_RESULTS.SUCCESS_LOGOUT.status_code).json({ success: API_RESULTS.SUCCESS_LOGOUT.code, user });
            } else {
                // tutaj nie jesteśmy w stanie wyczyścić loginToken usera, bo nie wiemy do kogo należał ten wygaśnięty token i nie znaleziono go w bazie
                return res.status(API_RESULTS.ERR_TOKEN_EXPIRED.status_code).json({ error: API_RESULTS.ERR_TOKEN_EXPIRED.code });   
            } 
        } else {
            console.error(error);
            res.status(API_RESULTS.ERR_LOGOUT_ERROR.status_code).json({ error: API_RESULTS.ERR_LOGOUT_ERROR.code });
        }
    }
}

module.exports = { register, activateAccount, resendEmailActivationCode, login, refreshLoginToken, logout }