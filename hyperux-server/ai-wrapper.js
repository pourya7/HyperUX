import 'dotenv/config';
const axios = require('axios');

const openaiApiKey = process.env.OPENAI_API_KEY;
const openaiModel = process.env.OPENAI_MODEL;
const openaiEndpoint = 'https://api.openai.com/v1/chat/completions';

export default async function getOptimizedLayout(initialLayout, domEvents, extraContext) {
    const promptTemplate = `
        You are an expert in UX design and web development. You will be provided with the following:

        1. **Initial Layout**: A JSON object describing the current HTML layout.
        2. **DOM Events**: A list of user interactions with the page during a session.
        3. **Contextual Information**: Extra context about the design goals and user preferences.

        Your task is to:
        - **Generate a new optimized layout** as a JSON object that improves the UX.
        - **Provide a list of UX insights** on how the layout can be improved.

        --- Initial Layout ---
        ${JSON.stringify(initialLayout, null, 2)}

        --- DOM Events ---
        ${JSON.stringify(domEvents, null, 2)}

        --- Contextual Information ---
        ${extraContext}
    `;

    try {
        const response = await axios.post(
            openaiEndpoint,
            {
                model: openaiModel,
                messages: [
                    {
                        role: "system",
                        content: "You are a UX designer and web developer."
                    },
                    {
                        role: "user",
                        content: promptTemplate
                    }
                ]
            },
            {
                headers: {
                    'Authorization': `Bearer ${openaiApiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const result = response.data.choices[0].message.content;
        console.log("LLM Response:", result);

        const responseObject = JSON.parse(result);
        return responseObject;

    } catch (error) {
        console.error("Error communicating with OpenAI:", error.response ? error.response.data : error.message);
    }
}