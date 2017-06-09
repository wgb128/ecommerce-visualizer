Sites scraped by the scraper:
-Amazon

Type of product searched:
-50 different types of clothing

Information scraped:
-Title
-Color
-Price
-Sales rank
-Brand

Data analyzed and displayed:
-Color distribution
-Price distribution
-Brand distribution
-Average price by brand

How to install:
Install mongodb and run npm install in nodejs/datascraper, react/data-srv, and react/data-vis

How to scrape data:
Start up mongod with the dbpath parameter being mongodb/data
Add your AWS credentials to nodejs/datascraper/key.json
Start the data scraper in nodejs/datascraper by running npm start

How to view data:
Start up mongod with the dbpath parameter being mongodb/data
Start the mongo api server in react/data-srv by running npm start
Start the react web server in react/data-vis by running npm start
