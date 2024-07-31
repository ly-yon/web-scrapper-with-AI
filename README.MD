## Pre-requsite:-

1- NPM package handler\
2- NodeJS v20+

# How to Start

Start by Downloading Dependencies\
npm install\
>main-multi-language.js is the main system file will return json data\
In the file Index.js , Change the URL as Desired\
Run the Code!\
Start point\
node ./index.js\
The Results Should Appear in the Console Log!

# Description

## Prepairing Training Dataset:-

prepared almost 20 true valid files that meet privacy and policy, terms and condition , refund policy that should be in any legimate e-commerce!\
categorized them in different folders :-\
./privacy\
./terms\
./policy\
Then created a json file containing all the data along with labelling them for example:-\
[{\
"data":"terms and condition is about todo and todo......"\
"label":"terms"\
},\
{\
"data":"privacy and policy is about todo and todo......"\
"label":"policy"\
}...etc]

## Using AI to determine the text (Algorithm used is Naive Bayes)

Naive Bayes is very good algorithm used to classify the text! in this project i used naive bayes to compare the given text with the data which i prepared in the previous task!\
thanks to this library wink-naive-bayes-text-classifier in JavaScript which provided with all the tools to make it work.\
How it works?\
Simply first i have to load the prepered data into the memory using nbc.importJSON(labeledData) method where labeledData is json ready file and it's ready to compare with the another text will be given when comparing.\
Then we use nbc.computeOdds(newText) method where newText is the given text to compare it with data!, this method will return the similarity score like this\
[\
[ 'terms', 80.356390789192574 ],\
[ 'privacy', 30.8415393028331 ],\
[ 'refund', 10.6568283986262 ]\
]\
the higher score means the higher rate of being legimate policy of the text for example if the text is about terms and condition, true terms! the result could be like this :-\
[\
[ 'terms', 250.356390789192574 ],\
[ 'privacy', 30.8415393028331 ],\
[ 'refund', -135.6568283986262 ]\
]\
giving the highest score for the terms and like this for all criteria.\
Since the algorithm compares with similarity words and provide score based on that, the text required to have exact same as the text in memory, any conflict with other policy will lower the score or if the context is small like only having one paragragh will encounter\ with lower score and i set the system to accept only score which are above 50!

## Getting Info from the websites

I used two method's here, since one is heavy and jouisy with resources while the other one is lightwaight. Puppeteer and Cheerio. These two libraries provided to JavaScript Developer's to help them scrapping the website and getting extracting all the information needed!\ in our case we need to get the right pages where it exist for privacy and policy page, terms and conditions and refund policy. So i started with getting to the homepage of the website and looking for all a tags that homepage have, then filtering them according to the key words we got using regex like this:-\
/conditions?|terms?|tos|شروط|(أ|ا)حكام|اتفاقي(ة|ه)/ for terms and conditions\
/privacy|خصوصي(ه|ة)|سياس(ة|ه)/ for privacy and policy\
/warrenty|returns?|refund|سياس(ة|ه)|ارجاع|ا?ل?ضمان/ for refund policy\
we did the filter on the link and also for the text placeholder\
after that we now have a list of links that should contain useful information!\
Here are some dificulties found when getting the link :-
- Sometimes the name of the page or the words in links can't be filtered.
- There are no links in the HomePage but they exist under help section or anyother subsection!\
  To come over this problem i used the help of google to find me the right page that i need! and this was done using axios and cheerio\
  Why do we need puppeteer when there is a better efficient way to get info?\
  Well, cheerio does the work but it's only for static websites if the system encounter with a dynamic website then cheerio will not work we must use puppeteer for that.

## Comparing with AI

NOW, we have the links list, we will go through every link and get the all body tag data and compare it with AI that we created and try to get good score to accept it.\
Also here we check for the statusCode if we get other then 200 it means there is a problem accessing the website either it's permission denied or human verification or anyother problem!\
## Supporting Multi-Language
Many websites in bahrain doesn't provide english pages, or their landing home page is in Arabic so i developed a way that we can translate the text if it wasn't in english to english text for that i used two free libraries :- franc-all, bing-translate-api\
franc-all is a powerful library to detect the language and bing-translate-api to translate the text since this is the only reliable free option, the only limitation for bing translator that every request is limited with some length of words , so i make the text as small chunks then combined them!\
Language problem Solved!!
## Finally
the System would accept any valid URL and return with links and boolean value if it's the true policy or not!
