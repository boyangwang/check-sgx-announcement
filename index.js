const req = require('request-promise');
const vm = require('vm');

let lastDate;
function main() {
    req({
        method: 'POST',
        uri: 'http://www.sgx.com/proxy/SgxDominoHttpProxy?timeout=2000&dominoHost=http%3A%2F%2Finfofeed.sgx.com%2FApps%3FA%3DCOW_CorpAnnouncement_Content%26B%3DAnnouncementLast3MonthsSecurity%26R_C%3DN_A%7EN_A%7EN_A%7ETT%20INTERNATIONAL%20LIMITED%26C_T%3D20',
        headers: {
            'Origin': 'http://www.sgx.com',
            // 'Accept-Encoding': 'gzip, deflate',
            'Accept-Language': 'en-US,en;q=0.8',
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.81 Safari/537.36',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': '*/*',
            'Referer': 'http://www.sgx.com/wps/portal/sgxweb/home/company_disclosure/company_announcements'
        }
    })
        .then(parsedBody => {
            let announcements = new vm.Script('(' + parsedBody.substring(4) + ')').runInThisContext().items;
            let sorted = announcements.filter(a => a.Date).sort((a, b) => new Date(a.Date) - new Date(b.Date));
            let i = sorted.length;
            console.log('xxx sorted: ', sorted);
            if (!lastDate) {
                lastDate = sorted[i - 1].Date;
                console.log('xxx initial run done. lastDate: ', lastDate);
                setTimeout(main, 0);
            }
            while (sorted[i - 1].Date && sorted[i - 1].Date != lastDate) {
                i--;
            }
            let newAnnouncements = sorted.slice(i);
            if (newAnnouncements.length) {
                console.log('XXX got new announcements, sending email', newAnnouncements);
                lastDate = newAnnouncements[newAnnouncements.length-1].Date;
                sendEmail(newAnnouncements);
            } else {
                console.log('XXX no new announcement, try again in 60s', newAnnouncements);
                setTimeout(main, 60000);
            }
        })
        .catch(err => {
            console.log('XXX err in main, exec main again in 60s', err);
            setTimeout(main, 60000);
        });
}
function sendEmail(newAnnouncements) {
    const nodemailer = require('nodemailer');
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'nusarcast@gmail.com',
            pass: 'set it somewhere else...'
        }
    });
    let mailOptions = {
        from: '"NUSarcast" <nusarcast@gmail.com>',
        to: 'wangboyang1991@gmail.com, wangboyangjinghua@gmail.com, heshan1991@gmail.com',
        subject: 'T09 New announcement',
        text: JSON.stringify(newAnnouncements, null, 2),
        html: '<pre>' + JSON.stringify(newAnnouncements, null, 2) + '<pre>'
    };
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('sendEmail Err', error);
            return void setTimeout(sendEmail.bind(null, newAnnouncements), 60000 * 10);
        };
        console.log('Message %s sent: %s', info.messageId, info.response);
    });
}

main();
