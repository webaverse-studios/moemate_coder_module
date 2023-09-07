
const messages = [];
window.messages = messages;

function extractCode(inputString) {
  const regex = /```([a-zA-Z]+)\n([\s\S]*?)```/g;
  const matches = [];
  let match;

  while ((match = regex.exec(inputString)) !== null) {
    const language = match[1]; // Extract the language
    const codeBlock = match[2]; // Extract the code block content
    matches.push({ language, codeBlock });
  }

  // return matches;
  // return matches[0].codeBlock;
  return matches[0];
}

async function callModel(newMessages = []) {
  messages.push(...newMessages);
  const context = {
    messages,
  }
  // console.log('--- prompt: ', context.messages[0].content);
  // console.log('--- context: ', context);

  // console.log('--- _handleCreateQuestionSkill prompt before await:', context.messages)
  const model = window.models.CreateModel('coder:GPT 3.5 Turbo')
  context.messages = context.messages.map(message => JSON.stringify(message))
  window.models.ApplyContextObject(model, context);
  // console.log('--- payload module: ', window.models.GetModelWithContext(model))
  const response = await window.models.CallModel(model);
  // console.log('--- _handleCreateQuestionSkill prompt:', context.messages)
  // console.log('--- _handleCreateQuestionSkill response:', response)

  const responseContent = response.choices[0].message.content
  console.log('--- responseContent:', responseContent)
  messages.push({role: 'assistant', content: responseContent});

  const codeObj = extractCode(responseContent);
  console.log('--- codeObj:', codeObj);
  if (codeObj.language.toLowerCase() === 'javascript') {
    eval(codeObj.codeBlock);
  } else if (codeObj.language.toLowerCase() === 'html') {
    // 1. Create an iframe element dynamically
    var iframe = document.createElement('iframe');

    // 2. Set iframe attributes (optional)
    iframe.src = 'about:blank'; // You can set the source URL
    iframe.width = '300'; // Set the width
    iframe.height = '200'; // Set the height

    // 3. Append the iframe to the document
    document.body.appendChild(iframe);

    // 4. Access the iframe's content document and write HTML content into it
    var iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
    iframeDocument.open();
    iframeDocument.write(codeObj.codeBlock);
    iframeDocument.close();
  } else {
    throw new Error('Invalid code snippet language');
  }
}
window.callModel = callModel
/* console_test

  await callModel([
    {role:'user',content:'I got this error "GET http://localhost:5173/marker-icon.png 404 (Not Found)"'}
  ])

  await callModel([
    {role:'user',content:`I got this error: "Uncaught ReferenceError: mat4 is not defined
    at drawScene (<anonymous>:188:32)
    at render (<anonymous>:237:7)
    at <anonymous>:241:5
    at callModel (coder.js:61:20)
    at async testFn (coder.js:122:27)
    at async <anonymous>:1:1
    "`}
  ])
  
  await callModel([
    {role:'user',content:`I got this error: "coder.js:45 Uncaught TypeError: Cannot read properties of undefined (reading 'language')
    at callModel (coder.js:44:15)
    at async <anonymous>:1:1
    "`}
  ])

  await callModel([
    {role:'user',content:'I got this error "Google Maps JavaScript API error: InvalidKeyMapError"'}
  ])

*/

async function testFn(question) {
  messages.length = 0;
  
  // const output = eval('Math.sin(123)')
  // console.log('--- testFn output:', output)

  if (!question) {
//   const question = `
// how many "background" word in the following text:

// Introduce the Context: Start by providing a concise but informative overview of the background information. You can summarize the key points, relevant facts, or the topic you're interested in. Be clear and specific.

// State Your Question Clearly: After introducing the context, ask your question in a clear and concise manner. Make sure your question is focused and directly related to the background information you provided.

// Use Bullet Points or Headings: To make the information more digestible for the AI, you can use bullet points or headings to organize the background information. This can help the AI understand the structure of the information and locate the relevant details more effectively.

// Highlight Key Details: If there are specific details within the background information that are crucial to your question, highlight them. You can use phrases like "The most important point to consider is..." or "Of particular relevance is..."

// Specify What You're Looking For: If your question relates to a specific aspect or detail within the background information, be explicit about what you're looking for. For example, "Can you explain the implications of X mentioned in the background?" or "What are the key factors influencing Y in this context?"

// Be Patient and Iterative: Depending on the complexity of the background information, it may take some back-and-forth interactions with the AI to get the desired response. Don't hesitate to refine your question or provide additional context if needed.

// Review and Refine: After receiving a response, review it to ensure it addresses your question accurately. If the AI's response is not what you were looking for, you can rephrase your question or ask for clarification.
//   `
    // const question = "What is the 10th fibonacci number?";
    // const question = "What's the result of sin(123rad)?";
    // const question = "How to get the Sum of a 1D array?";
    // question = "Draw a world map.";
    // question = "plot a sine curve";
    question = "plot a 3d sine surface";
    // question = "draw a 3d horse";
  }

  const newMessages = [
    {role: 'system', content: `
You are role-playing as a professional javascript coder/programmer. You need to generate code to solve the user's question.
You can only reply two types of code:
1. JavaScript
2. HTML (Must reply full HTML, which includes all the needed javascript code, css style, etc in it, can't separate javascript code and css style code to other code blocks.)
When need to use a library or call an API, you can only use free resources, can't expect user to provide things like "token", "ACCESS_TOKEN", or "API key" etc.
`},
    {role: 'user', content: question},
  ]
  const responseContent = await callModel(newMessages);
  /* --- responseContent:
    To find the 10th Fibonacci number, we can write a JavaScript code that calculates the Fibonacci sequence up to the desired number and returns its value. Here's an example code snippet:

    ```javascript
    function fibonacci(n) {
      var fibo = [0, 1];

      if (n <= 2) return fibo[n - 1];

      for (var i = 2; i < n; i++) {
        fibo[i] = fibo[i - 1] + fibo[i - 2];
      }

      return fibo[n - 1];
    }

    var tenthFibonacci = fibonacci(10);
    console.log(tenthFibonacci);
    ```

    In this code, we define a `fibonacci` function that takes an input `n` representing the nth Fibonacci number to be calculated. We initialize an array `fibo` with the first two numbers of the Fibonacci sequence. 

    If the input `n` is 1 or 2, we directly return the corresponding Fibonacci value from the `fibo` array. Otherwise, we loop from index 2 to `n-1` and calculate each Fibonacci number by summing the previous two numbers.

    Finally, we call the `fibonacci` function with an input of `10` to get the 10th Fibonacci number and store it in the `tenthFibonacci` variable. We then use `console.log` to output the result to the console.
  */

  // const responseObj = JSON.parse(response.choices[0].message.content)
  // console.log('--- responseObj:', responseObj)

  // return responseObj
}
window.testFn = testFn; // test