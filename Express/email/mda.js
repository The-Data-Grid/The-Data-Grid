// const sgMail = require('@sendgrid/mail')
const url = "https://api.sendgrid.com/v3/mail/send";
const axios = require('axios')


/**
 * Sends an email. Will throw if error.
 * @param {Transport}
 * @param {string} subject - Email subject
 * @param {string} body - Email body
 * @param {string} receiversList - Comma separated list of receiver emails
 */
 async function send(receiversList, link) {

    console.log(link)

    var data = {
        'from' :{
            "email":"info@thedatagrid.org",
            "name": "🌎 The Data Grid 🌎"
         },
        'personalizations':[
            {
               "to":[
                  {
                     "email": receiversList
                  }
               ], 
               "dynamic_template_data":{
                "emailVerificationLink": link
              }
            }
        ],
        'template_id':"d-067ed5fa12a94d818ccb204660ffa23f"
    }

    var headers = {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
    }
    
    axios.post(url, data, {headers: headers})
    .then((res) => {
        console.log("Email sent!")
    })
    .catch((err) => {
        console.log("Error!")
    });
}

async function sendMail(config) {
    const {
        title,
        address,
        body
    } = config;

    await send(address, body);
}

async function resetEmail(receiversList, link) {

    console.log(link)

    var data = {
        'from' :{
            "email":"info@thedatagrid.org",
            "name": "🌎 The Data Grid 🌎"
         },
        'personalizations':[
            {
               "to":[
                  {
                     "email": receiversList
                  }
               ], 
               "dynamic_template_data":{
                "passwordResetLink": link
              }
            }
        ],
        'template_id':"d-8e95cc7ae141424ab203ec08cddd375a"
    }

    var headers = {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
    }
    
    axios.post(url, data, {headers: headers})
    .then((res) => {
        console.log("Password reset email sent!")
    })
    .catch((err) => {
        console.log("Error!")
    });
}

async function sendReset(config) {
    const {
        title,
        address,
        body
    } = config;

    await resetEmail(address, body);
}

// Just for testing
async function sendEmailFake(_) {
    
}

module.exports = {
    send,
    sendMail, 
    sendEmailFake,
    sendReset,
    resetEmail
};