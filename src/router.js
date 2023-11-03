const express = require('express');
const router = express.Router();
const requireJWT = require('./middleware/requireJWT')
const LogController = require('./controllers/LogController');
const MainController = require('./controllers/MainController')
const UserController = require('./controllers/UserController')

router.get('/', MainController.mainEndpoint);
router.get('/logs/:fileName', LogController.getLogs);
router.get('/logs', LogController.getLogs);

router.post('/user/login', UserController.userLogin);
router.post('/user/register', UserController.userRegister);


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
