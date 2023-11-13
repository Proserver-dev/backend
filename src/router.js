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
router.get('/users/:id', UserController.getAllUsers);
router.get('/users', UserController.getAllUsers);

router.get('/roles/:id', requireJWT, requireAdmin, RoleController.getRoles);
router.get('/roles', requireJWT, requireAdmin, RoleController.getRoles);
router.post('/roles', requireJWT, requireAdmin, RoleController.addRole);
router.put('/roles/:id', requireJWT, requireAdmin, RoleController.editRole);
router.delete('/roles/:id', requireJWT, requireAdmin, RoleController.deleteRole);

router.get('/messages-to-all', requireJWT, requireAdmin, MessageController.getAllMessagesToAll)

router.get('/admin/users/get-auth-history', requireJWT, requireAdmin, AuthHistoryController.getAuthHistory)

router.get('/admin/app-config', requireJWT, requireAdmin, AppConfigurationsController.getAppConfigurations)
router.put('/admin/app-config', requireJWT, requireAdmin, AppConfigurationsController.editAppConfigurations)

router.get('/test', (req, res) => {
    res.status(200).json([
        {
          "description": "Example description 1",
          "imageUrl": "https://picsum.photos/200/300",
          "modificationDate": "2023-11-02T12:00:00Z",
          "orderId": 1,
          "title": "Example Title 1",
          "url": "https://example.com/page1"
        },
        {
          "description": "Example description 2",
          "imageUrl": "https://picsum.photos/250/350",
          "modificationDate": "2023-11-02T13:30:00Z",
          "orderId": 2,
          "title": "Example Title 2",
          "url": "https://example.com/page2"
        }
      ]);
})

router.get('/test2', requireJWT, (req, res) => {
  res.status(200).json([
      {
        "description": "Example description 1",
        "imageUrl": "https://picsum.photos/200/300",
        "modificationDate": "2023-11-02T12:00:00Z",
        "orderId": 1,
        "title": "Example Title 1",
        "url": "https://example.com/page1"
      },
      {
        "description": "Example description 2",
        "imageUrl": "https://picsum.photos/250/350",
        "modificationDate": "2023-11-02T13:30:00Z",
        "orderId": 2,
        "title": "Example Title 2",
        "url": "https://example.com/page2"
      }
    ]);
})

module.exports = { router };
