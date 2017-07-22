var unirest = require('unirest');

var commands = require('./commands');

function redditScrape(slack, db, msg, location, store) {
    console.log("Scraping reddit: " + location + " to " + store);
    unirest.get(location)
    .headers({'Accept': 'application/json'})
    .end(function (response) {
        var data;
        try {
            data = JSON.parse(response.body);
        }
        catch (e) {
            slack.sendMsg(msg.channel, "Invalid response from reddit, did you use a json url?");
            return;
        }

        if (data.kind != "Listing") {
            slack.sendMsg(msg.channel, "reddit url must be a listing");
            return;
        }

        var posts = data.data.children.data;
        console.log("Found " + posts.length + " posts");

        db.get(store, function (err, value) {
            if (err) value = [];
            posts.forEach(function (p) {
                if (value.indexOf(p.title) >= 0)
                    return;

                value.push(p.title);
            });

            db.put(store, value, function () {
                console.log("Scraping complete");
                slack.sendMsg("Scraping complete");
            });
        });
    });
}

// !scrape <type> <location> <store>
function scrapeCommand(slack, db, msg, cmd, args) {
    if (args.length !== 3) {
        slack.sendMsg(msg.channel, "!scrape <type> <location> <store>");
        return;
    }

    var type = args[0];
    var location = args[1];
    var store = args[2];

    switch (type.toLowerCase()) {
    default:
        slack.sendMsg(msg.channel, "Scraper types: reddit");
        return;

    case 'reddit':
        redditScrape(slack, db, msg, location, store);
        break;
    }
}

commands.register('scrape', scrapeCommand);