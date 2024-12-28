export default function scrapeProblemData() {
    const problemName = document.querySelector('.problem_heading').textContent.trim();
    const description = document.querySelector('.coding_desc__pltWY p').textContent.trim();
    const inputFormat = document.querySelector('.coding_input_format__pv9fS p').textContent.trim();
    const outputFormat = document.querySelector('.coding_input_format__pv9fS p:nth-of-type(2)').textContent.trim();
    const constraints = document.querySelector('.coding_input_format__pv9fS p:nth-of-type(3)').textContent.trim();
  
    const testCases = [];
    const sampleInputs = document.querySelectorAll('.coding_input_format__pv9fS');
    const sampleOutputs = document.querySelectorAll('.coding_input_format__pv9fS:nth-of-type(2n)');
  
    for (let i = 1; i < sampleInputs.length; i++) {
      testCases.push({
        [`sample Input ${i}`]: sampleInputs[i].textContent.trim(),
        [`sample output ${i}`]: sampleOutputs[i-1].textContent.trim()
      });
    }
  
    return {
      problemName,
      "Description of the problem": description,
      "Input format": inputFormat,
      "Output format": outputFormat,
      Constraints: constraints,
      TestCases: testCases
    };
  }
  
  // Execute the function and send the result to the extension
//   chrome.runtime.sendMessage({action: "scrapedData", data: scrapeProblemData()});
  
//   console.log("Data scraping completed and sent to extension.");