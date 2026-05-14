const axios=require('axios');

async function generateApiFlow(userPrompt){
    const systemPrompt = `
You are an expert API test designer. Generate a single JSON object only (no markdown, no explanation).

REQUIRED shape:
{
  "testType": "api",
  "baseUrl": "https://example.com",
  "steps": [
    {
      "name": "Step name",
      "method": "GET" or "POST" or "PUT" or "PATCH" or "DELETE",
      "url": "/path" (relative) or full https URL,
      "assert": { "status": 200 },
      "extract": { "variableName": "jsonPath" } (optional),
      "body": {} (optional for POST/PUT/PATCH)
    }
  ]
}

RULES:
- Every step MUST have: name, method, url. Without these the test cannot run.
- Use relative URLs (e.g. "/policy", "/issue") and set baseUrl to the API base (e.g. "https://api.example.com").
- For chaining, use extract to save IDs/tokens, then use {{variableName}} in a later step's url or body.
- Add assert.status = 200 unless the step should expect another status.
- Output valid JSON only. No code fences, no extra text.
    `;
    const response=await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
            model:"openai/gpt-oss-120b",
            messages:[
                {role:"system",content:systemPrompt},
                {role:"user",content:userPrompt}
            ],
            temperature:0.2,
        },
            {
                headers:{
                    Authorization: `Bearer ${process.env.GROQ_API_KEY}`
                }
            },
    );
    const rawContent=response.data.choices[0].message.content;
    return JSON.parse(rawContent);

}
module.exports={generateApiFlow};