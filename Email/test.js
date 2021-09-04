const mailClient = require('./mda.js');

async function main() {
    transporter = mailClient.createTransport();
    await mailClient.send(transporter, "bepis","rat","kian.nikzad@gmail.com, rat@1234554443");
}

main().catch(console.error);