import {onRequest} from "firebase-functions/v2/https";
import OpenAI from "openai";
import {SecretCardData} from "./types";

// curl -X POST https://us-central1-mtg20-58a58.cloudfunctions.net/askQuestion \
//     -H "Content-Type: application/json" \
//     -d '{
//       "secretCardData": {
//         "name": "Lightning Bolt",
//         "type_line": "Instant",
//         "cmc": 1,
//         "color_identity": ["R"],
//         "keywords": [],
//         "rarity": "common",
//         "set_name": "Alpha",
//         "card_faces": [{
//           "mana_cost": "{R}",
//           "oracle_text": "Lightning Bolt deals 3 damage to any target."
//         }]
//       },
//       "message": "Is this card red?"
//     }'

//   Response Format

//   {
//     "response": "Yes",
//     "usage": {
//       "prompt_tokens": 150,
//       "completion_tokens": 5,
//       "total_tokens": 155
//     }
//   }

export const askQuestion = onRequest(
  {
    cors: true,
    maxInstances: 10,
    secrets: ["OPENAI_API_KEY"],
  },
  async (req, res) => {
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    try {
      // Only allow POST requests
      if (req.method !== "POST") {
        console.log("ERROR: Invalid method:", req.method);
        res.status(405).json({error: "Method not allowed"});
        return;
      }

      // Extract secretCardData and message from request body
      const {secretCardData, message} = req.body as {
                secretCardData: SecretCardData;
                message: string;
            };

      // Validate inputs
      if (!secretCardData || !message) {
        res.status(400).json({
          error: "Missing required fields: secretCardData and message",
        });
        return;
      }

      // Create a system prompt with card context
      // Handle both single-faced cards (properties on card)
      // and double-faced cards (properties in card_faces)
      const manaCost = secretCardData.mana_cost ||
        secretCardData.card_faces?.[0]?.mana_cost ||
        "N/A";
      const oracleText = secretCardData.oracle_text ||
        secretCardData.card_faces?.[0]?.oracle_text ||
        "N/A";
      const power = secretCardData.power ||
        secretCardData.card_faces?.[0]?.power ||
        undefined;
      const toughness = secretCardData.toughness ||
        secretCardData.card_faces?.[0]?.toughness ||
        undefined;
      const colors = secretCardData.colors ||
        secretCardData.card_faces?.[0]?.colors ||
        [];

      const systemPrompt = "You are playing a 20 Questions game " +
        "about Magic: The Gathering cards.\n\n" +
        "CRITICAL RULES - YOU MUST FOLLOW THESE EXACTLY:\n" +
        "1. You may ONLY respond with one of these three options:\n" +
        "   - \"Yes\"\n" +
        "   - \"No\"\n" +
        "   - \"Please ask a yes or no question.\"\n" +
        "2. NEVER provide any other information, explanations, " +
        "or details.\n" +
        "3. If the question cannot be answered with yes or no, " +
        "respond ONLY with \"Please ask a yes or no question.\"\n\n" +
        "The secret card is:\n" +
        `Name: ${secretCardData.name}\n` +
        `Type: ${secretCardData.type_line}\n` +
        `Mana Cost: ${manaCost}\n` +
        `Oracle Text: ${oracleText}\n` +
        `Colors: ${colors.length > 0 ? colors.join(", ") : "Colorless"}\n` +
        "Color Identity: " +
        `${secretCardData.color_identity.join(", ") || "Colorless"}\n` +
        `CMC: ${secretCardData.cmc}\n` +
        (power && toughness ?
          `Power/Toughness: ${power}/${toughness}\n` : "") +
        `Rarity: ${secretCardData.rarity}\n` +
        `Set: ${secretCardData.set_name}\n` +
        `Keywords: ${secretCardData.keywords.join(", ") || "None"}\n\n` +
        "EXAMPLES:\n" +
        "Question: \"Is this card red?\" → Answer: \"Yes\" or \"No\"\n" +
        "Question: \"Does this card cost 3 mana?\" → " +
        "Answer: \"Yes\" or \"No\"\n" +
        "Question: \"What does this card do?\" → " +
        "Answer: \"Please ask a yes or no question.\"\n" +
        "Question: \"Is this Lightning Bolt?\" → " +
        "Answer: \"Yes\" or \"No\"\n\n" +
        "Remember: ONLY respond with \"Yes\", \"No\", or " +
        "\"Please ask a yes or no question.\" Nothing else!";

      // Call OpenAI API with GPT-4o-mini
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: message,
          },
        ],
        temperature: 0.7,
        max_tokens: 150,
      });


      // Extract the response
      const response =
        completion.choices[0]?.message?.content ||
        "No response generated";

      // Return the response
      res.status(200).json({
        response,
        usage: completion.usage,
      });
    } catch (error) {
      console.error("Error in askQuestion function:", error);
      const errorMessage = error instanceof Error ?
        error.message : "Unknown error";
      res.status(500).json({
        error: "Internal server error",
        message: errorMessage,
      });
    }
  }
);
