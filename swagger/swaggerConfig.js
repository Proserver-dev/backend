const { SETTINGS } = require("../settings");

module.exports = {
  info: {
    title: 'Ride Club',
    description: "Najlepsza apka dla kierowców",
    version: '1.0.0',
    contact: {
      name: "Ride Club",
      email: "ceo@rideclub.pl",
      url: "http://rideclub.pl",
    },
  },
  host: SETTINGS.SWAGGER_HOST,
  schemes: SETTINGS.SWAGGER_PROTOCOLS,
  securityDefinitions: {
    TokenAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'Token',
        description: 'login Token, e.g., "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"',
    }
  },
  definitions: {
    User: {
      id: 1,
      isActivated: true,
      email: "john@doe.dev",
      userName: "john123",
      nameLastname: "John Doe",
      role: {
          id: 2,
          name: "User",
          short: "user"
      },
      isLoggedIn: true,
      updatedAt: "2023-11-15T04:17:54.000Z",
      createdAt: "2023-11-07T20:16:13.000Z"
    },
    PrivateMessage: {
      id: 1,
      sourceUserId: 1,
      targetUserId: 8,
      message: 'Example message',
      isRead: false,
      updatedAt: '2023-11-15T04:17:54.000Z',
      createdAt: '2023-11-15T04:17:54.000Z',
      attachments: [
        { $ref: '#/definitions/PrivateMessageAttachment' }
      ]
    },
    PrivateMessageAttachment: {
      url: "https://backend.proserver.dev/uploads/messages/365d5d73-7be9-40cb-8497-e5baecb4fb28.jpg",
      type: "image"
    },
    Role: {
      id: 2,
      name: "User",
      short: "user"
    },
    EmailSendHistory: {
      id: 1,
      isRead: false,
      from: 'no-reply@rideclub.pl',
      to: 'john@doe.com',
      subject: 'Temat wiadomości',
      html: 'Treść wiadomości w HTML',
      status: 'success | error',
      errorLog: {
        code:"EAUTH",
        response:"535 5.7.8 Error: authentication failed: ",
        responseCode: 535,
        command:"AUTH PLAIN"
      },
      createdAt: '2023-11-15T04:17:54.000Z'
    }
  }
};
