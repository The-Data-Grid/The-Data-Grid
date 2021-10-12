"use strict";
const nodemailer = require("nodemailer");

/**
 * Creates mail transporter instance
 * @returns instance of mail transporter
 */
function createTransport() {
    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "thedatagridnoreply@gmail.com", // generated ethereal user
            pass: "mlcickxcaxnqyfhc", // generated ethereal password
        },
    });
}

// async..await is not allowed in global scope, must use a wrapper

/**
 * Sends an email. Will throw if error.
 * @param {Transport}
 * @param {string} subject - Email subject
 * @param {string} body - Email body
 * @param {string} receiversList - Comma separated list of receiver emails
 */
async function send(transporter, subject, body, receiversList) {
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
    //let testAccount = await nodemailer.createTestAccount();

    // create reusable transporter object using the default SMTP transport


    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: '"🌎 The Data Grid 🌎" <thedatagridnoreply@gmail.com>', // sender address
        to: receiversList, // list of receivers
        subject: subject, // Subject line
        text: body, // plain text body
    });

    //console.log("Message sent: %s", info.messageId);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

    // Preview only available when sending through an Ethereal account
    //console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}

async function sendMail(config) {
    const {
        title,
        address,
        body
    } = config;

    await send(createTransport(), title, body, address);
}

module.exports = {
    createTransport,
    send,
    sendMail
};