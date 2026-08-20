export interface HuskyContext {
    level: number;
    status: 'win' | 'loss' | 'complete';
    reason?: string;
    bones: number;
    timeLeft?: number;
    failures: number;
    history: string[];
}

const FALLBACK_QUOTES = [
    "Awoooo! My nose knows the way home!",
    "Rurf! I just need a biscuit and I'll be fine.",
    "Ooooowowow! That was a bit ruff.",
    "Bork! I'm coming for you, warm bed!",
    "Awo! Shake it off, Onyx, shake it off!",
    "Boof! I am a strong independent husky!"
];

const getFallbackQuote = (): string => {
    return FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
};

export const getHuskyWisdom = async (context: HuskyContext): Promise<string> => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 15000);

    try {
        const response = await fetch('/api/husky-wisdom', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin',
            body: JSON.stringify(context),
            signal: controller.signal
        });

        if (!response.ok) {
            throw new Error(`Wisdom request failed with status ${response.status}`);
        }

        const data = await response.json() as { text?: unknown };
        if (typeof data.text !== 'string' || !data.text.trim()) {
            throw new Error('Wisdom response did not contain text');
        }

        return data.text.trim().replace(/^['"]|['"]$/g, '');
    } catch (error) {
        console.error('OpenRouter Error:', error);
        return getFallbackQuote();
    } finally {
        window.clearTimeout(timeoutId);
    }
};
