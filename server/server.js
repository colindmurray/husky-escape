require('dotenv').config();

const express = require('express');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const port = Number(process.env.PORT || 3000);
const apiKey = process.env.OPENROUTER_API_KEY;
const distDirectory = path.join(__dirname, '..', 'dist');

const wisdomRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 60,
    standardHeaders: 'draft-8',
    legacyHeaders: false
});

app.use(express.json({ limit: '16kb' }));

app.post('/api/husky-wisdom', wisdomRateLimit, async (request, response) => {
    if (!apiKey) {
        return response.status(503).json({ error: 'AI service is not configured' });
    }

    try {
        const {
            HUSKY_SYSTEM_PROMPT,
            OPENROUTER_MODEL,
            OPENROUTER_URL,
            buildHuskyPrompt,
            extractChatText,
            normalizeHuskyContext
        } = await import('../shared/huskyWisdom.js');
        const context = normalizeHuskyContext(request.body);

        if (!context) {
            return response.status(400).json({ error: 'Invalid game context' });
        }

        const upstreamResponse = await fetch(OPENROUTER_URL, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://huskyescape.com',
                'X-Title': 'Husky Escape'
            },
            body: JSON.stringify({
                model: OPENROUTER_MODEL,
                messages: [
                    {
                        role: 'system',
                        content: HUSKY_SYSTEM_PROMPT
                    },
                    {
                        role: 'user',
                        content: buildHuskyPrompt(context)
                    }
                ],
                temperature: 1.1,
                max_tokens: 120,
                reasoning: {
                    effort: 'none',
                    exclude: true
                }
            })
        });

        if (!upstreamResponse.ok) {
            console.error(`OpenRouter returned HTTP ${upstreamResponse.status}`);
            return response.status(502).json({ error: 'AI service is temporarily unavailable' });
        }

        const payload = await upstreamResponse.json();
        const text = extractChatText(payload).trim().replace(/^['"]|['"]$/g, '');

        if (!text) {
            console.error('OpenRouter returned no message content');
            return response.status(502).json({ error: 'AI service returned an empty response' });
        }

        return response.json({ text });
    } catch (error) {
        console.error(
            'OpenRouter request failed:',
            error instanceof Error ? error.message : 'Unknown error'
        );
        return response.status(502).json({ error: 'AI service is temporarily unavailable' });
    }
});

app.use((error, request, response, next) => {
    if (error.type === 'entity.too.large') {
        return response.status(413).json({ error: 'Request body is too large' });
    }

    return next(error);
});

app.use(express.static(distDirectory));

app.get('*', (request, response) => {
    response.sendFile(path.join(distDirectory, 'index.html'));
});

app.listen(port, () => {
    console.log(`Husky Escape server listening on port ${port}`);
});
