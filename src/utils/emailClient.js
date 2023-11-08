const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
const { SETTINGS } = require('../../settings');

const emailClient = nodemailer.createTransport(smtpTransport({
    host: SETTINGS.SMTP.HOST,
    port: SETTINGS.SMTP.PORT, 
    secure: SETTINGS.SMTP.SECURE,
    auth: {
        user: SETTINGS.SMTP.AUTH.USER,
        pass: SETTINGS.SMTP.AUTH.PASS,
    },
}));

module.exports = emailClient;