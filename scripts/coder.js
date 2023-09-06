


async function testFn() {
  // const output = eval('Math.sin(123)')
  // console.log('--- testFn output:', output)

  const context = {

    messages: [{role: 'user', content: `
You are role-playing as a professional javascript coder/programmer.
Now user asked: "What is the 10th fibonacci number?"
What the code do you need to write?
`
    }]
  }
  // console.log('--- prompt: ', context.messages[0].content);
  // console.log('--- context: ', context);

  // console.log('--- _handleCreateQuestionSkill prompt before await:', context.messages)
  const model = window.models.CreateModel('mafia_game:GPT 3.5 Turbo')
  context.messages = context.messages.map(message => JSON.stringify(message))
  window.models.ApplyContextObject(model, context);
  // console.log('--- payload module: ', window.models.GetModelWithContext(model))
  const response = await window.models.CallModel(model);
  // console.log('--- _handleCreateQuestionSkill prompt:', context.messages)
  // console.log('--- _handleCreateQuestionSkill response:', response)

  const responseContent = response.choices[0].message.content
  console.log('--- responseContent:', responseContent)
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