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
      const systemPrompt = "You are playing a 20 Questions game " +
        `about Magic: The Gathering cards.
You know the secret card and must answer questions about it ` +
        `with "Yes", "No", or brief clarifications.
The secret card is:

Name: ${secretCardData.name}
Type: ${secretCardData.type_line}
Mana Cost: ${secretCardData.card_faces?.[0]?.mana_cost || "N/A"}
Oracle Text: ${secretCardData.card_faces?.[0]?.oracle_text || "N/A"}
Colors: ${secretCardData.color_identity.join(", ") || "Colorless"}
CMC: ${secretCardData.cmc}
Rarity: ${secretCardData.rarity}
Set: ${secretCardData.set_name}
Keywords: ${secretCardData.keywords.join(", ") || "None"}

Answer questions truthfully and concisely. ` +
        "If asked if the card is a specific card, " +
        "only say \"Yes\" if it's an exact match.";

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
