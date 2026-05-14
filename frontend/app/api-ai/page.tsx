"use client";
import {useState} from "react";
import axios from "axios";

export default function AIApiPage(){
    const [baseUrl,setBaseUrl] = useState("");
    const [prompt,setPrompt] = useState("");
    const [loading,setLoading] = useState(false);
    const [error,setError] = useState<string | null>(null);

    const handleGenerate=async()=>{
        if(!baseUrl || !prompt){
            setError("Both base URL and prompt are required");
            return;
        }
        setError("");
        setLoading(true);

        try{
            const res=await axios.post(
                "http://localhost:5000/ai/generate-api-flow",
                {prompt,baseUrl},
                {
                    headers:{
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );
            const testId=res.data._id;

            window.location.href=`/tests/${testId}`;
        }catch(err){
            setError(err instanceof Error ? err.message : "An error occurred");
        }finally{
            setLoading(false);
        };
        return (
            <div className="p-10 max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold text-white mb-6">AI API Flow Generator</h1>
                <input type="text" placeholder="Base URL (eg. https://insurance-qa.company.com)"
                value={baseUrl} onChange={(e)=>setBaseUrl(e.target.value)} className="w-full p-2 rounded-md bg-slate-800 text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <textarea
                placeholder="Describe the API journey..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={6}
                className="border p-3 w-full rounded mb-4"
            />
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <button onClick={handleGenerate} disabled={loading} className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-500 transition">{loading ? "Generating..." : "Generate Flow"}</button>

            </div>
        );
    }
}