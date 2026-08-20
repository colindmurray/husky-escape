
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export interface HuskyContext {
    level: number;
    status: 'win' | 'loss' | 'complete';
    reason?: string;
    bones: number;
    timeLeft?: number;
    failures: number;
    history: string[];
}

const LEVEL_THEMES: Record<number, string> = {
    1: "the cold steel of the pound cells",
    2: "the maze of the dog pound hallway",
    3: "the spooky, dark whispering forest",
    4: "the sunny beach with its pinchy red crabs",
    5: "the steep, rocky mountain peak with hungry wolves",
    6: "the slippery, fast snow slopes of the mountain",
    7: "the terrifying open field being chased by the dog-catcher",
    8: "the deep, scary blue ocean with jellyfish and sharks",
    9: "the stormy, lightning-filled pier with those mean seagulls"
};

const FALLBACK_QUOTES = [
    "Awoooo! My nose knows the way home!",
    "Rurf! I just need a biscuit and I'll be fine.",
    "Ooooowowow! That was a bit ruff.",
    "Bork! I'm coming for you, warm bed!",
    "Awo! Shake it off, Onyx, shake it off!",
    "Boof! I am a strong independent husky!"
];

export const getHuskyWisdom = async (context: HuskyContext): Promise<string> => {
    try {
        const { level, status, reason, bones, timeLeft, failures, history } = context;
        const theme = LEVEL_THEMES[level] || "the unknown trail";
        const totalBones = 3;
        
        let specificEvent = "";
        let speedContext = "Average pace";

        // Calculate speed context
        if (timeLeft !== undefined) {
             if (timeLeft > 260) speedContext = "Super fast! Zooming energy!";
             else if (timeLeft > 150) speedContext = "Good steady trot.";
             else if (timeLeft < 50) speedContext = "Very slow, almost ran out of time.";
        }

        const failMap: Record<string, string> = {
            'timeout': "Ran out of time (too much sniffing).",
            'fall': "Fell off the path into the abyss.",
            'drowned': "Fell into deep water (HATES water).",
            'caught': "Got caught by the dog-catcher's net.",
            'wolfed': "Got scared away by a mean wolf.",
            'crabbed': "Got pinched by a crab claw.",
            'spiked': "Sat on a sharp porcupine.",
            'stung': "Got stung by a jellyfish.",
            'seagulled': "Got dive-bombed by a seagull.",
            'snowballed': "Got flattened by a giant snowball."
        };

        // Determine specific event description
        if (status === 'complete') {
            specificEvent = `Successfully navigated ${theme}.`;
        } else if (status === 'loss') {
            specificEvent = failMap[reason || ''] || "Made a clumsy mistake and failed.";
        } else if (status === 'win') {
            specificEvent = "BEAT THE GAME! Escaped the pound, crossed the wild, and found the family home.";
        }

        // Parse history for repeated failures
        const historyStr = history.length > 0 ? history.join(", ") : "First attempt";
        let historyContext = `Event Log for this level: [${historyStr}]`;
        
        // Check for patterns
        if (history.length > 2) {
             const last3 = history.slice(-3);
             if (last3.every(h => h === last3[0])) {
                 historyContext += ` (Note: I keep failing due to '${last3[0]}' over and over! I should be annoyed about this specific repeated failure.)`;
             }
        }

        const userContent = `
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
        Analyze the 'History'. If I am failing repeatedly at the same thing (like falling or drowning), express frustration about that specific trap.
        If I finally succeeded after many failures, express relief or declare that the obstacle has been "conquered".

        RULES:
        1. Perspective: First Person ("I").
        2. Length: VERY SHORT. Max 2 sentences.
        3. Format: Include a loud husky noise (Awooo, Bork, etc) separate from the sentence.
        4. Tone: If failed many times -> Frustrated, dramatic, blaming the game. If won after failures -> "Finally!", "About time!".
        5. MEME FACTOR: High.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: userContent,
            config: {
                systemInstruction: `You are Onyx, the sassiest female Husky on the internet. 
                You respond in short, punchy, meme-filled sentences. 
                You are a diva. You are never wrong, the world is just difficult.
                You love bones above all else.`,
                temperature: 1.1, 
                maxOutputTokens: 600,
                safetySettings: [
                    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
                ]
            },
        });

        const text = response.text;
        if (!text) return FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
        
        return text.trim().replace(/^["']|["']$/g, '');

    } catch (error) {
        console.error("Gemini Error:", error);
        return FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
    }
};
