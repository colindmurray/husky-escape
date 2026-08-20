export const OPENROUTER_MODEL = 'nvidia/nemotron-3.5-lightning:free';
export const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export const HUSKY_SYSTEM_PROMPT = `You are Onyx, the sassiest female Husky on the internet.
You respond in short, punchy, meme-filled sentences.
You are a diva. You are never wrong; the world is just difficult.
You love bones above all else.`;

const LEVEL_THEMES = {
    1: 'the cold steel of the pound cells',
    2: 'the maze of the dog pound hallway',
    3: 'the spooky, dark whispering forest',
    4: 'the sunny beach with its pinchy red crabs',
    5: 'the steep, rocky mountain peak with hungry wolves',
    6: 'the slippery, fast snow slopes of the mountain',
    7: 'the terrifying open field being chased by the dog-catcher',
    8: 'the deep, scary blue ocean with jellyfish and sharks',
    9: 'the stormy, lightning-filled pier with those mean seagulls',
    10: 'the final neighborhood route leading all the way home'
};

const FAILURE_DESCRIPTIONS = {
    timeout: 'Ran out of time (too much sniffing).',
    fall: 'Fell off the path into the abyss.',
    drowned: 'Fell into deep water (HATES water).',
    caught: "Got caught by the dog-catcher's net.",
    wolfed: 'Got scared away by a mean wolf.',
    crabbed: 'Got pinched by a crab claw.',
    spiked: 'Sat on a sharp porcupine.',
    stung: 'Got stung by a jellyfish.',
    seagulled: 'Got dive-bombed by a seagull.',
    snowballed: 'Got flattened by a giant snowball.',
    debris: 'Got bonked by falling construction debris.',
    excavator: 'Got caught by a construction excavator.'
};

const clamp = (value, minimum, maximum) => {
    return Math.min(maximum, Math.max(minimum, value));
};

export const normalizeHuskyContext = (input) => {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        return null;
    }

    const level = Number(input.level);
    const bones = Number(input.bones);
    const failures = Number(input.failures);
    const timeLeft = input.timeLeft === undefined ? undefined : Number(input.timeLeft);
    const status = input.status;

    if (!Number.isInteger(level) || level < 1 || level > 10) {
        return null;
    }
    if (!Number.isInteger(bones) || bones < 0 || bones > 3) {
        return null;
    }
    if (!Number.isInteger(failures) || failures < 0 || failures > 1000) {
        return null;
    }
    if (timeLeft !== undefined && (!Number.isFinite(timeLeft) || timeLeft < 0 || timeLeft > 600)) {
        return null;
    }
    if (!['win', 'loss', 'complete'].includes(status)) {
        return null;
    }

    const history = Array.isArray(input.history)
        ? input.history
            .filter((entry) => typeof entry === 'string')
            .slice(-10)
            .map((entry) => entry.slice(0, 160))
        : [];

    return {
        level,
        status,
        reason: typeof input.reason === 'string' ? input.reason.slice(0, 80) : '',
        bones,
        timeLeft: timeLeft === undefined ? undefined : clamp(timeLeft, 0, 600),
        failures,
        history
    };
};

export const buildHuskyPrompt = (context) => {
    const {
        level,
        status,
        reason,
        bones,
        timeLeft,
        failures,
        history
    } = context;
    const theme = LEVEL_THEMES[level] || 'the unknown trail';
    const totalBones = 3;

    let specificEvent = '';
    let speedContext = 'Average pace';

    if (timeLeft !== undefined) {
        if (timeLeft > 260) {
            speedContext = 'Super fast! Zooming energy!';
        } else if (timeLeft > 150) {
            speedContext = 'Good steady trot.';
        } else if (timeLeft < 50) {
            speedContext = 'Very slow, almost ran out of time.';
        }
    }

    if (status === 'complete') {
        specificEvent = `Successfully navigated ${theme}.`;
    } else if (status === 'loss') {
        specificEvent = FAILURE_DESCRIPTIONS[reason] || 'Made a clumsy mistake and failed.';
    } else if (status === 'win') {
        specificEvent = 'BEAT THE GAME! Escaped the pound, crossed the wild, and found the family home.';
    }

    const historyString = history.length > 0 ? history.join(', ') : 'First attempt';
    let historyContext = `Event Log for this level: [${historyString}]`;

    if (history.length > 2) {
        const lastThree = history.slice(-3);
        if (lastThree.every((entry) => entry === lastThree[0])) {
            historyContext += ` (Note: I keep failing due to '${lastThree[0]}' over and over! I should be annoyed about this specific repeated failure.)`;
        }
    }

    return `
BIO:
You are Onyx, a female Husky.
Traits: Sassy, Elegant, Diva, Dramatic, Queen of the Park.
Likes: Snacks, Soft Beds, Zoomies.
Dislikes: Water, Baths, Rude Animals, Being Caught.
Language: Uses "doge" speak (heckin, bamboozled, chimken, mlem, hooman) but with a high-class attitude.

CONTEXT:
- Status: ${status.toUpperCase()}
- Location: Level ${level} (${theme})
- What Happened: ${specificEvent}
- Performance: ${speedContext}
- Snacks Found: ${bones} out of ${totalBones} bones collected.
- Attempts at this level: ${failures}
- History: ${historyContext}

TASK:
Write Onyx's inner monologue reaction to this moment.
Analyze the History. If I am failing repeatedly at the same thing (like falling or drowning), express frustration about that specific trap.
If I finally succeeded after many failures, express relief or declare that the obstacle has been "conquered".

RULES:
1. Perspective: First Person ("I").
2. Length: VERY SHORT. Max 2 sentences.
3. Format: Include a loud husky noise (Awooo, Bork, etc) separate from the sentence.
4. Tone: If failed many times -> Frustrated, dramatic, blaming the game. If won after failures -> "Finally!", "About time!".
5. MEME FACTOR: High.
`;
};

export const extractChatText = (payload) => {
    const content = payload?.choices?.[0]?.message?.content;

    if (typeof content === 'string') {
        return content;
    }

    if (Array.isArray(content)) {
        return content
            .filter((part) => part && typeof part.text === 'string')
            .map((part) => part.text)
            .join(' ');
    }

    return '';
};
