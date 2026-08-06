const MODEL_ID="SmolLM2-360M-Instruct-q4f32_1-MLC";
const CDN="https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm/+esm";

let engine=null;
let webllmModule=null;
const listeners=new Set();
const state={
  supported:!!navigator.gpu,
  status:navigator.gpu?"idle":"unavailable",
  progress:0,
  message:navigator.gpu
    ?"WebGPU detected. The model has not been loaded."
    :"WebGPU is not available. LINGGUANG will use its rule engine.",
  modelId:MODEL_ID,
  lastError:""
};

function publish(patch={}){
  Object.assign(state,patch);
  listeners.forEach(fn=>{try{fn({...state})}catch{}});
}
function subscribe(fn){
  listeners.add(fn);
  fn({...state});
  return()=>listeners.delete(fn);
}
function getState(){return{...state}}

function normalizeText(text){return String(text||"").trim()}
function firstMatch(text,patterns){
  for(const [value,pattern] of patterns){
    if(pattern.test(text))return value;
  }
  return"";
}
function ruleAnalyze(input){
  const text=normalizeText(input);
  const lower=text.toLowerCase();

  let category="Other";
  if(/pain|疼|痛|ache|sore|shoulder|neck|back|knee|headache/.test(lower))category="Pain";
  else if(/sleep|insomnia|wake|梦|睡|失眠/.test(lower))category="Sleep";
  else if(/digest|stomach|bloat|reflux|constipat|diarr|胃|腹|便秘|腹泻/.test(lower))category="Digestion";
  else if(/stress|anxi|mood|depress|烦躁|焦虑|压力|情绪/.test(lower))category="Emotional Health";
  else if(/period|menstrual|pregnan|月经|怀孕/.test(lower))category="Women's Health";

  const location=firstMatch(lower,[
    ["Right shoulder",/(right shoulder|右肩)/],
    ["Left shoulder",/(left shoulder|左肩)/],
    ["Shoulder",/(shoulder|肩)/],
    ["Neck",/(neck|颈|脖子)/],
    ["Lower back",/(lower back|low back|腰)/],
    ["Back",/(back|背)/],
    ["Knee",/(knee|膝)/],
    ["Head",/(head|头)/],
    ["Stomach / abdomen",/(stomach|abdomen|胃|腹)/]
  ]);

  const durationMatch=text.match(/(\d+)\s*(day|days|week|weeks|month|months|year|years|天|周|星期|个月|月|年)/i);
  const duration=durationMatch?durationMatch[0]:"";

  const patterns=[];
  if(/night|晚上|夜间|overnight/.test(lower))patterns.push("Worse at night");
  if(/morning|早上|晨/.test(lower))patterns.push("Morning pattern");
  if(/lift|raise|抬手|举手/.test(lower))patterns.push("Worse with arm elevation");
  if(/turn over|rolling|翻身/.test(lower))patterns.push("Worse when turning in bed");
  if(/numb|麻/.test(lower))patterns.push("Numbness reported");
  if(/weak|无力/.test(lower))patterns.push("Weakness reported");
  if(/sleep|睡/.test(lower)&&category==="Pain")patterns.push("May affect sleep");

  const missingQuestions=[];
  if(category==="Pain"&&!/\b(10|[0-9])\s*(?:\/\s*10|out of 10)?\b/i.test(text))missingQuestions.push("What is the pain score from 0 to 10?");
  if(category==="Pain"&&!duration)missingQuestions.push("When did the pain begin?");
  if(category==="Pain"&&!/injur|trauma|fall|accident|受伤|外伤|摔/.test(lower))missingQuestions.push("Was there a recent injury or accident?");
  if(category==="Pain"&&!/numb|weak|麻|无力/.test(lower))missingQuestions.push("Is there numbness or weakness?");

  const details=[
    category!=="Other"?`Primary category: ${category}.`:"",
    location?`Location: ${location}.`:"",
    duration?`Duration: ${duration}.`:"",
    patterns.length?`Patterns: ${patterns.join(", ")}.`:""
  ].filter(Boolean).join(" ");

  return{
    mode:"rule",
    category,
    location,
    duration,
    patterns,
    missingQuestions,
    summary:details||text
  };
}

function extractJSON(raw){
  const text=String(raw||"").trim();
  try{return JSON.parse(text)}catch{}
  const match=text.match(/\{[\s\S]*\}/);
  if(match){try{return JSON.parse(match[0])}catch{}}
  return null;
}

async function load(){
  if(!state.supported)throw new Error("WebGPU is not supported on this device/browser.");
  if(state.status==="ready"&&engine)return engine;
  if(state.status==="loading")throw new Error("The local model is already loading.");

  publish({status:"loading",progress:0,message:"Loading the WebLLM software…",lastError:""});
  try{
    webllmModule=await import(CDN);
    engine=await webllmModule.CreateMLCEngine(MODEL_ID,{
      initProgressCallback(info){
        const value=Number.isFinite(info.progress)?info.progress:0;
        publish({
          status:"loading",
          progress:value,
          message:info.text||"Downloading and preparing the local model…"
        });
      },
      logLevel:"WARN"
    },{
      context_window_size:1024
    });
    localStorage.setItem("lingguangLocalAIInstalled","1");
    publish({status:"ready",progress:1,message:"Local model is loaded and ready."});
    return engine;
  }catch(error){
    engine=null;
    const message=error?.message||String(error);
    publish({status:"error",message,lastError:message});
    throw error;
  }
}

async function unload(){
  if(engine?.unload)await engine.unload();
  engine=null;
  publish({
    status:state.supported?"idle":"unavailable",
    progress:0,
    message:state.supported
      ?"Model unloaded from memory. Cached files may remain on this device."
      :"WebGPU is unavailable."
  });
}

async function clearCache(){
  await unload();
  if("caches"in window){
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>/webllm|mlc|huggingface/i.test(key)).map(key=>caches.delete(key)));
  }
  localStorage.removeItem("lingguangLocalAIInstalled");
  publish({
    status:state.supported?"idle":"unavailable",
    progress:0,
    message:state.supported?"Local model cache was cleared.":"WebGPU is unavailable."
  });
}

async function modelAnalyze(text){
  if(!engine||state.status!=="ready")return null;
  const prompt=`You are a clinical intake text-structuring assistant. Do not diagnose or recommend treatment.
Return only valid JSON with this exact shape:
{
  "category": "Pain|Sleep|Digestion|Emotional Health|Women's Health|Men's Health|Wellness|Other",
  "location": "short body location or empty string",
  "duration": "short duration or empty string",
  "patterns": ["short factual pattern"],
  "missingQuestions": ["important factual follow-up question"],
  "summary": "one concise factual summary"
}
Patient text:
${text}`;

  const response=await engine.chat.completions.create({
    messages:[
      {role:"system",content:"Extract only information supported by the patient text. Never diagnose."},
      {role:"user",content:prompt}
    ],
    temperature:0.1,
    max_tokens:280
  });
  const raw=response?.choices?.[0]?.message?.content||"";
  const parsed=extractJSON(raw);
  if(!parsed)return null;
  return{
    mode:"model",
    category:parsed.category||"Other",
    location:parsed.location||"",
    duration:parsed.duration||"",
    patterns:Array.isArray(parsed.patterns)?parsed.patterns:[],
    missingQuestions:Array.isArray(parsed.missingQuestions)?parsed.missingQuestions:[],
    summary:parsed.summary||text
  };
}

async function analyze(input){
  const text=normalizeText(input);
  if(!text)throw new Error("Enter patient text first.");
  if(engine&&state.status==="ready"){
    try{
      const result=await modelAnalyze(text);
      if(result)return result;
    }catch(error){
      publish({message:`Local model response failed; rule fallback used. ${error?.message||""}`});
    }
  }
  return ruleAnalyze(text);
}

window.LINGGUANG_LOCAL_AI={
  getState,
  subscribe,
  load,
  unload,
  clearCache,
  analyze,
  ruleAnalyze,
  modelId:MODEL_ID
};

if(localStorage.getItem("lingguangLocalAIInstalled")==="1"&&state.supported){
  publish({message:"A local model was previously downloaded. Tap Load to place it into memory."});
}
