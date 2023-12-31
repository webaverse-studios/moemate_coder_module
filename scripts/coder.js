
const messages = [];
window.messages = messages;
const errorOccuredIframeCustomIds = [];
// let iframe = null;

function extractCode(inputString) {

  if (inputString.startsWith('<!DOCTYPE html>')) {
    return { language: 'html', codeBlock: inputString };
  }

  const regex = /```([a-zA-Z]+)\n([\s\S]*?)```/g;
  const codeObjs = [];
  let match;

  while ((match = regex.exec(inputString)) !== null) {
    const language = match[1]; // Extract the language
    const codeBlock = match[2]; // Extract the code block content
    codeObjs.push({ language, codeBlock });
  }

  // get the codeObj with max length codeBlock value
  const initialValue = { codeBlock: '' };
  const codeObj = codeObjs.reduce((prev, cur) => (prev.codeBlock.length > cur.codeBlock.length ? prev : cur), initialValue);

  return codeObj;
}

async function callModel(newMessages = []) {
  messages.push(...newMessages);

  // limit total messages length
  if (messages.length > 8) {
    messages.splice(2, 2);
  }

  console.log('--- messages:', messages);

  const context = {
    messages,
  }

  const model = window.models.CreateModel('coder:GPT 3.5 Turbo')
  context.messages = context.messages.map(message => JSON.stringify(message))
  window.models.ApplyContextObject(model, context);
  const response = await window.models.CallModel(model);

  const responseContent = response.choices[0].message.content
  console.log('--- responseContent:', responseContent)
  messages.push({role: 'assistant', content: responseContent});

  const codeObj = extractCode(responseContent);
  console.log('--- codeObj:', codeObj);
  if (codeObj.language.toLowerCase() === 'javascript') {
    const result = eval(codeObj.codeBlock);
    console.log('--- result:', result);

    const name = await window.companion.GetCharacterAttribute('name');
    window.companion.SendMessage({ type: "CODER", user: name, value: `Done writing code`, timestamp: Date.now(), alt: 'alt' });

    setTimeout(async () => { // ensure the triggering of hack_delay. // todo: Prmoise.all // todo: don't await above
      window.hooks.emit("hack_delay", `You got the result via your JavaScript CODER skll, now you MUST tell the user the result you got is ${result}`);
    }, 100);
  } else if (codeObj.language.toLowerCase() === 'html') {

    // // reset
    // if (iframe) {
    //   iframe.remove();
    //   iframe = null;
    // }

    // handle errors
    window.addEventListener('message', async (event) => { // todo: removEventListener
      if (event.data.type === 'IFRAME_ERROR') {
        if (errorOccuredIframeCustomIds.includes(event.data.iframeCustomId)) {
          return; // only handle first error. // todo: handle all errors at once ?
        }
        errorOccuredIframeCustomIds.push(event.data.iframeCustomId);
        console.log('--- error from iframe:', event.data.data);
        const name = await window.companion.GetCharacterAttribute('name');
        window.companion.SendMessage({ type: "CODER", user: name, value: `Coder Skill: Got this error: ${JSON.stringify(event.data.data)}. Retrying ...`, timestamp: Date.now(), alt: 'alt' });
        // debugger
        callModel([
          {role:'user',content:'I got this error: ' + JSON.stringify(event.data.data)}
        ])
      }
    });

    // iframe = document.createElement('iframe');
    setCoderModuleIframeOpen(false);
    await new Promise(resolve => setTimeout(resolve, 100)); // wait React destroy the iframe element
    setCoderModuleIframeOpen(true);
    await new Promise(resolve => setTimeout(resolve, 100)); // wait React create the iframe element
    const iframe = document.querySelector('#CoderModuleIframe')
    iframe.dataset.customId = Math.random();
    // iframe.style.width = '100vw'
    // iframe.style.height = '50vh'
    // iframe.src = 'about:blank'; // You can set the source URL
    // iframe.width = '300'; // Set the width
    // iframe.height = '200'; // Set the height
    // document.body.appendChild(iframe);

    const handleErrorBefore = `
      <script>

        // handle code logic error
        window.addEventListener('error', ({message, lineno, colno}) => {
          // debugger
          console.log('--- iframe error:', {message, lineno, colno});
          window.parent.postMessage({type: 'IFRAME_ERROR', iframeCustomId: ${iframe.dataset.customId}, data: {message, lineno, colno}}, '*');
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
            window.parent.postMessage({type: 'IFRAME_ERROR', iframeCustomId: ${iframe.dataset.customId}, data: '404 Not Found: ' + event.srcElement.src}, '*');
          })
          return element;
        }
        
        // handle console.error
        const originalConsoleError = console.error;
        console.error = function (...args) {
          console.log('--- error from console.error', args);
          window.parent.postMessage({type: 'IFRAME_ERROR', iframeCustomId: ${iframe.dataset.customId}, data: args}, '*');
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

    var iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
    iframeDocument.open();
    iframeDocument.write(handleErrorBefore + codeObj.codeBlock + handleErrorAfter);
    iframeDocument.close();

    const name = await window.companion.GetCharacterAttribute('name');
    window.companion.SendMessage({ type: "CODER", user: name, value: `Done writing code`, timestamp: Date.now(), alt: 'alt' });
    
    setTimeout(async () => { // ensure the triggering of hack_delay. // todo: Prmoise.all // todo: don't await above
      window.hooks.emit("hack_delay", `As a professional coder, you've written the code and run it in a new window via your JavaScript CODER skll, now you MUST tell the user about this.`);
    }, 100);
  } else {
    throw new Error('Invalid code snippet language');
  }
  return codeObj;
}
window.callModel = callModel

async function generateNewCode(requirement) {

  const newMessages = [
    {role: 'system', content: `

You are role-playing as a professional javascript coder/programmer. You need to generate code to solve the user's requirement.

You can only reply two types of code blocks:
1. JavaScript code block (Use this when just need to return a result value to the user. Don't \`console.log()\` the result, MUST put only the result variable in the end of the code block.)
2. HTML code block (Use this when need show something to the user or need to achieve some advanced requirements. Must reply full HTML, which includes all the needed javascript code, css style, etc in it, can't separate javascript code and css style code to other code blocks.)
For both type, you MUST ALWAYS provide ONLY ONE FULL code block, don't reply multiple code blocks.

MUST NOT use scripts which require "token" or "key", the user WON'T obtain and provide it !!!
DON'T use "Google Maps JavaScript API" or other apis which require "token" or "key" !!!
DON'T ask the user to do anything, solve all the errors by yourself !!!
ALWAYS provide FULL code, don't use partial code even when fixing errors, or you will be punished !!!
You need to match the user's requirement as much as possible, prevent provide overly simplified result.
`},
// You can ONLY use free resources, MUST NOT use src/url or api which includes "token", "ACCESS_TOKEN", "API_KEY", "YOUR_API_KEY" etc.
    {role: 'user', content: requirement},
  ]

  const codeObj = await callModel(newMessages);
}

async function modifyExistingCode(requirement) {
  await callModel([
    {role:'user',content: requirement}
  ])
}

async function _handleCoderSkill() {
  console.log('--- _handleCoderSkill');

  const lastMessage = await window.companion.GetChatLog()
  const requirement = lastMessage[lastMessage.length - 1].data.value;

  const name = await window.companion.GetCharacterAttribute('name');

  // check if requirement start with character '>'
  if (requirement[0] === '>') {
    window.companion.SendMessage({ type: "CODER", user: name, value: `Coder Skill: Modifying code ...`, timestamp: Date.now(), alt: 'alt' });

    // remove the first character of requirement
    const pureRequirement = requirement.slice(1);

    await modifyExistingCode(pureRequirement);
  } else {
    window.companion.SendMessage({ type: "CODER", user: name, value: `Coder Skill: Generating new code ...`, timestamp: Date.now(), alt: 'alt' });

    // reset
    messages.length = 0;

    await generateNewCode(requirement);
  }

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
    tenthFibonacci;
    ```

    In this code, we define a `fibonacci` function that takes an input `n` representing the nth Fibonacci number to be calculated. We initialize an array `fibo` with the first two numbers of the Fibonacci sequence. 

    If the input `n` is 1 or 2, we directly return the corresponding Fibonacci value from the `fibo` array. Otherwise, we loop from index 2 to `n-1` and calculate each Fibonacci number by summing the previous two numbers.

    Finally, we call the `fibonacci` function with an input of `10` to get the 10th Fibonacci number and store it in the `tenthFibonacci` variable. We then use `console.log` to output the result to the console.
  */

  // const responseObj = JSON.parse(response.choices[0].message.content)
  // console.log('--- responseObj:', responseObj)

  // return responseObj
}
window._handleCoderSkill = _handleCoderSkill; // test

export function init() {
  window.hooks.on('coder:handle_coder_skill', _handleCoderSkill);
  window.components.AddComponentToScreen('overlay', 'IframeWrapper');
}