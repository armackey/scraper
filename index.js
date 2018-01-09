var cheerio = require('cheerio');
var request = require('request');
var firebase = require('firebase');
var config = require('./config');

firebase.initializeApp(config);

var db = firebase.database();

let scrape_for_icebreakers1 = () => {
    return new Promise((res,rej) => {
        request('http://www.signupgenius.com/groups/funnyicebreakerquestions.cfm', (error, response, html) => {
            if (error) { rej(); return}
            let $ = cheerio.load(html);
            var header = 'Throwback';
            var array = [];
            $('ol li').each((i, elem) => {
                if (i > 33) header = 'Facts About Yourself';
                if (i > 67) header = 'Hypothetical';
                let text = elem.children[0].data;
                array[i] = { text: text, header: header };
            });
            res(array);
        });
    });
};


let add_to_firebase = (url, data) => {
    data.map(d => {
        db.ref().child(url).push(d);
    });
};

let run = async () => {
    let ice1 = await scrape_for_icebreakers1();
    add_to_firebase('games/ice-breakers', ice1);
}

run();