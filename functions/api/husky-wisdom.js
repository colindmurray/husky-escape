import {
    HUSKY_SYSTEM_PROMPT,
    OPENROUTER_MODEL,
    OPENROUTER_URL,
    buildHuskyPrompt,
    extractChatText,
    normalizeHuskyContext
} from '../../shared/huskyWisdom.js';

const MAX_BODY_BYTES = 16 * 1024;

const json = (body, status = 200) => {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            'Cache-Control': 'no-store',
            'Content-Type': 'application/json; charset=UTF-8'
        }
    });
};

const isSameOriginRequest = (request) => {
    const origin = request.headers.get('Origin');
    return !origin || origin === new URL(request.url).origin;
};

export const onRequestGet = () => {
    return json({ error: 'Method not allowed' }, 405);
};

export const onRequestPost = async ({ request, env }) => {
    if (!isSameOriginRequest(request)) {
        return json({ error: 'Cross-origin requests are not allowed' }, 403);
    }

    if (!env.OPENROUTER_API_KEY) {
        return json({ error: 'AI service is not configured' }, 503);
    }

    let rawBody;
    try {
        rawBody = await request.text();
    } catch {
        return json({ error: 'Invalid request body' }, 400);
    }

    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
        return json({ error: 'Request body is too large' }, 413);
    }

    let input;
    try {
        input = JSON.parse(rawBody);
    } catch {
        return json({ error: 'Request body must be valid JSON' }, 400);
    }

    const context = normalizeHuskyContext(input);
    if (!context) {
        return json({ error: 'Invalid game context' }, 400);
    }

    try {
        const upstreamResponse = await fetch(OPENROUTER_URL, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
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
            return json({ error: 'AI service is temporarily unavailable' }, 502);
        }

        const payload = await upstreamResponse.json();
        const text = extractChatText(payload).trim().replace(/^['"]|['"]$/g, '');

        if (!text) {
            console.error('OpenRouter returned no message content');
            return json({ error: 'AI service returned an empty response' }, 502);
        }

        return json({ text });
    } catch (error) {
        console.error(
            'OpenRouter request failed:',
            error instanceof Error ? error.message : 'Unknown error'
        );
        return json({ error: 'AI service is temporarily unavailable' }, 502);
    }
};
