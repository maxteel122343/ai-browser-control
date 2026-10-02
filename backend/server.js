import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import puppeteer from 'puppeteer-core';
import * as chromeLauncher from 'chrome-launcher';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

let browser = null, page = null, chrome = null;

// Multi-AI Provider Support
async function callAI(provider, apiKey, model, prompt) {
  switch (provider.toLowerCase()) {
    case 'gemini':
      return await callGemini(apiKey, model, prompt);
    case 'openai':
      return await callOpenAI(apiKey, model, prompt);
    case 'anthropic':
      return await callAnthropic(apiKey, model, prompt);
    case 'groq':
      return await callGroq(apiKey, model, prompt);
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

// Gemini API
async function callGemini(apiKey, model, prompt) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const geminiModel = genAI.getGenerativeModel({ model: model || 'gemini-flash-latest' });
  const result = await geminiModel.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

// OpenAI API (GPT)
async function callOpenAI(apiKey, model, prompt) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'OpenAI API error');
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Anthropic API (Claude)
async function callAnthropic(apiKey, model, prompt) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: model || 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Anthropic API error');
  }

  const data = await response.json();
  return data.content[0].text;
}

// Groq API (Fast Llama)
async function callGroq(apiKey, model, prompt) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model || 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Groq API error');
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function launchBrowser() {
  try {
    if (browser) return { success: true, message: 'Browser already running' };

    chrome = await chromeLauncher.launch({
      chromeFlags: ['--disable-blink-features=AutomationControlled']
    });

    browser = await puppeteer.connect({
      browserURL: `http://localhost:${chrome.port}`,
      defaultViewport: null
    });

    const pages = await browser.pages();
    page = pages[0] || await browser.newPage();
    return { success: true, message: 'Browser launched successfully' };
  } catch (error) {
    console.error('Launch error:', error);
    return { success: false, message: error.message };
  }
}

async function closeBrowser() {
  try {
    if (page) await page.close();
    if (browser) await browser.disconnect();
    if (chrome) await chrome.kill();
    browser = page = chrome = null;
    return { success: true, message: 'Browser closed' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function interpretCommand(command, provider, apiKey, model) {
  const prompt = `You are a browser automation assistant. Convert this command to a JSON array of browser actions.
  
Command: "${command}"

Supported Actions:
- navigate: { "action": "navigate", "url": "https://example.com" }
- click: { "action": "click", "selector": "button.submit" }
- type: { "action": "type", "selector": "input#search", "text": "hello" }
- scroll: { "action": "scroll", "direction": "down" }
- screenshot: { "action": "screenshot" }
- wait: { "action": "wait", "milliseconds": 2000 }

Return ONLY the JSON array. Example:
[{"action": "navigate", "url": "https://google.com"}, {"action": "type", "selector": "textarea[name='q']", "text": "cats"}]`;

  try {
    const text = await callAI(provider, apiKey, model, prompt);

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response as JSON');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('AI Error:', error);
    return [{ action: 'error', message: error.message }];
  }
}

async function executeActions(actions) {
  if (!page) return { success: false, message: 'Browser not launched' };
  const results = [];

  for (const actionObj of actions) {
    try {
      const { action, ...params } = actionObj;

      if (action === 'error') {
        results.push({ action, success: false, message: params.message });
        continue;
      }

      switch (action) {
        case 'navigate':
          await page.goto(params.url, { waitUntil: 'domcontentloaded' });
          results.push({ action, success: true, message: `Navigated to ${params.url}` });
          break;
        case 'click':
          await page.waitForSelector(params.selector, { timeout: 5000 });
          await page.click(params.selector);
          results.push({ action, success: true, message: `Clicked ${params.selector}` });
          break;
        case 'type':
          await page.waitForSelector(params.selector, { timeout: 5000 });
          await page.type(params.selector, params.text);
          results.push({ action, success: true, message: `Typed "${params.text}"` });
          break;
        case 'scroll':
          await page.evaluate((dir) => window.scrollBy(0, dir === 'down' ? 500 : -500), params.direction);
          results.push({ action, success: true, message: `Scrolled ${params.direction}` });
          break;
        case 'screenshot':
          const screenshot = await page.screenshot({ encoding: 'base64' });
          results.push({ action, success: true, data: screenshot });
          break;
        case 'wait':
          await page.waitForTimeout(params.milliseconds);
          results.push({ action, success: true, message: `Waited ${params.milliseconds}ms` });
          break;
        default:
          results.push({ action, success: false, message: `Unknown action: ${action}` });
      }
    } catch (error) {
      results.push({ action: actionObj.action, success: false, message: error.message });
    }
  }
  return { success: true, results };
}

app.post('/api/launch', async (req, res) => res.json(await launchBrowser()));
app.post('/api/close', async (req, res) => res.json(await closeBrowser()));

app.post('/api/command', async (req, res) => {
  const { command } = req.body;
  const provider = req.headers['x-ai-provider'] || 'gemini';
  const apiKey = req.headers['x-api-key'];
  const model = req.headers['x-ai-model'];

  if (!command) return res.status(400).json({ success: false, message: 'Command required' });
  if (!apiKey) return res.status(400).json({ success: false, message: 'API Key required' });

  const actions = await interpretCommand(command, provider, apiKey, model);
  const result = await executeActions(actions);

  res.json({ ...result, actions });
});

app.get('/api/status', async (req, res) => res.json({
  browserRunning: browser !== null,
  pageUrl: page ? await page.url() : null
}));

app.listen(PORT, () => console.log(`🚀 Multi-AI Browser Control Server on http://localhost:${PORT}`));
