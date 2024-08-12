import fs from "fs";
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import Classifier from "wink-naive-bayes-text-classifier";

// Resolve the absolute path to the current directory of the script
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Construct the path to the JSON file using the absolute path
const modelPath = join(__dirname, 'naive_bayes_model.json');

// console.log(`Looking for model file at: ${modelPath}`);

// Instantiate the classifier
const nbc = Classifier();

// Load labeled data from JSON file
let labeledData;
try {
  labeledData = JSON.parse(fs.readFileSync(modelPath, 'utf-8'));
} catch (error) {
  console.error(`Failed to read JSON file: ${error.message}`);
  process.exit(1);
}

// Import the prepText function
import prepText from "wink-naive-bayes-text-classifier/src/prep-text.js";

// Configure the classifier
nbc.definePrepTasks([prepText]);
nbc.defineConfig({ considerOnlyPresence: false, smoothingFactor: 0.5 });

// Import the JSON data into the classifier
nbc.importJSON(labeledData);
nbc.consolidate();

// Function to run classification
function run(data, label) {
  const newText = data;
  const odd = nbc.computeOdds(newText)[0];
  if (label !== odd[0]) return false;
  if (Math.abs(odd[1]) < 50) return false;
  return true;
}

export default run;
