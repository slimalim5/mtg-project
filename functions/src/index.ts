/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions/v2";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import OpenAI from "openai";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onCall({ maxInstances: 5 }, (req, res) => { ... })`.
setGlobalOptions({maxInstances: 10});

/**
 * OpenAI Chat Completion Function
 *
 * Before deploying:
 * 1. Set your OpenAI API key using Firebase CLI:
 *    firebase functions:secrets:set OPENAI_API_KEY
 *    (You'll be prompted to enter the key securely)
 *
 * 2. Deploy the function:
 *    npm run deploy
 *
 * Usage from Angular:
 * ```typescript
 * import { getFunctions, httpsCallable } from '@angular/fire/functions';
 *
 * const functions = inject(Functions);
 * const chatWithGPT = httpsCallable<ChatRequest, ChatResponse>(functions, 'chatWithGPT');
 *
 * const result = await chatWithGPT({
 *   prompt: 'Your question here',
 *   systemMessage: 'Optional system message'  // Optional
 * });
 * console.log(result.data.response);
 * ```
 */

interface ChatRequest {
  prompt: string;
  systemMessage?: string;
  temperature?: number;
  maxTokens?: number;
}

interface ChatResponse {
  response: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export const chatWithGPT = onCall<ChatRequest, Promise<ChatResponse>>(
  {
    secrets: ["OPENAI_API_KEY"],
    // Require authentication to call this function
    // Remove this if you want to allow unauthenticated calls
    enforceAppCheck: false,
  },
  async (request) => {
    // Log the request for debugging
    logger.info("chatWithGPT called", {
      uid: request.auth?.uid,
      hasPrompt: !!request.data.prompt,
    });

    // Validate input
    if (!request.data.prompt || typeof request.data.prompt !== "string") {
      throw new HttpsError(
        "invalid-argument",
        "The function must be called with a 'prompt' string."
      );
    }

    // Optional: Enforce authentication
    // Uncomment these lines if you want to require users to be logged in
    // if (!request.auth) {
    //   throw new HttpsError(
    //     'unauthenticated',
    //     'The function must be called while authenticated.'
    //   );
    // }

    try {
      // Initialize OpenAI client
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // Prepare messages array
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

      // Add system message if provided
      if (request.data.systemMessage) {
        messages.push({
          role: "system",
          content: request.data.systemMessage,
        });
      }

      // Add user prompt
      messages.push({
        role: "user",
        content: request.data.prompt,
      });

      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: messages,
        temperature: request.data.temperature ?? 0.7,
        max_tokens: request.data.maxTokens ?? 500,
      });

      // Extract response
      const responseText = completion.choices[0]?.message?.content || "";

      // Log usage for monitoring
      logger.info("OpenAI response received", {
        usage: completion.usage,
        promptLength: request.data.prompt.length,
      });

      // Return response with usage stats
      return {
        response: responseText,
        usage: completion.usage
          ? {
            promptTokens: completion.usage.prompt_tokens,
            completionTokens: completion.usage.completion_tokens,
            totalTokens: completion.usage.total_tokens,
          }
          : undefined,
      };
    } catch (error: unknown) {
      logger.error("Error calling OpenAI API", {error});

      // Handle OpenAI-specific errors
      if (error instanceof OpenAI.APIError) {
        throw new HttpsError(
          "internal",
          `OpenAI API error: ${error.message}`,
          {status: error.status}
        );
      }

      // Generic error
      throw new HttpsError(
        "internal",
        "Failed to process chat request",
        {error: String(error)}
      );
    }
  }
);
