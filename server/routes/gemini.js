
const express = require("express");
const router = express.Router();
const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Improved JSON parsing functions with better error handling
function cleanAndParseJSON(reply) {
  try {
    // Remove code blocks and extra whitespace
    let cleaned = reply
      .replace(/```json\s*/g, "")
      .replace(/```/g, "")
      .trim();

    // Find JSON object boundaries
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (start !== -1 && end !== -1) {
      cleaned = cleaned.substring(start, end + 1);
    }

    // Clean control characters that break JSON parsing
    cleaned = cleaned
      // Replace problematic control characters with spaces
      .replace(/[\x00-\x1F\x7F-\x9F]/g, " ")
      // Clean up multiple spaces
      .replace(/\s+/g, " ")
      // Fix common JSON issues
      .replace(/,(\s*[}\]])/g, "$1") // Remove trailing commas
      .replace(/([}\]])(\s*)([{\[])/g, "$1,$2$3"); // Add missing commas between objects/arrays

    // Try parsing the cleaned JSON
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("JSON parsing failed after cleaning:", error);

    // Alternative approach: Extract fields manually using regex
    try {
      // Use the cleaned variable from above, or fall back to original reply
      const textToProcess = typeof cleaned !== 'undefined' ? cleaned : reply;
      
      // More robust regex patterns
      const storyMatch = textToProcess.match(/"story"\s*:\s*"((?:[^"\\]|\\[\\"\/bfnrt]|\\u[0-9a-fA-F]{4})*)"/s);
      const choicesMatch = textToProcess.match(/"choices"\s*:\s*\[(.*?)\]/s);
      const isEndingMatch = textToProcess.match(/"isEnding"\s*:\s*(true|false)/);
      const imagePromptMatch = textToProcess.match(/"imagePrompt"\s*:\s*"((?:[^"\\]|\\[\\"\/bfnrt]|\\u[0-9a-fA-F]{4})*)"/s);
      const endingTypeMatch = textToProcess.match(/"endingType"\s*:\s*"((?:[^"\\]|\\.)*)"/);

      let choices = [];
      if (choicesMatch) {
        try {
          // Try to parse choices as JSON array first
          const choicesArrayStr = `[${choicesMatch[1]}]`;
          choices = JSON.parse(choicesArrayStr);
        } catch (choicesError) {
          // Fallback: Extract individual choices with regex
          const choiceMatches = choicesMatch[1].match(/"([^"]*)"/g);
          if (choiceMatches) {
            choices = choiceMatches.map((match) => match.slice(1, -1)); // Remove quotes
          }
        }
      }

      const result = {
        story: storyMatch
          ? unescapeJsonString(storyMatch[1])
          : "Story extraction failed",
        choices: choices,
        isEnding: isEndingMatch ? isEndingMatch[1] === "true" : false,
        imagePrompt: imagePromptMatch 
          ? unescapeJsonString(imagePromptMatch[1])
          : null,
      };

      // Add endingType if present
      if (endingTypeMatch) {
        result.endingType = unescapeJsonString(endingTypeMatch[1]);
      }

      return result;
    } catch (regexError) {
      console.error("Regex extraction also failed:", regexError);
      throw new Error("Complete JSON parsing failure");
    }
  }
}

// Helper function to properly unescape JSON strings
function unescapeJsonString(str) {
  if (typeof str !== "string") return str;
  
  return str
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\f/g, '\f')
    .replace(/\\b/g, '\b')
    .replace(/\\u([0-9a-fA-F]{4})/g, (match, code) => String.fromCharCode(parseInt(code, 16)));
}

// Enhanced version that pre-processes the response
function robustJSONParse(reply) {
  try {
    // Remove any leading/trailing whitespace
    let processed = reply.trim();
    
    // Remove code blocks
    processed = processed
      .replace(/```json\s*/g, "")
      .replace(/```/g, "")
      .trim();

    // Find the JSON object boundaries more carefully
    const start = processed.indexOf("{");
    let braceCount = 0;
    let end = -1;
    
    // Find the matching closing brace
    for (let i = start; i < processed.length; i++) {
      if (processed[i] === '{') braceCount++;
      if (processed[i] === '}') {
        braceCount--;
        if (braceCount === 0) {
          end = i;
          break;
        }
      }
    }

    if (start !== -1 && end !== -1) {
      processed = processed.substring(start, end + 1);
    }

    // Try direct parsing first
    try {
      return JSON.parse(processed);
    } catch (directError) {
      // If direct parsing fails, try cleaning approach
      console.log("Direct parsing failed, trying cleaning approach");
      return cleanAndParseJSON(processed);
    }
    
  } catch (error) {
    console.error("All JSON parsing attempts failed:", error);
    // Final fallback to regex extraction
    return extractWithFallback(reply);
  }
}

// Final fallback extraction method
function extractWithFallback(reply) {
  console.log("Using fallback extraction method");
  
  try {
    // Extract story content
    let storyContent = "Failed to extract story content";
    const storyPatterns = [
      /"story"\s*:\s*"((?:[^"\\]|\\.)*)"/s,
      /"story"\s*:\s*'((?:[^'\\]|\\.)*')'/s,
      /story["\s]*:["\s]*(.*?)["]/s
    ];
    
    for (const pattern of storyPatterns) {
      const match = reply.match(pattern);
      if (match) {
        storyContent = unescapeJsonString(match[1]);
        break;
      }
    }
    
    // Extract choices
    let choices = [];
    const choicesPattern = /"choices"\s*:\s*\[(.*?)\]/s;
    const choicesMatch = reply.match(choicesPattern);
    
    if (choicesMatch) {
      const choiceMatches = choicesMatch[1].match(/"([^"]*)"/g);
      if (choiceMatches) {
        choices = choiceMatches.map(match => match.slice(1, -1));
      }
    }
    
    // Extract isEnding
    const isEndingMatch = reply.match(/"isEnding"\s*:\s*(true|false)/);
    const isEnding = isEndingMatch ? isEndingMatch[1] === "true" : false;
    
    // Extract imagePrompt
    const imagePromptMatch = reply.match(/"imagePrompt"\s*:\s*"((?:[^"\\]|\\.)*)"/s);
    const imagePrompt = imagePromptMatch ? unescapeJsonString(imagePromptMatch[1]) : null;
    
    // Extract endingType
    const endingTypeMatch = reply.match(/"endingType"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    const endingType = endingTypeMatch ? unescapeJsonString(endingTypeMatch[1]) : undefined;
    
    const result = {
      story: storyContent,
      choices: choices,
      isEnding: isEnding,
      imagePrompt: imagePrompt
    };
    
    if (endingType) {
      result.endingType = endingType;
    }
    
    return result;
    
  } catch (fallbackError) {
    console.error("Even fallback extraction failed:", fallbackError);
    
    // Absolute last resort
    return {
      story: "An error occurred while processing the story. Please try again.",
      choices: ["Continue", "Try different approach", "Start over"],
      isEnding: false,
      imagePrompt: "error scene, technical difficulties"
    };
  }
}

// Enhanced extractVisualElements function for backend
function extractVisualElements(storyText, characterDetails = {}) {
  if (!storyText || typeof storyText !== 'string') {
    return "fantasy scene with mysterious atmosphere, anime style, detailed digital art";
  }

  const text = storyText.toLowerCase();
  
  // Character info with fallbacks
  const characterName = characterDetails.name || "protagonist";
  const characterGender = characterDetails.gender || "person";
  
  // Extract specific scene elements with priority
  const sceneAnalysis = {
    // Primary setting
    setting: extractSetting(text),
    // Current action/situation
    action: extractAction(text),
    // Emotional tone
    mood: extractMood(text),
    // Important objects/characters
    elements: extractElements(text),
    // Time and weather
    timeWeather: extractTimeWeather(text)
  };
  
  // Build comprehensive prompt
  let prompt = `${characterGender} named ${characterName}`;
  
  if (sceneAnalysis.action) {
    prompt += ` ${sceneAnalysis.action}`;
  }
  
  prompt += ` in ${sceneAnalysis.setting}`;
  
  if (sceneAnalysis.elements.length > 0) {
    prompt += `, ${sceneAnalysis.elements.slice(0, 2).join(', ')} visible`;
  }
  
  if (sceneAnalysis.timeWeather) {
    prompt += `, ${sceneAnalysis.timeWeather}`;
  }
  
  prompt += `, ${sceneAnalysis.mood}, anime style, detailed digital art, cinematic lighting`;
  
  return prompt;
}

function extractSetting(text) {
  // Specific location patterns
  const specificSettings = {
    'throne room': 'ornate throne room with golden decorations',
    'dungeon cell': 'dark stone dungeon with iron bars',
    'ancient temple': 'mystical ancient temple with glowing runes',
    'dark forest': 'dark forest with twisted ancient trees',
    'enchanted forest': 'magical forest with glowing mushrooms',
    'castle hall': 'grand castle hall with tapestries',
    'village square': 'medieval village square with market stalls',
    'mountain path': 'treacherous mountain path with cliff edges',
    'desert ruins': 'ancient desert ruins half-buried in sand',
    'ocean cliff': 'dramatic cliff overlooking stormy ocean',
    'crystal cave': 'cave filled with luminescent crystals',
    'royal garden': 'elaborate royal garden with fountains',
    'battlefield': 'chaotic battlefield with smoke and banners',
    'wizard tower': 'tall wizard tower with magical energy',
    'underground chamber': 'mysterious underground chamber with torches'
  };
  
  // Check for specific compound locations first
  for (const [key, value] of Object.entries(specificSettings)) {
    if (text.includes(key.replace(' ', '')) || text.includes(key)) {
      return value;
    }
  }
  
  // Single word locations
  const locations = {
    'forest': 'dense forest with towering trees',
    'castle': 'medieval stone castle',
    'city': 'bustling medieval city',
    'dungeon': 'dark stone dungeon',
    'mountain': 'majestic mountain landscape',
    'desert': 'vast desert with sand dunes',
    'ocean': 'vast ocean with rolling waves',
    'cave': 'mysterious cave with rock formations',
    'temple': 'ancient temple with stone pillars',
    'palace': 'ornate royal palace',
    'tower': 'tall stone tower',
    'bridge': 'stone bridge over water',
    'garden': 'beautiful garden with flowers',
    'library': 'grand library with countless books'
  };
  
  for (const [key, value] of Object.entries(locations)) {
    if (text.includes(key)) {
      return value;
    }
  }
  
  return 'fantasy landscape';
}

function extractAction(text) {
  const actionPatterns = {
    // Combat actions
    'fighting': 'engaged in fierce combat',
    'attacking': 'launching a powerful attack',
    'defending': 'in defensive combat stance',
    'wielding': 'wielding weapon with determination',
    
    // Movement actions
    'running': 'running with urgent purpose',
    'walking': 'walking cautiously forward',
    'climbing': 'climbing with focused effort',
    'flying': 'soaring through the air',
    'falling': 'falling through space',
    'jumping': 'leaping with athletic grace',
    
    // Magical actions
    'casting': 'casting spell with glowing magical energy',
    'summoning': 'summoning magical forces',
    'enchanting': 'weaving magical enchantments',
    
    // Social actions
    'talking': 'in conversation with others',
    'arguing': 'in heated discussion',
    'negotiating': 'engaged in tense negotiation',
    'pleading': 'making desperate plea',
    
    // Investigative actions
    'searching': 'carefully searching the area',
    'examining': 'closely examining something important',
    'discovering': 'making shocking discovery',
    'reading': 'reading ancient text intently',
    
    // Emotional actions
    'crying': 'overwhelmed with emotion',
    'laughing': 'filled with joy and laughter',
    'praying': 'in solemn prayer',
    'meditating': 'in peaceful meditation'
  };
  
  for (const [key, value] of Object.entries(actionPatterns)) {
    if (text.includes(key)) {
      return value;
    }
  }
  
  return 'standing with determined expression';
}

function extractMood(text) {
  const moodPatterns = {
    // Danger/tension
    'danger': 'dangerous and tense atmosphere',
    'threat': 'threatening and ominous mood',
    'fear': 'fearful and suspenseful atmosphere',
    'terror': 'terrifying and dark mood',
    
    // Mystery
    'mystery': 'mysterious and enigmatic atmosphere',
    'secret': 'secretive and hidden mood',
    'ancient': 'ancient and mystical atmosphere',
    
    // Magic
    'magical': 'magical energy crackling in the air',
    'enchanted': 'enchanted and otherworldly mood',
    'mystical': 'mystical and ethereal atmosphere',
    
    // Emotions
    'peaceful': 'serene and peaceful atmosphere',
    'joyful': 'bright and joyful mood',
    'sad': 'melancholic and somber atmosphere',
    'angry': 'intense and heated atmosphere',
    'hopeful': 'hopeful and uplifting mood',
    
    // Visual atmosphere
    'dark': 'dark and shadowy atmosphere',
    'bright': 'bright and illuminated mood',
    'glowing': 'ethereal glow filling the scene',
    'golden': 'warm golden light atmosphere'
  };
  
  for (const [key, value] of Object.entries(moodPatterns)) {
    if (text.includes(key)) {
      return value;
    }
  }
  
  return 'dramatic and atmospheric mood';
}

function extractElements(text) {
  const importantElements = {
    // Characters/creatures
    'dragon': 'massive dragon with detailed scales',
    'wizard': 'powerful wizard in flowing robes',
    'knight': 'armored knight with gleaming armor',
    'princess': 'elegant princess in royal attire',
    'demon': 'fearsome demon with dark energy',
    'angel': 'radiant angel with white wings',
    'monster': 'terrifying monster with sharp claws',
    'ghost': 'ethereal ghost with translucent form',
    
    // Weapons/tools
    'sword': 'legendary sword with intricate design',
    'staff': 'magical staff glowing with power',
    'bow': 'elegant elven bow with arrows',
    'shield': 'protective shield with emblems',
    'dagger': 'sharp dagger gleaming in light',
    
    // Magical items
    'crystal': 'glowing magical crystal',
    'potion': 'bubbling magical potion',
    'scroll': 'ancient scroll with mystical runes',
    'book': 'leather-bound spellbook',
    'ring': 'magical ring with gems',
    'crown': 'jeweled royal crown',
    'amulet': 'protective amulet glowing softly',
    
    // Environmental
    'fire': 'roaring flames casting dancing shadows',
    'water': 'flowing water with reflective surface',
    'lightning': 'crackling lightning energy',
    'portal': 'swirling interdimensional portal',
    'door': 'ornate door with intricate carvings',
    'window': 'stained glass window with colored light'
  };
  
  const foundElements = [];
  for (const [key, value] of Object.entries(importantElements)) {
    if (text.includes(key)) {
      foundElements.push(value);
    }
  }
  
  return foundElements;
}

function extractTimeWeather(text) {
  const timeWeatherPatterns = {
    // Time of day
    'dawn': 'dawn light breaking over horizon',
    'morning': 'bright morning sunlight',
    'noon': 'bright midday sun overhead',
    'afternoon': 'warm afternoon golden light',
    'evening': 'soft evening twilight',
    'night': 'dark night with moonlight',
    'midnight': 'mysterious midnight atmosphere',
    
    // Weather
    'rain': 'heavy rain creating atmosphere',
    'storm': 'dramatic storm with lightning',
    'snow': 'falling snow creating winter scene',
    'fog': 'mysterious fog rolling through',
    'wind': 'strong wind affecting the scene',
    'sunshine': 'bright warm sunshine',
    'cloudy': 'overcast cloudy sky'
  };
  
  for (const [key, value] of Object.entries(timeWeatherPatterns)) {
    if (text.includes(key)) {
      return value;
    }
  }
  
  return null;
}

// Helper function to build character details from customization answers
function buildCharacterDetails(customization, questions) {
  const characterDetails = {};
  
  if (customization && questions) {
    questions.forEach((question, index) => {
      const answer = customization[index];
      if (answer && answer.trim()) {
        // Store key character details for image generation
        const questionText = question.question.toLowerCase();
        
        if (questionText.includes('name')) {
          characterDetails.name = answer;
        }
        if (questionText.includes('gender') || 
            answer.toLowerCase().includes('male') || 
            answer.toLowerCase().includes('female')) {
          characterDetails.gender = answer.toLowerCase();
        }
        if (questionText.includes('appearance') || questionText.includes('look')) {
          characterDetails.appearance = answer;
        }
        if (questionText.includes('profession') || questionText.includes('job')) {
          characterDetails.profession = answer;
        }
      }
    });
  }
  
  return characterDetails;
}

// NEW ROUTE: Generate customization questions for the story
router.post("/customization-questions", async (req, res) => {
  const { title, description } = req.body;

  try {
    const prompt = `
You are an AI that creates personalized interactive story experiences. Based on the story title and description provided, generate 3-5 thoughtful customization questions that will help create a more personalized and immersive experience for the player.

Story Title: "${title}"
Story Description: "${description}"

Create questions that could include:
- Character details (name, gender, appearance, background)
- Skills, abilities, or professions relevant to the story
- Relationships or backstory elements

All these questions are not mandatory except character name and gender. Send questions only if the story needs it. For each question, determine the most appropriate input type and provide relevant options where needed. Don't ask name or gender in case the story is about marvel or dc characters, they get their own original names.

For each question, determine the most appropriate input type and provide relevant options where needed.

Return your response as JSON in this exact format:
{
  "questions": [
    {
      "question": "What is your protagonist's name?",
      "type": "text",
      "maxLength": 30
    },
    {
      "question": "Choose your protagonist's gender:",
      "type": "multiple_choice",
      "options": ["Male", "Female"]
    }
  ]
}

Question types available:
- "text": Short text input (use maxLength property)
- "long_text": Multi-line text input (use maxLength property)
- "multiple_choice": Selection from predefined options (use options array)

Make sure questions are:
1. Relevant to the specific story genre and setting
2. Engaging and meaningful to the story experience
3. Clear and easy to understand
4. Appropriate for creating a personalized narrative

Generate 3-5 questions total, focusing on the most important aspects for this specific story.
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const reply = result.response.text();

    try {
      const questionsData = JSON.parse(
        reply.replace(/```json\n?/g, "").replace(/```/g, "")
      );
      res.json(questionsData);
    } catch (parseError) {
      console.error("Failed to parse questions JSON:", parseError);
      // Fallback with generic questions
      res.json({
        questions: [
          {
            question: "What is your character's name?",
            type: "text",
            maxLength: 30,
          },
          {
            question: "Choose your character's gender:",
            type: "multiple_choice",
            options: ["Male", "Female", "Non-binary", "Prefer not to specify"],
          },
          {
            question: "What motivates your character most?",
            type: "multiple_choice",
            options: [
              "Adventure and excitement",
              "Helping others",
              "Knowledge and discovery",
              "Power and influence",
              "Love and relationships",
            ],
          },
        ],
      });
    }
  } catch (error) {
    console.error(
      "Gemini API error for questions:",
      error?.response?.data || error.message
    );
    res
      .status(500)
      .json({ error: "Failed to generate customization questions" });
  }
});

// ENHANCED: Initial story generation with customization and image prompt
router.post("/generate", async (req, res) => {
  console.log("Received /generate request with body:", req.body);
  const { title, description, isInitial, customization, questions } = req.body;

  try {
    // Build character profile from answers
    let characterProfile = "";
    let characterDetails = {};
    
    if (customization && questions) {
      characterDetails = buildCharacterDetails(customization, questions);
      
      characterProfile = "\n\nCHARACTER CUSTOMIZATION:\n";
      questions.forEach((question, index) => {
        const answer = customization[index];
        if (answer && answer.trim()) {
          characterProfile += `${question.question} ${answer}\n`;
        }
      });
    }

    const prompt = `
You are an interactive storytelling AI creating a branching narrative experience like AI Dungeon or Telltale Games.
The story should be interesting with twists and turns and a bit fast paced just like traditional manhwa or manga novels.

Title: "${title}"
Description: "${description}"
${characterProfile}

Generate the opening scene of this interactive story. The story should:
1. Incorporate the character customization details naturally into the narrative
2. Set up an engaging scenario with clear stakes that feels personal to this character
3. Introduce the setting and situation in an immersive way with VIVID VISUAL DETAILS
4. Dont make the scene too long.
5. Present a situation that requires a decision
6. End at a choice point where the user must decide what to do next
7. Include specific details about: location, lighting, atmosphere, objects, and character positioning

Use the character details to:
- Address the character by their chosen name
- Reference their gender appropriately
- Incorporate their personality, motivations, and background into the story
- Make choices that align with their established characteristics

VISUAL DESCRIPTION REQUIREMENTS:
- Describe the specific location in detail (architecture, landscape, etc.)
- Mention lighting conditions (torchlight, sunlight, magical glow, etc.)
- Include important objects or elements visible in the scene
- Describe the character's position and what they're doing
- Set the atmospheric mood (mysterious, tense, peaceful, etc.)
- Mention any other characters or creatures present

After the story text, provide 3-4 specific choice options that will lead to different story branches.

Also generate a detailed image prompt that captures the specific visual elements of this scene. The image prompt should include:
- Character description and current action
- Specific location details
- Lighting and atmosphere
- Important objects or elements
- Overall mood and style

Format your response as JSON:

{
  "story": "Your opening story text here with detailed visual descriptions...",
  "choices": [
    "Choice 1 description",
    "Choice 2 description", 
    "Choice 3 description",
    "Choice 4 description (optional)"
  ],
  "imagePrompt": "Detailed visual description: [character name] [action] in [specific location] with [lighting], [atmosphere], [key objects], anime art style, high quality, detailed illustration"
}

Make the story immersive, visually rich, and compelling. Each choice should feel meaningful and lead to distinctly different outcomes.
`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    console.log("Gemini API response:", result);
    const reply = result.response.text();

    try {
      const storyData = robustJSONParse(reply);

      // Generate fallback image prompt if not provided or invalid
      if (!storyData.imagePrompt || typeof storyData.imagePrompt !== 'string') {
        storyData.imagePrompt = extractVisualElements(
          storyData.story,
          characterDetails
        );
      }
      
      res.json(storyData);
    } catch (parseError) {
      console.error("Parse error:", parseError);
      
      // Fallback response with extracted image prompt
      const fallbackImagePrompt = extractVisualElements(reply, characterDetails);
      
      res.json({
        story: reply,
        choices: [
          "Investigate further",
          "Proceed cautiously",
          "Take immediate action",
          "Seek help from others",
        ],
        imagePrompt: fallbackImagePrompt
      });
    }
  } catch (error) {
    console.error("Gemini API error:", error?.response?.data || error.message);
    res.status(500).json({ error: "Failed to generate story" });
  }
});

// ENHANCED: Continue story based on user choice with character consistency and image prompts
router.post("/continue", async (req, res) => {
  const {
    title,
    storyContext,
    userChoice,
    storyHistory,
    isCustomInput,
    customization,
    questions
  } = req.body;

  try {
    // Calculate story progression metrics
    const storyParts = storyHistory.split("\n\n").length;
    const userChoices = storyHistory.match(/> /g)?.length || 0;

    // Build character context for consistency
    let characterContext = "";
    let characterDetails = {};
    
    if (customization && questions) {
      characterDetails = buildCharacterDetails(customization, questions);
      
      characterContext = "\n\nCHARACTER CONTEXT (maintain consistency):\n";
      questions.forEach((question, index) => {
        const answer = customization[index];
        if (answer && answer.trim()) {
          characterContext += `${question.question} ${answer}\n`;
        }
      });
    }

    const prompt = `
You are continuing an interactive story. Here's the context:

Title: "${title}"
Previous story context: "${storyContext}"
User's choice/action: "${userChoice}"
Story parts so far: ${storyParts}
User choices made: ${userChoices}
${characterContext}

IMPORTANT: 
1. Maintain character consistency throughout the story
2. Reference the character's name, traits, and background when appropriate
3. Include VIVID VISUAL DESCRIPTIONS of the new scene
4. Describe specific details: lighting, atmosphere, objects, character positioning when appropriate
5. Make the scene visually interesting and cinematically compelling and make the story a bit fast paced
6. Dont make the scene too long.
7. Story's ending can be anything depending on user choices, it might happen user's choice lead him to fail his purpose goals.

VISUAL DESCRIPTION REQUIREMENTS:
- Describe how the scene changes based on the user's choice
- Include specific environmental details
- Mention lighting conditions and atmospheric effects
- Describe the character's current state and positioning
- Include any new characters, objects, or elements that appear
- Set the mood and emotional tone of the scene

Continue the story based on the user's choice, showing the immediate consequences and setting up the next decision point.

ENDING CRITERIA - End the story if ANY of these conditions are met:
- Story has reached 8+ choice points and feels complete
- A definitive victory, defeat, or resolution has been achieved
- Character's main goal has been accomplished or definitively failed
- A major sacrifice or transformation concludes the arc
- The narrative has reached a natural climax and resolution

If continuing, provide detailed visual descriptions and create an engaging image prompt.

CRITICAL: Your response MUST be valid JSON only. Format your response as JSON:

{
  "story": "Your continuation text with detailed visual descriptions...",
  "choices": ["Choice 1", "Choice 2", "Choice 3", "Choice 4"] or [],
  "isEnding": true/false,
  "endingType": "heroic/tragic/mysterious/etc" (only if isEnding: true),
  "imagePrompt": "Detailed scene description: [character] [current action] in [specific location] with [specific visual elements], [lighting], [mood], anime art style, detailed illustration"
}

Current story:
${storyHistory}
`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const reply = result.response.text();

    try {
      // Use the robust parsing function
      const storyData = robustJSONParse(reply);

      // Generate fallback image prompt if not provided or invalid
      if (!storyData.imagePrompt || typeof storyData.imagePrompt !== 'string') {
        storyData.imagePrompt = extractVisualElements(
          storyData.story,
          characterDetails
        );
      }

      // Validate the parsed data
      if (!storyData.story || typeof storyData.story !== "string") {
        throw new Error("Invalid story field in response");
      }

      if (!Array.isArray(storyData.choices)) {
        storyData.choices = [];
      }

      // Fallback logic if AI doesn't set ending appropriately
      if (!storyData.isEnding && userChoices >= 10) {
        storyData.story +=
          "\n\n[The adventure concludes here, but your story continues in memory...]";
        storyData.choices = [];
        storyData.isEnding = true;
        storyData.endingType = "conclusion";
        storyData.imagePrompt = extractVisualElements(
          storyData.story + " ending scene",
          characterDetails
        );
      }

      res.json(storyData);
    } catch (parseError) {
      console.error("All parsing attempts failed:", parseError);
      console.error("Original response length:", reply.length);
      console.error("Response preview:", reply.substring(0, 200) + "...");

      // Emergency fallback - extract story text manually
      let fallbackStory = reply;

      // Try to extract just the story content between quotes
      const storyRegex = /"story"\s*:\s*"((?:[^"\\]|\\.)*?)"/s;
      const storyMatch = reply.match(storyRegex);

      if (storyMatch) {
        fallbackStory = storyMatch[1]
          .replace(/\\"/g, '"')
          .replace(/\\n/g, "\n")
          .replace(/\\t/g, "\t")
          .replace(/\\\\/g, "\\");
      } else {
        // Last resort - use the entire response but clean it up
        fallbackStory = reply
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .replace(/^[^{]*{/, "")
          .replace(/}[^}]*$/, "")
          .replace(/"story"\s*:\s*"/g, "")
          .replace(/",\s*"choices".*$/s, "");
      }

      // Determine if story should end based on length/content
      const shouldEnd =
        userChoices >= 8 ||
        fallbackStory.toLowerCase().includes("the end") ||
        fallbackStory.toLowerCase().includes("conclusion") ||
        fallbackStory.toLowerCase().includes("finally");

      // Generate image prompt for fallback
      const fallbackImagePrompt = extractVisualElements(
        fallbackStory,
        characterDetails
      );

      res.json({
        story: fallbackStory,
        choices: shouldEnd
          ? []
          : [
              "Continue forward",
              "Look around carefully",
              "Make a different choice",
              "Take decisive action",
            ],
        isEnding: shouldEnd,
        endingType: shouldEnd ? "natural" : undefined,
        imagePrompt: fallbackImagePrompt,
      });
    }
  } catch (error) {
    console.error("Gemini API error:", error?.response?.data || error.message);
    res.status(500).json({ error: "Failed to continue story" });
  }
});

// Enhanced route to force story ending with character context
router.post("/end-story", async (req, res) => {
  const { storyHistory, title, reason, customization, questions } = req.body;

  try {
    // Build character context for the ending
    let characterContext = "";
    let characterDetails = {};
    
    if (customization && questions) {
      characterDetails = buildCharacterDetails(customization, questions);
      
      characterContext = "\n\nCHARACTER DETAILS:\n";
      questions.forEach((question, index) => {
        const answer = customization[index];
        if (answer && answer.trim()) {
          characterContext += `${question.question} ${answer}\n`;
        }
      });
    }

    const prompt = `
Create a satisfying conclusion for this interactive story:

Title: "${title}"
Reason for ending: "${reason || "natural conclusion"}"
Complete story: ${storyHistory}
${characterContext}

Write a conclusive ending that:
1. Wraps up the main plot
2. Acknowledges the user's journey and choices
3. References how the character's traits influenced the outcome
4. Provides emotional closure appropriate to this character
5. Feels complete and satisfying
6. Includes a vivid final scene description

Story's ending can be anything depending on user choices, it might happen user's choice lead him to fail his purpose goals.

Format as JSON:
{
  "story": "Your ending text here (referencing character when appropriate with vivid descriptions)...",
  "endingType": "heroic/tragic/mysterious/redemptive/ironic/bittersweet",
  "isEnding": true,
  "imagePrompt": "Description of the final scene for image generation"
}
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const reply = result.response.text();

    try {
      const ending = robustJSONParse(reply);
      
      // Generate fallback image prompt if not provided
      if (!ending.imagePrompt || typeof ending.imagePrompt !== 'string') {
        ending.imagePrompt = extractVisualElements(ending.story + " final scene", characterDetails);
      }
      
      res.json(ending);
    } catch (parseError) {
      console.error("Failed to parse ending JSON:", parseError);
      
      const fallbackImagePrompt = extractVisualElements(reply + " ending", characterDetails);
      
      res.json({
        story: reply,
        endingType: "natural",
        isEnding: true,
        imagePrompt: fallbackImagePrompt
      });
    }
  } catch (error) {
    console.error("Error creating ending:", error);
    res.status(500).json({ error: "Failed to create story ending" });
  }
});


module.exports = router;