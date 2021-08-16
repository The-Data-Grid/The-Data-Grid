const mailClient = require('./mda.js');

async function main() {
    transporter = mailClient.createTransport();
    await mailClient.send(transporter, "bepis","rat","kian.nikzad@gmail.com, oliver@melgrove.com");
}

main().catch(console.error);