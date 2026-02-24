const { Groq } = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function analyzeExecution(execution){
    const failedSteps=execution.results.filter((r)=>r.status==="Failed");

    if(failedSteps.length===0){
        return {
            summary:"No failures found",
            rootCause:"Tests passed successfully",
            flakyLikelihood:"Very Low",
            suggestion:"No further action needed"
        };
    }

    const prompt=`
You are a senior QA automation engineer.

Analyze the following test execution.

Test Name: ${execution.testName}

Failed Steps: ${JSON.stringify(failedSteps,null,2)}

Return ONLY valid JSON in this format:

{
    "summary":"...",
    "rootCause":"...",
    "flakyLikelihood":"...",
    "suggestion":"..."

}
    `;
    const response=await groq.chat.completions.create({
        model:"openai/gpt-oss-120b",
        messages:[
            {role:"system",content:"You are an expert QA automation assistant."},
            {role:"user",content:prompt}
        ],
        temperature:0.7,
    });

    const content=response.choices[0].message.content;

    try{
        return JSON.parse(content);
    }catch(err){
        return {
            summary:"AI response parsing failed",
            rootCause:"content",
            flakeyLikelihood:"Unknown",
            suggestion:"Check AI formatting."
        };
    }

}

module.exports={analyzeExecution};