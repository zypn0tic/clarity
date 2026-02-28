import { GoogleGenerativeAI } from '@google/generative-ai';

const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Housing',
  'Utilities',
  'Entertainment',
  'Shopping',
  'Healthcare',
  'Education',
  'Personal',
  'Travel',
  'Bills & Subscriptions',
  'Other',
];

const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Investment',
  'Gift',
  'Business',
  'Other',
];

function categorizeWithKeywords(description: string, type: string): string {
  const text = description.toLowerCase();

  if (type === 'income') {
    if (/(salary|payroll|paycheck|wage|stipend)/.test(text)) return 'Salary';
    if (/(freelance|client|contract|gig|invoice)/.test(text)) return 'Freelance';
    if (/(dividend|interest|stock|investment|mutual fund|crypto)/.test(text)) return 'Investment';
    if (/(gift|bonus|reward|cashback|refund)/.test(text)) return 'Gift';
    if (/(sale|revenue|business|shop|store|profit)/.test(text)) return 'Business';
    return 'Other';
  }

  if (/(coffee|restaurant|food|lunch|dinner|grocer|snack|pizza|burger|cafe|starbucks)/.test(text)) return 'Food & Dining';
  if (/(uber|lyft|taxi|bus|train|metro|fuel|gas|petrol|parking|toll|flight|airport)/.test(text)) return 'Transportation';
  if (/(rent|mortgage|apartment|house|maintenance)/.test(text)) return 'Housing';
  if (/(electric|water|internet|wifi|electricity|utility|bill)/.test(text)) return 'Utilities';
  if (/(movie|netflix|spotify|game|concert|party|cinema)/.test(text)) return 'Entertainment';
  if (/(amazon|mall|shopping|clothes|shoe|gadget|electronics)/.test(text)) return 'Shopping';
  if (/(doctor|hospital|pharmacy|medicine|clinic|health|dental|insurance)/.test(text)) return 'Healthcare';
  if (/(course|tuition|school|college|book|udemy|exam)/.test(text)) return 'Education';
  if (/(trip|hotel|vacation|travel|airbnb|tour)/.test(text)) return 'Travel';
  if (/(subscription|membership|saas|adobe|icloud|youtube|prime)/.test(text)) return 'Bills & Subscriptions';
  if (/(salon|barber|gym|personal|self-care|cosmetic)/.test(text)) return 'Personal';

  return 'Other';
}

/**
 * Use Gemini AI to categorize a transaction based on its description.
 * Falls back to 'Other' if AI is unavailable or fails.
 */
export async function categorizeWithAI(description: string, type: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    console.warn('GEMINI_API_KEY not set, using default category');
    return categorizeWithKeywords(description, type);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

    const prompt = `You are a financial transaction categorizer. Given the following transaction description, categorize it into exactly one of these categories: ${categories.join(', ')}.

Transaction description: "${description}"
Transaction type: ${type}

Respond with ONLY the category name, nothing else. If unsure, respond with "Other".`;

    const candidateModels = ['gemini-2.0-flash', 'gemini-1.5-flash'];

    let text = '';
    let lastError: unknown;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        text = result.response.text().trim();
        if (text) break;
      } catch (error) {
        lastError = error;
      }
    }

    if (!text) {
      if (lastError) {
        console.error('Gemini AI categorization error:', lastError);
      }
      return categorizeWithKeywords(description, type);
    }

    // Validate the response is one of our categories
    if (categories.includes(text)) {
      return text;
    }

    // Try to find a close match
    const normalizedText = text
      .replace(/^```(?:text)?\s*/i, '')
      .replace(/```$/i, '')
      .replace(/^category\s*[:\-]\s*/i, '')
      .replace(/["'*.]/g, '')
      .trim();
    const lowerText = normalizedText.toLowerCase();
    const match = categories.find((c) => c.toLowerCase() === lowerText);
    if (match) return match;

    const containsMatch = categories.find((c) => lowerText.includes(c.toLowerCase()));
    if (containsMatch) return containsMatch;

    return categorizeWithKeywords(description, type);
  } catch (error) {
    console.error('Gemini AI categorization error:', error);
    return categorizeWithKeywords(description, type);
  }
}

export { EXPENSE_CATEGORIES, INCOME_CATEGORIES };
