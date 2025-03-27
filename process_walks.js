const fs = require("fs");

// Read the input file
const inputFile = "public/data/Walks.json";
const outputFile = "public/data/Walks_new.json";

// Read and parse the JSON file
const data = JSON.parse(fs.readFileSync(inputFile, "utf8"));

// Process each entry
const processedData = {
  Path_name: data.Path_name.map((entry, index) => {
    // Split the distance string into kilometers and miles
    const [distanceK, distanceM] = entry.Distance.split("/").map((part) => {
      // Extract just the number from strings like "120 km" or "75 miles"
      return part.trim().split(" ")[0];
    });

    return {
      id: index + 1,
      name: entry.name,
      url: entry.url,
      Distance_K: distanceK,
      Distance_M: distanceM,
      named_on_OS_Maps: entry.named_on_OS_Maps,
      Waymarked: entry.Waymarked,
    };
  }),
};

// Write the processed data to a new file
fs.writeFileSync(outputFile, JSON.stringify(processedData, null, 2));

console.log(`Processing complete! Output written to ${outputFile}`);
