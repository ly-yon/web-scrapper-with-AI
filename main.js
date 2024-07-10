import puppeteer from "puppeteer";
import { load } from "cheerio";
import axios from "axios";
import ai from "./ai_import/ai.js";
import fs from "fs";
import extractDomain from "extract-domain";
const getQuotes = async (url) => {
  // Start a Puppeteer session with:
  // - a visible browser (`headless: false` - easier to debug because you'll see the browser in action)
  // - no default viewport (`defaultViewport: null` - website page will in full width and height)
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
    await page.goto(url, {
      waitUntil: "networkidle0",
    });
    await page.waitForSelector("a", { visible: false, timeout: 30000 });
  } catch (err) {
    await browser.close();
    throw new Error("Coudn't Connet To the URL:" + url);
  }
  const { terms, policy, refund } = await page.evaluate(() => {
    // Use querySelectorAll to select all desired elements
    const elements = document.querySelectorAll("a");
    // Extract text content from each element
    const textContent = Array.from(elements).map((element) => {
      return { url: element.href, text: element.textContent };
    });
    const filtered = textContent.filter((element) => {
      if (
        !/\bconditions?\b|\bterms?\b|\bpolicy\b|\bhelp\b|\bsupport\b|\bcontact\b|\breturns?\b|\brefund\b|\bwarranty\b|\bdisputes\b|\btos\b|\bprivacy\b/i.test(
          element.url
        )
      )
        return /\bconditions?\b|\bterms?\b|\bpolicy\b|\bhelp\b|\bsupport\b|\bcontact\b|\breturns?\b|\brefund\b|\bwarranty\b|\bdisputes\b|\btos\b|\bprivacy\b/i.test(
          element.text
        );
      return /\bconditions?\b|\bterms?\b|\bpolicy\b|\bhelp\b|\bsupport\b|\bcontact\b|\breturns?\b|\brefund\b|\bwarranty\b|\bdisputes\b|\btos\b|\bprivacy\b/i.test(
        element.url
      );
    });
    const terms = filtered.filter((element) => {
      if (!/conditions?|terms?|tos/i.test(element.text))
        return /conditions?|terms?|tos/i.test(element.url);
      return /conditions?|terms?|tos/i.test(element.text);
    });
    const policy = filtered.filter((element) => {
      if (!/privacy/i.test(element.text)) return /privacy/i.test(element.url);
      return /privacy/i.test(element.text);
    });
    const refund = filtered.filter((element) => {
      if (!/returns?|refund/i.test(element.url))
        return /returns?|refund/i.test(element.text);
      return /returns?|refund/i.test(element.url);
    });
    return { terms, policy, refund };
  });
  await browser.close();
  return { terms, policy, refund };
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
async function getData(url) {
  const ua = getUserAgent();
  let ret = "";
  try {
    await fetch(url, {
      headers: {
        "User-Agent": ua,
      },
    })
      .then((res) => res.text())
      .then((html) => {
        const $ = load(html);
        // Remove unwanted elements (scripts, styles, etc.)
        $("script, style,footer,head").remove();
        // Get the text content of the remaining elements
        const plainText = [];
        // plainText.push($(".content").text().trim());
        // plainText.push($(".container").text().trim());
        // plainText.push($("section").text().trim());
        // plainText.push($("article").text().trim());
        // plainText.push($('div[class*="container"]').text().trim());
        // plainText.push($("main").text().trim());
        plainText.push($("body").text().trim());
        plainText.push($("*").text().trim());

        // console.log(plainText[1]);
        for (let i = plainText.length; i >= 0; i--)
          if (plainText[i] != "" && (plainText[i] != undefined) | null)
            ret = plainText[i];
      });
  } catch (err) {
    console.log("Can't Extract Data!! Deporting....");
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
    await page.goto(url, {
      waitUntil: "networkidle0",
    });
  } catch (error) {
    console.log(error);
    await browser.close();
    return null;
  }

  await page.waitForSelector("body", { visible: true });
  const selector = "style,script,head";
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

async function search(domain, label) {
  function checkDomainAndLabel(text, domain, label) {
    // 1. Construct Regular Expressions (Case-Insensitive)
    const domainRegex = new RegExp(
      `\\b${domain.replace(/\./g, "\\.")}\\b`,
      "i"
    );

    // Escape special characters in the label and match whole words
    const escapedLabel = label.replace(/ /g, "|");
    const labelRegex = new RegExp(`\\b${escapedLabel}s?\\b`, "i");

    // 2. Check if Both Domain and Label are Present
    return domainRegex.test(text) && labelRegex.test(text);
  }

  let exitdata = null;
  await axios
    .get(`https://www.google.com/search?q=${domain + " " + label}`, {
      headers: {
        "User-Agent": getUserAgent(),
      },
    })
    .then((response) => {
      const $ = load(response.data);
      const data = [...$(".MjjYud")].map((e) => ({
        title: $(e).find("h3").text().trim(),
        href: $(e).find("a").attr("href"),
      }));
      if (checkDomainAndLabel(data[0].href, domain, label))
        exitdata = data[0].href;
    })
    .catch((error) => {
      console.log(error);
    });
  return exitdata;
}
async function main(url) {
  // const url = "https://tractorzone.com/";
  const domain = extractDomain(url);
  // console.log(domain);
  const { terms, policy, refund } = await getQuotes(url);
  let result = [];
  result["term"] = false;
  result["policy"] = false;
  result["refund"] = false;
  let termsData, policyData, refundData;
  if (terms.length > 0) {
    termsData = await getData(terms[terms.length - 1].url);

    if (!ai(termsData, "terms"))
      termsData = await extractMainContent(terms[terms.length - 1].url);

    if (termsData != "" && termsData != undefined)
      result["term"] = ai(termsData, "terms");
  } else {
    const data = await search(domain, "term?s and condition");
    if (data) {
      terms.push({
        url: data,
        text: "refund",
      });
      termsData = await getData(data);
      if (!ai(termsData, "terms")) termsData = await extractMainContent(data);
      if (termsData != "" && termsData != undefined)
        result["term"] = ai(termsData, "terms");
    }
  }
  // fs.writeFileSync("./test-terms.txt", termsData);
  if (policy.length > 0) {
    policyData = await getData(policy[policy.length - 1].url);
    // console.log(policyData);
    if (!ai(policyData, "privacy"))
      policyData = await extractMainContent(policy[policy.length - 1].url);
    if (policyData != "" && policyData != undefined)
      result["policy"] = ai(policyData, "privacy");
  } else {
    const data = await search(domain, "privacy policy");
    if (data) {
      policy.push({
        url: data,
        text: "policy",
      });
      policyData = await getData(data);
      // fs.writeFileSync("./test-policy.txt", policyData);
      if (!ai(policyData, "privacy"))
        policyData = await extractMainContent(data);
      if (policyData != "" && policyData != undefined)
        result["policy"] = ai(policyData, "privacy");
    }
  }
  if (refund.length > 0) {
    refundData = await getData(refund[refund.length - 1].url);
    if (!ai(refundData, "refund"))
      refundData = await extractMainContent(refund[refund.length - 1].url);
    if (refundData != "" && refundData != undefined)
      result["refund"] = ai(refundData, "refund");
  } else {
    const data = await search(domain, "refund return policy");
    if (data) {
      refund.push({
        url: data,
        text: "refund",
      });
      refundData = await getData(data);
      if (!ai(refundData, "refund"))
        refundData = await extractMainContent(data);
      if (refundData != "" && refundData != undefined)
        result["refund"] = ai(refundData, "refund");
    }
  }

  return {
    Domain: domain,
    Refund: {
      url: refund[refund.length - 1] ? refund[refund.length - 1].url : null,
      valid: result["refund"],
    },
    Privacy: {
      url: policy[policy.length - 1] ? policy[policy.length - 1].url : null,
      valid: result["policy"],
    },
    Term: {
      url: terms[terms.length - 1] ? terms[terms.length - 1].url : null,
      valid: result["term"],
    },
  };
}
export default main;
