const display = document.getElementById("display");
const expressionDisplay = document.getElementById("expressionDisplay");
const buttons = document.querySelectorAll(".btn");
const historyList = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistory");

let currentInput = "";
let fullExpression = "";
let lastResult = "";
let awaitingPower = false;
let memory = 0;

let historyData = [];

const clickSound = new Audio(
  "https://cdn.freesound.org/previews/256/256113_3263906-lq.mp3"
);

function playClickSound() {
  clickSound.currentTime = 0;
  clickSound.play().catch(() => {});
}

function updateDisplays() {
  display.textContent = currentInput || "0";
  expressionDisplay.textContent = fullExpression;
}

function clearAll() {
  currentInput = "";
  fullExpression = "";
  lastResult = "";
  awaitingPower = false;
  updateDisplays();
}

function clearEntry() {
  currentInput = "";
  updateDisplays();
}

function appendToInput(num) {
  if (num === "." && currentInput.includes(".")) return; // prevent multiple dots
  if (currentInput === "0" && num !== ".") currentInput = num;
  else currentInput += num;
  updateDisplays();
}

function handleOperator(op) {
  if (currentInput === "" && fullExpression === "") return; // ignore starting op

  if (currentInput === "" && fullExpression !== "") {
    // change last operator if double pressed
    if (/[+\-*/%]$/.test(fullExpression)) {
      fullExpression = fullExpression.slice(0, -1) + op;
      updateDisplays();
      return;
    }
  }

  if (currentInput !== "") {
    fullExpression += currentInput + op;
    currentInput = "";
  } else if (lastResult !== "") {
    fullExpression = lastResult + op;
  }
  updateDisplays();
}

function handleEquals() {
  if (awaitingPower && currentInput !== "") {
    fullExpression += currentInput;
    currentInput = "";
    awaitingPower = false;
  } else if (currentInput !== "") {
    fullExpression += currentInput;
  }

  if (fullExpression === "") return;

  const result = calculate(fullExpression);
  display.textContent = result;
  expressionDisplay.textContent = fullExpression + " =";
  lastResult = result;
  currentInput = "";

  addToHistory(fullExpression, result);

  fullExpression = "";
  awaitingPower = false;
}

function calculate(expr) {
  try {
    // Replace ^ with ** for exponentiation
    expr = expr.replace(/(\d+(\.\d+)?)\^(\d+(\.\d+)?)/g, "Math.pow($1,$3)");
    // Also replace standalone ^ with ** for eval
    expr = expr.replace(/\^/g, "**");

    // Avoid dangerous code by allowing only digits and operators
    if (/[^0-9+\-*/%.()Mathpow ]/.test(expr)) return "Error";

    // eslint-disable-next-line no-eval
    let result = eval(expr);

    if (typeof result === "number" && !isFinite(result)) return "Error";

    if (typeof result === "number") {
      // Round to max 12 decimals
      result = +result.toFixed(12);
    }

    return result.toString();
  } catch {
    return "Error";
  }
}

// Memory functions
function memoryClear() {
  memory = 0;
}

function memoryRecall() {
  currentInput = memory.toString();
  updateDisplays();
}

function memoryAdd() {
  if (currentInput !== "") {
    memory += parseFloat(currentInput);
  }
}

function memorySubtract() {
  if (currentInput !== "") {
    memory -= parseFloat(currentInput);
  }
}

// History management
function addToHistory(expression, result) {
  if (result === "Error" || result === "") return;

  historyData.unshift({ expression, result });

  if (historyData.length > 20) historyData.pop();

  renderHistory();
}

function renderHistory() {
  historyList.innerHTML = "";
  historyData.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = `${item.expression} = ${item.result}`;
    li.title = "Click to reuse this calculation";
    li.addEventListener("click", () => {
      fullExpression = item.expression;
      currentInput = item.result;
      lastResult = item.result;
      updateDisplays();
    });
    historyList.appendChild(li);
  });
}

clearHistoryBtn.addEventListener("click", () => {
  historyData = [];
  renderHistory();
});

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    playClickSound();

    const num = button.getAttribute("data-num");
    const op = button.getAttribute("data-op");
    const func = button.getAttribute("data-func");
    const id = button.id;

    if (id === "clear") clearAll();
    else if (id === "clear-entry") clearEntry();
    else if (id === "mc") memoryClear();
    else if (id === "mr") memoryRecall();
    else if (id === "mplus") memoryAdd();
    else if (id === "mminus") memorySubtract();
    else if (id === "percent") handleOperator("%");
    else if (id === "equals") handleEquals();
    else if (num !== null) appendToInput(num);
    else if (op !== null) handleOperator(op);
  });
});

window.addEventListener("keydown", (e) => {
  // Play sound on valid keys only
  const validKeys = "0123456789.+-*/%()^=";
  if (
    validKeys.includes(e.key) ||
    e.key === "Enter" ||
    e.key === "Backspace" ||
    e.key === "Escape"
  ) {
    playClickSound();
  }

  if (e.key >= "0" && e.key <= "9") {
    appendToInput(e.key);
  } else if (e.key === ".") {
    appendToInput(".");
  } else if (["+", "-", "*", "/", "%"].includes(e.key)) {
    handleOperator(e.key);
  } else if (e.key === "Enter" || e.key === "=") {
    e.preventDefault();
    handleEquals();
  } else if (e.key === "Backspace") {
    currentInput = currentInput.slice(0, -1);
    updateDisplays();
  } else if (e.key === "Escape") {
    clearAll();
  }
});

// Initialize display
updateDisplays();
renderHistory();
