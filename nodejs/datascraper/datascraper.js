var aws = require('aws-lib');
var MongoClient = require('mongodb').MongoClient;
var stringSimilarity = require('string-similarity');
var csscolors = require('css-color-names');
var fs = require('fs');

function initProdAdvClient() {
    var keyObj = JSON.parse(fs.readFileSync('key.json', 'utf8'));
    var accessKeyId = keyObj.id;
    var secretAccessKey = keyObj.key;
    var associateTag = 'ednolanstore-20';
    return aws.createProdAdvClient(accessKeyId, secretAccessKey, associateTag);
}

/*
Response Elements:
Title: 'Title' (ItemAttributes)
Color: 'Color' (ItemAttributes)
Category: 'BrowseNode[i].Name' (BrowseNodes)
Price: 'Amount' (OfferSummary)
Sales Rank: 'SalesRank' (SalesRank)
Brand: 'Brand' (ItemAttributes)
*/


function keywordSearch(client, keyword, response_groups, page) {
    return new Promise(function(resolve, reject) {
        client.call('ItemSearch',
                    {SearchIndex: 'Fashion',
                     Keywords: keyword,
                     ItemPage: page,
                     ResponseGroup: response_groups},
                    function(err, result) {
                        if(err) return reject(err);
                        else resolve(result);
                    });
    });
}

function addToMongo(analysis) {
    function analysisToDocuments(category, _index, _arr) {
        return {category: category, analysis: analysis[category] };
    }
    var documents = Object.keys(analysis).map(analysisToDocuments);
    var url = 'mongodb://localhost:27017/';
    return new Promise(function(resolve, reject) {
        MongoClient.connect(url, function(err, db) {
            if(err) return reject(err);
            else {
                console.log("Connected to mongo");
                var time_tag = Date.now().toString();
                console.log("Creating collection", time_tag);
                db.collection(time_tag).insertMany(documents, function(err, result) {
                    if(err) return reject(err);
                    else {
                        console.log("Added map");
                        console.log(JSON.stringify(documents));
                        db.close();
                        return resolve(true);
                    }
                });
            }
        });
    });
}

async function fullKeywordSearch(client, keyword, response_groups) {
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    var items = [];
    for(var page = 1; page < 11; page++) {
        console.log("Scraping results page", page, "for keyword", keyword);
        try {
            var result = await keywordSearch(client, keyword, response_groups, page);
            items = items.concat(result.Items.Item);
            await sleep(1000); // 1 request per second
        } catch(err) {
            console.error(err);
        }
    }
    return items;
}

function process(items) {
    function getBestColorMatch(color) {
        if(typeof color == 'undefined') return 'other';
        var matches = stringSimilarity.findBestMatch(color, Object.keys(csscolors));
        if(matches.bestMatch.rating < 0.8) return 'other';
        else return matches.bestMatch.target.split('.').join('');
    }
    function cleanBrandName(brand) {
        if(typeof brand == 'undefined') return 'other';
        else return brand.split('.').join('');
    }
    function cleanItem(val, _index, _arr) {
        var item = {};
        item.Title = val.ItemAttributes.Title;
        item.Color = getBestColorMatch(val.ItemAttributes.Color);
        item.Price = parseFloat(val.OfferSummary.LowestNewPrice.Amount) / 100;
        item.SalesRank = val.SalesRank;
        item.Brand = cleanBrandName(val.ItemAttributes.Brand);
        return item;
    }
    return items.map(cleanItem);
}

async function scrape(client, keywords) {
    var response_groups = 'ItemAttributes,OfferSummary,SalesRank';
    var data = {};
    for(var loop = 0; loop < keywords.length; loop++) {
        try {
            var items = await fullKeywordSearch(client, keywords[loop], response_groups);
        } catch(err) {
            console.error(err);
        }
        data[keywords[loop]] = process(items);
    }
    return data;
}

function analysis(data) {
    function getColorCounts(analysis, category, _index, _arr) {
        function calculateColorCounts(color_counts, item, _index, _arr) {
            if(color_counts[item.Color]) color_counts[item.Color] += 1;
            else color_counts[item.Color] = 1;
            return color_counts;
        }
        if(typeof analysis[category] == 'undefined') analysis[category] = {};
        analysis[category]['color_counts'] = data[category].reduce(calculateColorCounts, {})
        return analysis;
    }
    function getBrandCounts(analysis, category, _index, _arr) {
        function calculateBrandCounts(brand_counts, item, _index, _arr) {
            if(brand_counts[item.Brand]) brand_counts[item.Brand] += 1;
            else brand_counts[item.Brand] = 1;
            return brand_counts;
        }
        function consolidateInfrequentBrands(brand) {
            if(analysis[category]['brand_counts'][brand] <= 1) {
                if(typeof analysis[category]['brand_counts']['other'] == 'undefined')
                    analysis[category]['brand_counts']['other'] = 1;
                else
                    analysis[category]['brand_counts']['other']+= 1;
                delete analysis[category]['brand_counts'][brand];
            }
        }
        if(typeof analysis[category] == 'undefined') analysis[category] = {};
        analysis[category]['brand_counts'] = data[category].reduce(calculateBrandCounts, {});
        Object.keys(analysis[category]['brand_counts']).forEach(consolidateInfrequentBrands);
        return analysis;
    }
    function getPriceArray(analysis, category, _index, _arr) {
        analysis[category]['price_array'] = data[category].map((item, _index, _arr) => item.Price);
        return analysis;
    }
    var color_counted = Object.keys(data).reduce(getColorCounts, {});
    var brand_counted = Object.keys(data).reduce(getBrandCounts, color_counted);
    var price_tabulated = Object.keys(data).reduce(getPriceArray, brand_counted);
    return price_tabulated;
}

async function run() {
    var client = initProdAdvClient();
    var keywords = [
        'apron', 'bandanna'];/*, 'bathing suit', 'belt', 'bikini', 'boot',
        'bow tie', 'bra', 'bracelet', 'cardigan', 'coat', 'dress', 'earmuffs',
        'earrings', 'fedora', 'flip-flops', 'glasses', 'gloves', 'handbag',
        'hat', 'helmet', 'high heels', 'jacket', 'jeans', 'kimono', 'mittens',
        'necklace', 'overalls', 'pajamas', 'parka', 'pea coat', 'raincoat',
        'sandals', 'scarf', 'shirt', 'shoe', 'shorts', 'skirt', 'sneakers',
        'sock', 'sunglasses', 'sweater', 't-shirt', 'tie', 'tights',
        'turtleneck', 'tuxedo', 'vest', 'wig', 'windbreaker'];*/
    try {
        var data = await scrape(client, keywords);
        await addToMongo(analysis(data));
    } catch(err) {
        console.error(err);
    }
}

run();
