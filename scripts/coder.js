
const messages = [];
window.messages = messages;
const errorOccuredIframeIds = [];

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
    const result = eval(codeObj.codeBlock);
    console.log('--- result:', result);
    setTimeout(async () => { // ensure the triggering of hack_delay. // todo: Prmoise.all // todo: don't await above
      window.hooks.emit("hack_delay", `You got the result via your CODER skll, now you MUST tell the user the result you got is ${result}`);
    }, 100);
  } else if (codeObj.language.toLowerCase() === 'html') {

    // handle errors
    window.addEventListener('message', function(event) { // todo: removEventListener
      if (event.data.type === 'IFRAME_ERROR') {
        if (errorOccuredIframeIds.includes(event.data.iframeId)) {
          return; // only handle first error. // todo: handle all errors at once ?
        }
        errorOccuredIframeIds.push(event.data.iframeId);
        console.log('--- error from iframe:', event.data.data);
        debugger
        callModel([
          {role:'user',content:'I got this error: ' + JSON.stringify(event.data.data)}
        ])
      }
    });

    // 1. Create an iframe element dynamically
    var iframe = document.createElement('iframe');
    iframe.id = Math.random();

    // 2. Set iframe attributes (optional)
    iframe.src = 'about:blank'; // You can set the source URL
    iframe.width = '300'; // Set the width
    iframe.height = '200'; // Set the height

    // 3. Append the iframe to the document
    document.body.appendChild(iframe);

    const handleErrorBefore = `
      <script>

        // handle code logic error
        window.addEventListener('error', ({message, lineno, colno}) => {
          // debugger
          console.log('--- iframe error:', {message, lineno, colno});
          window.parent.postMessage({type: 'IFRAME_ERROR', iframeId: ${iframe.id}, data: {message, lineno, colno}}, '*');
        });
        
        // handle createElement error, such as wrong element.src
        const originalCreateElement = document.createElement;
        document.createElement = function(tagName) {
          const element = originalCreateElement.call(document, tagName);
          element.addEventListener('error', function(event) {
            console.log('--- error from document createElement', event);
            /* event
              isTrusted: true
              bubbles: false
              cancelBubble: false
              cancelable: false
              composed: false
              currentTarget: null
              defaultPrevented: false
              eventPhase: 0
              returnValue: true
              srcElement: img.leaflet-marker-icon.leaflet-zoom-animated.leaflet-interactive
              target: img.leaflet-marker-icon.leaflet-zoom-animated.leaflet-interactive
              timeStamp: 57.200000047683716
              type: "error"
            */
            window.parent.postMessage({type: 'IFRAME_ERROR', iframeId: ${iframe.id}, data: '404 Not Found: ' + event.srcElement.src}, '*');
          })
          return element;
        }
        
        // handle console.error
        const originalConsoleError = console.error;
        console.error = function (...args) {
          console.log('--- error from console.error', args);
          window.parent.postMessage({type: 'IFRAME_ERROR', iframeId: ${iframe.id}, data: args}, '*');
          const errorMessage = args.join(' ');
          originalConsoleError.apply(console, args);
        };

      </script>
    `;
    const handleErrorAfter = `
      <script>
          // Get all script elements in the document
          const scriptElements = document.querySelectorAll('script');

          // Add an error event listener to each script element
          scriptElements.forEach(script => {
              script.addEventListener('error', (event) => {
                  // Handle script loading errors here
                  console.error('--- Error loading script:' + script.src, event);
              });
          });
      </script>
    `;

    // 4. Access the iframe's content document and write HTML content into it
    var iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
    iframeDocument.open();
    iframeDocument.write(handleErrorBefore + codeObj.codeBlock + handleErrorAfter);
    iframeDocument.close();
  } else {
    throw new Error('Invalid code snippet language');
  }
  return codeObj;
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
    at async _handleCoderSkill (coder.js:122:27)
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

async function _handleCoderSkill() {
  console.log('--- _handleCoderSkill');
  messages.length = 0;

  const lastMessage = await window.companion.GetChatLog()
  const question = lastMessage[lastMessage.length - 1].data.value;
  
  // const output = eval('Math.sin(123)')
  // console.log('--- _handleCoderSkill output:', output)

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
    // question = "write a list that can be dragged and sorted";
    // question = "write a web page which I can drag and drop images into it, then automatically show all the images in a list";
    // question = "write a ping-pong game, which I can play with a computer player";
  }

  const newMessages = [
    {role: 'system', content: `

You are role-playing as a professional javascript coder/programmer. You need to generate code to solve the user's question.

You can only reply two types of code:
1. JavaScript (Use this when just need to return a result value to the user. Don't \`console.log()\` the result, MUST put only the result variable in the end of the code block.)
2. HTML (Use this when need show something to the user or need to achieve some advanced requirements. Must reply full HTML, which includes all the needed javascript code, css style, etc in it, can't separate javascript code and css style code to other code blocks.)

MUST NOT use scripts which require "token" or "key", the user WON'T obtain and provide it !!!
DON'T use "Google Maps JavaScript API" or other apis which require "token" or "key" !!!
DON'T ask the user to do anything, solve all the errors by yourself !!!
Always provide FULL code, don't use partial code even when fixing errors, or you will be punished !!!
You need to match the user's requirement as much as possible, prevent provide overly simplified result.
`},
// You can ONLY use free resources, MUST NOT use src/url or api which includes "token", "ACCESS_TOKEN", "API_KEY", "YOUR_API_KEY" etc.
    {role: 'user', content: question},
  ]
  // const responseContent = await callModel(newMessages);
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

  const codeObj = await callModel(newMessages);

  // return responseObj
}
window._handleCoderSkill = _handleCoderSkill; // test

export function init() {
  window.hooks.on('coder:handle_coder_skill', _handleCoderSkill)
}