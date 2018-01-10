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

let scrape_for_wyr1 = () => {
    return new Promise((res, rej) => {
        request('https://conversationstartersworld.com/would-you-rather-questions/', (error, response, html) => {
            if (error) { rej(); return; }
            let $ = cheerio.load(html);
            let array = [];
            $('.entry-content p').each((i, elem) => {
                if (i > 4) 
                    array.push(separate_text(elem.children[0].data));
            });
            res(array);
        });
    });
};


let separate_text = (text) => {
    /**
     * remove 'Would you rather' part of string.
     * remove 'or'
     * return two separate strings
     */
    var rm1index;
    var rm2index;
    var string1;
    var string2;
    try {
        rm1index = text.indexOf('rather') + 7;
        rm2index = text.indexOf(' or ');
        string1 = text.slice(rm1index, rm2index);
        string2 = text.slice(rm2index + 4, text.length -1);

    } catch(e) {
        // console.log(e);
    }
    return {
        rather1: string1,
        rather2: string2
    }
};

let getKeys = (url, data) => {
    return data.map(item => {
        return Object.keys(item).map(d => {
            let ref = db.ref().child(url).push();
            return ref.key;
        });
    })
}

let add_wyr = (url, data) => {
    /**
     * need to replace the keys on each object with firebase unique keys
     */
    var array = [];
    
    return Promise.all(getKeys(url, data))
        .then(results => {
            return results.map((item, index) => {
                var obj = {};
                obj[item[0]] = data[index]['rather1'];
                obj[item[1]] = data[index]['rather2'];
                array.push(obj);
                if (index === results.length -1)
                    add_to_firebase(url, array);
            });
        })
        .catch(e => {
            console.log(e);
        })
}

let add_to_firebase = (url, data) => {
    data.map(d => {
        let values = Object.values(d);
        if (values[0] && values[1]) {
            db.ref().child(url).push(d);
        }
    });
};

let run = async () => {
    let ice1 = await scrape_for_icebreakers1();
    add_to_firebase('games/ice-breakers', ice1);
    let wyr1 = await scrape_for_wyr1('games/wyr');
    add_wyr('games/wyr', wyr1);
}

run();