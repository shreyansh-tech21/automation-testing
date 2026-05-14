const axios = require("axios");

function resolveVariables(obj, variables) {
  if (!obj) return obj;
  const stringified = JSON.stringify(obj);
  const replaced = stringified.replace(
    /\{\{(.*?)\}\}/g,
    (_, key) => variables[key?.trim()] ?? ""
  );
  return JSON.parse(replaced);
}

function extractVariables(extractConfig,response,variables){
    for(const key in extractConfig){
        const path=extractConfig[key];

        if(path.startsWith("headers.")){
            const headerKey=path.replace("headers.","");
            variables[key]=response.headers[headerKey];
        }
        else{
            variables[key]=getNested(response.data,path);
        }
    }
}
function getNested(obj,path){
    return path.split(".").reduce((acc,part)=>{
        return acc && acc[part];
    },obj);
}

function validateAssertions(assertConfig, response) {
    if (!assertConfig) return {passed:true};
  
    for (const key in assertConfig) {
      const expectedValue = assertConfig[key];
  
      if (key === "status") {
        if (response.status !== expectedValue) {
          return {
            passed:false,
            reason:`Expected status ${expectedValue} but got ${response.status}`
        };
        }
      }
  
      else if (key.startsWith("body.")) {
        const path = key.replace("body.", "");
        const actual = getNested(response.data, path);
  
        if (actual !== expectedValue) {
          return {
            passed:false,
            reason:`Body assertion failed at path ${path}. Expected ${expectedValue} but got ${actual}`
        };
        }
      }
  
      else if (key.startsWith("headers.")) {
        const headerKey = key.replace("headers.", "");
        const actual = response.headers[headerKey];
  
        if (actual !== expectedValue) {
          return {
            passed:false,
            reason:`Header assertion failed for key ${headerKey}. Expected ${expectedValue} but got ${actual}`
        };
        }
      }
    }
  
    return {passed:true};
  }

async function runApiTest(test) {
    const variables={};
    const baseUrl = (test.baseUrl && String(test.baseUrl).trim()) || "";
    const baseUrlNorm = baseUrl.replace(/\/+$/, "");

    const results=[];

    for(const step of test.steps){
        try{
            console.log(`Running API step: ${step.name}`);
            
            // Resolve the variables in URL, body, and headers
            const resolvedUrl = typeof step.url === "string" ? resolveVariables(step.url, variables) : step.url;
            if(!resolvedUrl){
                throw new Error(`Step URL is missing`);
            }
            let fullUrl;
            if(resolvedUrl.startsWith("http")){
                fullUrl=resolvedUrl;
            }else{
                if(!baseUrl){
                    throw new Error(
                        `Relative URL "${resolvedUrl}" requires test.baseUrl to be set`
                    );
                }
                fullUrl=new URL(resolvedUrl,baseUrlNorm).toString();
            }
            // const isAbsolute = typeof resolvedUrl === "string" && /^https?:\/\//i.test(resolvedUrl);
            // const fullUrl = isAbsolute
            //     ? resolvedUrl
            //     : baseUrlNorm + (resolvedUrl ? (resolvedUrl.startsWith("/") ? "" : "/") + resolvedUrl : "");
            // if (!fullUrl || (!isAbsolute && !baseUrl)) {
            //     throw new Error(
            //         baseUrl ? `Invalid URL: ${fullUrl}` : `Relative URL "${step.url}" requires test.baseUrl to be set`
            //     );
            // }
            const resolvedBody=resolveVariables(step.body,variables);
            const resolvedHeaders = resolveVariables(step.headers, variables);

            
            // Execute the API call
            const response = await axios({
                method: step.method,
                url: fullUrl,
                headers: resolvedHeaders,
                data:resolvedBody,
                validateStatus:()=>true, //prevent axios from throwing on 4xx/5xx
            });

            

            //validate assertions
            const assertionResult=validateAssertions(step.assert,response);
            const passed=assertionResult.passed;

            //extract values if configured
            if(step.extract){
                extractVariables(step.extract,response,variables);
            }

            results.push({
                label: step.name,
                step: step.name,
                status: passed ? "Passed" : "Failed",
                assertionFailureReason:assertionResult.reason || null,
                request:{
                    method:step.method,
                    url:step.url,
                    resolvedUrl:fullUrl,
                    headers:resolvedHeaders,
                    body:resolvedBody,
                },
                response:{
                    status:response.status,
                    headers:response.headers,
                    body:response.data
                },
                extractedValues: { ...variables },
            });

            if (!passed) break;
        } catch (err) {
            results.push({
                label: step.name,
                step: step.name,
                status: "Failed",
                error: err.message,
            });
            break;
        }
    }
    return results;
}
module.exports={runApiTest};