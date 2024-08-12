import main from "./main-multi-language.js";
const url = process.argv[2];
function checkDomain(urlString) {
  try {
    const url = new URL(urlString);
    return true;
  } catch (error) {
    return false; // Or handle the error as needed
  }
}
async function run(url) {
  if (checkDomain(url)) {
    const result = await main(url);
    console.log(JSON.stringify(result));
  } else console.log(JSON.stringify({ url: "Not Valid" }));
}
run(url);
