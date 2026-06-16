import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const categories = [
  'Food',
  'Rent',
  'Travel',
  'Shopping',
  'Entertainment',
  'Subscription',
  'Utilities',
  'Healthcare',
  'Education',
  'Salary',
  'Investment',
  'Other'
];

const buildPrompt = (transactions) => {
  const transactionLines = transactions
    .map((tx) => {
      const date = tx.date || 'Unknown Date';
      const description = tx.description || 'Unknown merchant';
      const amount = typeof tx.amount === 'number' ? tx.amount : tx.amount || 0;
      return `- Date: ${date}, Description: ${description}, Amount: ${amount}`;
    })
    .join('\n');

  return `You are a financial categorization assistant. Categorize each transaction into one of the allowed categories. Return JSON only, with an array of objects containing merchant, category, and reason. Do not include any explanation outside the JSON array. Use exactly these category names: ${categories.join(', ')}. If the merchant is unknown or the description does not match a known category, return category \"Other\" and merchant \"Unknown\" if needed.\n\nExample output format:\n[\n  {\n    \"merchant\": \"Swiggy\",\n    \"category\": \"Food\",\n    \"reason\": \"Food delivery platform\"\n  }\n]\n\nTransactions:\n${transactionLines}`;
};

const callOpenAI = async (prompt) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OpenAI API key in environment.');
  }

  const response = await fetch(`${process.env.OPENAI_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a JSON-only categorization assistant.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 500
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI service returned ${response.status}: ${text}`);
  }

  const parsed = await response.json();
  const content = parsed.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('AI response missing content.');
  }
  return content;
};

const parseAiResponse = (content) => {
  try {
    const jsonStart = content.indexOf('[');
    if (jsonStart === -1) {
      throw new Error('No JSON array found in AI response.');
    }

    const sliced = content.slice(jsonStart);
    const parsed = JSON.parse(sliced);
    if (!Array.isArray(parsed)) {
      throw new Error('AI response is not an array.');
    }
    return parsed.map((item) => ({
      merchant: item.merchant || item.description || 'Unknown',
      category: categories.includes(item.category) ? item.category : 'Other',
      reason: item.reason || 'Categorized by AI.'
    }));
  } catch (error) {
    throw new Error(`Failed to parse AI JSON response: ${error.message}. Raw response: ${content}`);
  }
};

router.post('/', async (req, res, next) => {
  try {
    const transactions = req.body.transactions;
    if (!Array.isArray(transactions) || !transactions.length) {
      return res.status(400).json({ error: 'Transactions payload is required.' });
    }

    const prompt = buildPrompt(transactions);
    const content = await callOpenAI(prompt);
    const categorization = parseAiResponse(content);

    const merged = transactions.map((tx) => {
      const match = categorization.find(
        (item) => item.merchant.toLowerCase() === tx.description.toLowerCase()
      );
      return {
        ...tx,
        category: match?.category || 'Other',
        reason: match?.reason || 'AI could not categorize precisely.'
      };
    });

    res.json({ transactions: merged });
  } catch (error) {
    next(error);
  }
});

export default router;
