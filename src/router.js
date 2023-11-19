const express = require('express');
const router = express.Router();
const requireJWT = require('./middleware/requireJWT')
const requireAdmin = require('./middleware/requireAdmin')

const AuthController = require('./controllers/AuthController')
const DebugController = require('./controllers/DebugController');
const MainController = require('./controllers/MainController')
const RoleController = require('./controllers/RoleController')
const UserController = require('./controllers/UserController')
const MessageController = require('./controllers/MessageController')
const AuthHistoryController = require('./controllers/AuthHistoryController')
const AppConfigurationsController = require('./controllers/AppConfigurationsController')

router.get('/', MainController.mainEndpoint);
router.get('/logs/:fileName', DebugController.getLogs);
router.get('/logs', DebugController.getLogs);
router.get('/socket-connections', DebugController.getSocketConnections);
router.get('/api-results', requireJWT, requireAdmin, DebugController.getAllApiResultsConstants);

router.post('/auth/register', AuthController.register);
router.post('/auth/activate', AuthController.activateAccount);
router.post('/auth/resend', AuthController.resendEmailActivationCode);
router.post('/auth/login', AuthController.login);
router.get('/auth/refresh', AuthController.refreshLoginToken);
router.post('/auth/logout', AuthController.logout); // requireJWT nie jest konieczne, token sprawdzany jest w tej funkcji


router.get('/users/me', requireJWT, UserController.getMe);


router.get('/users/:id', UserController.getOneUser);
router.get('/users', UserController.getAllUsers);

router.get('/roles/:id', requireJWT, requireAdmin, RoleController.getOneRole);
router.get('/roles', requireJWT, requireAdmin, RoleController.getRoles);
router.post('/roles', requireJWT, requireAdmin, RoleController.addRole);
router.put('/roles/:id', requireJWT, requireAdmin, RoleController.editRole);
router.delete('/roles/:id', requireJWT, requireAdmin, RoleController.deleteRole);

router.get('/messages-to-all', requireJWT, requireAdmin, MessageController.getAllMessagesToAll)

router.get('/private-messages/:userId', requireJWT, MessageController.getPrivateMessages)
router.post('/private-messages/:userId', requireJWT, MessageController.addPrivateMessage)

router.get('/admin/users/get-auth-history', requireJWT, requireAdmin, AuthHistoryController.getAuthHistory)

router.get('/admin/app-config', requireJWT, requireAdmin, AppConfigurationsController.getAppConfigurations)
router.put('/admin/app-config', requireJWT, requireAdmin, AppConfigurationsController.editAppConfigurations)

module.exports = { router };
