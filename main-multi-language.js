import puppeteer from "puppeteer";
import { load } from "cheerio";
import axios from "axios";
import ai from "./ai_import/ai.js";
import LanguageDetect from "languagedetect";
import { translate } from "bing-translate-api";
import { franc, francAll } from "franc-all";
let publicError = { code: 200, text: "OK" };
function extractDomain(urlString) {
  try {
    const url = new URL(urlString);
    let value = url.hostname;
    if (url.hostname.startsWith("www.")) value = url.hostname.slice(4);
    return value;
  } catch (error) {
    console.error("Invalid URL:", urlString);
    return null; // Or handle the error as needed
  }
}
function checkDomain(urlString) {
  try {
    const url = new URL(urlString);
    return true;
  } catch (error) {
    return false; // Or handle the error as needed
  }
}

const selector =
  "style,script,head,aside,footer,header,img,iframe,#header-area,#footer-area";
const getQuotes = async (url) => {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: null,
    args: [
      "--disable-dev-shm-usage",
      "--disable-cache",
      "--disable-application-cache",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--start-maximized",
      "--no-default-browser-check",
      "--disable-infobars",
      "--disable-web-security",
      "--disable-site-isolation-trials",
      "--no-experiments",
      "--ignore-gpu-blacklist",
      "--ignore-certificate-errors",
      "--ignore-certificate-errors-spki-list",
      "--disable-gpu",
      "--disable-extensions",
      "--disable-default-apps",
      "--enable-features=NetworkService",
      "--disable-setuid-sandbox",
      "--no-sandbox",
    ],
  });

  // Open a new page
  const page = await browser.newPage();
  const client = await page.createCDPSession();
  await client.send("Network.enable");
  await client.send("Network.setExtraHTTPHeaders", {
    headers: {
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
      Dnt: "1",
      Priority: "u=0, i",
      "Upgrade-Insecure-Requests": "1",
      "User-Agent": getUserAgent(),
      "X-Amzn-Trace-Id": "Root=1-668e2aee-79dc210707fe0372304d2e96",
    },
  });
  await client.send("Network.getAllCookies"); // This will ensure cookies are enabled
  // On this new page:
  // - open the "http://quotes.toscrape.com/" website
  // - wait until the dom content is loaded (HTML is ready)
  try {
    const res = await page.goto(url, {
      waitUntil: "networkidle0",
    });
    if (res.status() != 200) {
      publicError.code = res.status();
      publicError.text = res.statusText();
      throw new Error("GOT Status in Home Page:- " + res.statusText());
    }
    await page.waitForSelector("a", { visible: false, timeout: 60000 });
  } catch (err) {
    await browser.close();
    return { terms: [], policy: [], refund: [] };
  }
  const { cart, terms, policy, refund } = await page.evaluate(() => {
    // Use querySelectorAll to select all desired elements
    const elements = document.querySelectorAll("a");
    // Extract text content from each element
    const textContent = Array.from(elements).map((element) => {
      return {
        url: element.href,
        text: element.textContent.replace(/\t/g, "y"),
      };
    });
    const filtered = textContent.filter((element) => {
      if (
        !/\bcart\b|\bwarrenty\b|\bconditions?\b|\bterms?\b|\bpolicy\b|\breturns?\b|\brefund\b|\bwarranty\b|\bdisputes\b|\btos\b|\bprivacy\b|سياس(ة|ه)|ارجاع|خصوصي(ه|ة)|شروط|(أ|ا)حكام|سل(ة|ه)|ا?ل?ضمان/i.test(
          element.url
        ) &&
        /[a-z]/i.test(element.url)
      )
        return /\bcart\b|\bwarrenty\b|\bconditions?\b|\bterms?\b|\bpolicy\b|\breturns?\b|\brefund\b|\bwarranty\b|\bdisputes\b|\btos\b|\bprivacy\b|سياس(ة|ه)|ارجاع|خصوصي(ه|ة)|شروط|(أ|ا)حكام|اتفاقي(ة|ه)|ا?ل?ضمان|سل(ة|ه)/i.test(
          element.text
        );
      return /\bcart\b|\bwarrenty\b|\bconditions?\b|\bterms?\b|\bpolicy\b|\breturns?\b|\brefund\b|\bwarranty\b|\bdisputes\b|\btos\b|\bprivacy\b|سياس(ة|ه)|ارجاع|خصوصي(ه|ة)|شروط|(أ|ا)حكام|اتفاقي(ة|ه)|ا?ل?ضمان|سل(ة|ه)/i.test(
        element.url
      );
    });
    const terms = filtered.filter((element) => {
      if (
        !/conditions?|terms?|tos|شروط|(أ|ا)حكام|اتفاقي(ة|ه)/i.test(element.text)
      )
        return /conditions?|terms?|tos|شروط|(أ|ا)حكام|اتفاقي(ة|ه)/i.test(
          element.url
        );
      return /conditions?|terms?|tos|شروط|(أ|ا)حكام|اتفاقي(ة|ه)/i.test(
        element.text
      );
    });
    const policy = filtered.filter((element) => {
      if (!/privacy|خصوصي(ه|ة)|سياس(ة|ه)/i.test(element.text))
        return /privacy|سياس(ة|ه)|خصوصي(ه|ة)/i.test(element.url);
      return /privacy|سياس(ة|ه)|خصوصي(ه|ة)/i.test(element.text);
    });
    const refund = filtered.filter((element) => {
      if (
        !/\bwarrenty\b|\breturns?\b|\brefund\b|سياس(ة|ه)|ارجاع|ا?ل?ضمان/i.test(
          element.url
        )
      )
        return /\bwarrenty\b|\breturns?\b|\brefund\b|سياس(ة|ه)|ارجاع|ا?ل?ضمان/i.test(
          element.text
        );
      return /\bwarrenty\b|\breturns?\b|\brefund\b|سياس(ة|ه)|ارجاع|ا?ل?ضمان/i.test(
        element.url
      );
    });
    const cart = filtered.filter((element) => {
      if (!/cart|سل(ة|ه)/i.test(element.url))
        return /cart|سل(ة|ه)/i.test(element.text);
      return /cart|سل(ة|ه)/i.test(element.url);
    });
    return { cart, terms, policy, refund };
  });
  await browser.close();
  return { cart, terms, policy, refund };
};
// Start the scraping
const getUserAgent = () => {
  const agents = [
    "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.117 Safari/537.36",
    "Mozilla/5.0 (Linux; Android 13; SM-S901U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 13; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 12; moto g pure) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36",
  ];

  const index = Math.floor(Math.random() * agents.length);
  return agents[index];
};
let getDataError = { code: 200, text: "OK" };
async function getData(url) {
  let ret = "";
  try {
    await fetch(url, {
      headers: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
        Dnt: "1",
        Priority: "u=0, i",
        "Upgrade-Insecure-Requests": "1",
        "User-Agent": getUserAgent(),
        "X-Amzn-Trace-Id": "Root=1-668e2aee-79dc210707fe0372304d2e96",
      },
    })
      .then((res) => {
        // console.log(res.status);
        if (res.status != 200) {
          getDataError.code = res.status;
          getDataError.text = res.statusText;
          throw new Error("Got Bad Response:- " + res.statusText);
        } else res.text();
      })
      .then((html) => {
        if (!html) return;
        const $ = load(html);
        // Remove unwanted elements (scripts, styles, etc.)
        $(selector).remove();
        // Get the text content of the remaining elements
        const plainText = [];
        // plainText.push($(".content").text().trim());
        // plainText.push($(".container").text().trim());
        // plainText.push($("section").text().trim());
        // plainText.push($("article").text().trim());
        // plainText.push($('div[class*="container"]').text().trim());
        // plainText.push($("main").text().trim());
        plainText.push($("body").text().trim());
        // plainText.push($("*").text().trim());

        // console.log(plainText[1]);
        for (let i = plainText.length; i >= 0; i--)
          if (plainText[i] != "" && (plainText[i] != undefined) | null)
            ret = plainText[i];
      });
  } catch (err) {
    // console.log(err);
    return "";
  }
  // console.log(ret);
  // fs.writeFileSync("./here.txt", ret);
  return ret;
}
// const https = require("https");
// import https from "https";
// async function getData(url) {
//   return undefined;
// }
async function extractMainContent(url) {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: null,
    args: [
      "--disable-dev-shm-usage",
      "--disable-cache",
      "--disable-application-cache",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--start-maximized",
      "--no-default-browser-check",
      "--disable-infobars",
      "--disable-web-security",
      "--disable-site-isolation-trials",
      "--no-experiments",
      "--ignore-gpu-blacklist",
      "--ignore-certificate-errors",
      "--ignore-certificate-errors-spki-list",
      "--disable-gpu",
      "--disable-extensions",
      "--disable-default-apps",
      "--enable-features=NetworkService",
      "--disable-setuid-sandbox",
      "--no-sandbox",
    ],
  });

  // Open a new page
  const page = await browser.newPage();
  const client = await page.createCDPSession();
  await client.send("Network.enable");
  await client.send("Network.setExtraHTTPHeaders", {
    headers: {
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
      Dnt: "1",
      Priority: "u=0, i",
      "Upgrade-Insecure-Requests": "1",
      "User-Agent": getUserAgent(),
      "X-Amzn-Trace-Id": "Root=1-668e2aee-79dc210707fe0372304d2e96",
    },
  });
  await client.send("Network.getAllCookies"); // This will ensure cookies are enabled
  // On this new page:
  // - open the "http://quotes.toscrape.com/" website
  // - wait until the dom content is loaded (HTML is ready)
  try {
    const res = await page.goto(url, {
      waitUntil: "domcontentloaded",
    });
    if (res.status() != 200) {
      getDataError.code = res.status();
      getDataError.text = res.statusText();
      throw new Error("GOT Status while extracting data:- " + res.statusText());
    }
  } catch (error) {
    console.log(error);
    await browser.close();
    return null;
  }

  await page.waitForSelector("body", { visible: true });

  // 2. Select and move the main content into the temporary container
  await page.$$eval(selector, (els) => els.forEach((el) => el.remove()));
  const mainContent = await page.evaluate(() => {
    // 1. Create a new element to hold the extracted content

    const mainContentElement = document.querySelector("body");

    // 4. Extract the plain text from the temporary container
    return mainContentElement.textContent.trim();
  });
  await browser.close();
  // console.log(mainContent);
  return mainContent;
}
let searchError = { code: 200, text: "OK" };
async function search(domain, label) {
  console.log("Entered For SEARCH! " + label);
  function checkDomainAndLabel(text, domain, label) {
    // 1. Construct Regular Expressions (Case-Insensitive)
    const domainRegex = new RegExp(`${domain.replace(/\./g, "\\.")}`, "i");

    // Escape special characters in the label and match whole words
    const escapedLabel = label.replace(/ /g, "|");
    const labelRegex = new RegExp(`${escapedLabel}`, "i");
    // 2. Check if Both Domain and Label are Present
    return domainRegex.test(text) && labelRegex.test(text);
  }

  let exitdata = [];
  await axios
    .get(
      `https://www.google.com/search?q=${
        domain + "%20" + label + "%20in%20English"
      }`,
      {
        headers: {
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "Accept-Encoding": "gzip, deflate, br, zstd",
          "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
          Dnt: "1",
          Priority: "u=0, i",
          "Upgrade-Insecure-Requests": "1",
          "User-Agent": getUserAgent(),
          "X-Amzn-Trace-Id": "Root=1-668e2aee-79dc210707fe0372304d2e96",
        },
      }
    )
    .then((response) => {
      if (response.status != 200) {
        searchError.code = response.status;
        searchError.text = response.statusText;
        throw new Error(
          "Error Searching: Bad Request with " + response.statusText
        );
      }
      const $ = load(response.data);
      const data = [...$(".MjjYud")].map((e) => ({
        title: $(e).find("h3").text().trim(),
        href: $(e).find("a").attr("href"),
      }));
      for (let i = 0; i < data.length; i++) {
        if (
          checkDomainAndLabel(data[i].href, domain, label) &&
          checkDomain(data[i].href) &&
          data[i].title != ""
        )
          exitdata.push({ url: data[i].href, text: data[i].title });
      }
    })
    .catch((error) => {
      console.log(error);
    });
  // console.log(exitdata);
  return exitdata;
}
let result = [];

function detect(txt) {
  const language = new LanguageDetect();
  const result = language.detect(txt, 2);
  console.log(result);
  console.log(franc(txt));
  if (franc(txt) == "eng") return true;
  if (
    result[0][0] == "english" ||
    result[1][0] == "english" ||
    result[0][0] == "pidgin"
  )
    return true;
  return false;
}
async function letTranslate(txt) {
  const newTxt = txt.replace(/\s+/g, " ");
  let splitedData = newTxt.split(" ");
  let result = [];
  let data = "";
  for (let i = 0; i < splitedData.length; i++) {
    if (splitedData[i]) data += splitedData[i];
    let max = 2000;
    if (data.trim().length > max) {
      try {
        const translated = await translate(data, null, "en");
        if (translated) {
          result.push(translated.translation);
        }
      } catch (error) {
        console.log(txt);
      }
      data = "";
    }
  }
  for (let i = 0; i < result.length; i++) {
    data += result[i];
  }
  return data;
}
async function getresult(data, tag, resultIndex) {
  let tempData = "";
  for (let i = 0; i < data.length; i++) {
    tempData = await getData(data[i].url);
    result[resultIndex].url = data[i].url;
    // fs.writeFileSync(`./test/${tag}.txt`, tempData ? tempData : "Not found");
    if (tempData != "" && tempData != undefined) {
      console.log("Need to Translate the text? " + (franc(tempData) != "eng"));
      console.log(franc(tempData));
      if (franc(tempData) != "eng") tempData = await letTranslate(tempData);
      if (ai(tempData, tag)) {
        // Here it will be the function of translate // tempData = await letTranslate(tempData)
        result[resultIndex].valid = true;
        break;
      }
    }
  }
  // termsData = await getData(terms[terms.length - 1].url);
  if (!result[resultIndex].valid)
    for (let i = 0; i < data.length; i++) {
      tempData = await extractMainContent(data[i].url);
      result[resultIndex].url = data[i].url;
      if (tempData != "" && tempData != undefined) {
        console.log(
          "Need to Translate the text? " + (franc(tempData) != "eng")
        );
        console.log(franc(tempData));
        if (franc(tempData) != "eng") tempData = await letTranslate(tempData);
        if (ai(tempData, tag)) {
          result[resultIndex].valid = true;
          break;
        }
      }
    }
  // fs.writeFileSync(`./test/${tag}.txt`, tempData ? tempData : "Not found");
}
async function main(url) {
  const domain = extractDomain(url);
  result = [];
  result.push({
    name: "Terms",
    valid: false,
    url: null,
  });
  result.push({
    name: "Privacy",
    valid: false,
    url: null,
  });
  result.push({
    name: "Refund",
    valid: false,
    url: null,
  });
  result.push({
    name: "cart",
    valid: false,
    url: null,
  });
  const checkDomain = new RegExp(domain, "i");
  let { cart, terms, policy, refund } = await getQuotes(url);
  cart = cart.filter((element) => {
    return checkDomain.test(element.url);
  });
  terms = terms.filter((element) => {
    return checkDomain.test(element.url);
  });
  policy = policy.filter((element) => {
    return checkDomain.test(element.url);
  });
  refund = refund.filter((element) => {
    return checkDomain.test(element.url);
  });
  if (terms.length > 0) {
    await getresult(terms, "terms", 0);
  }
  if (!result[0].valid) {
    const data = await search(domain, "term?s and condition");
    if (data.length > 0) {
      await getresult(data, "terms", 0);
    }
  }
  if (policy.length > 0) {
    await getresult(policy, "privacy", 1);
  }
  if (!result[1].valid) {
    const data = await search(domain, "privacy and policy");
    if (data.length > 0) {
      await getresult(data, "privacy", 1);
    }
  }
  if (refund.length > 0) {
    await getresult(refund, "refund", 2);
  }
  if (!result[2].valid) {
    const data = await search(domain, "return or refund policy");
    if (data.length > 0) {
      await getresult(data, "refund", 2);
    }
  }
  if (refund.length > 0) {
    result[3].valid = true;
    result[3].url = cart[0].url;
  }
  if (!result[3].valid) {
    const data = await search(domain, "cart");
    if (data.length > 0) {
      result[3].valid = true;
      result[3].url = data[0].url;
    }
  }
  return {
    // Domain: domain,
    // Errors: {
    //   publicError,
    //   getDataError,
    //   searchError,
    // },
    cart: {
      url: result[3].url ? result[3].url : null,
      status: result[3].valid,
    },
    refund: {
      url: result[2].url ? result[2].url : null,
      status: result[2].valid,
    },
    policy: {
      url: result[1].url ? result[1].url : null,
      status: result[1].valid,
    },
    term: {
      url: result[0].url ? result[0].url : null,
      status: result[0].valid,
    },
  };
}
export default main;
