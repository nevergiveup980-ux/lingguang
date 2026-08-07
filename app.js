/* LINGGUANG Health OS Mobile GitHub bundle 1.3.1 */
"use strict";

/* ===== src/services/store.js ===== */
const KEY = 'lingguang-health-os-v1.3';
const DRAFT_KEY = 'lingguang-intake-draft-v1.3';

const initial = {
  patients: [], appointments: [], intakes: [], clinicalNotes: [], checkins: [], followups: [], riskReviews: [], applications: [], messages: [], voiceSessions: []
};

function readStore() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY)) || structuredClone(initial);
    for (const [key,value] of Object.entries(initial)) if (!(key in data)) data[key]=structuredClone(value);
    return data;
  }
  catch { return structuredClone(initial); }
}
function writeStore(data) { localStorage.setItem(KEY, JSON.stringify(data)); window.dispatchEvent(new Event('lingguang:data')); }
function updateStore(mutator) { const data = readStore(); mutator(data); writeStore(data); return data; }
function resetStore() { writeStore(structuredClone(initial)); localStorage.removeItem(DRAFT_KEY); }
function readDraft() { try { return JSON.parse(localStorage.getItem(DRAFT_KEY)) || {}; } catch { return {}; } }
function writeDraft(draft) { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); }
function clearDraft() { localStorage.removeItem(DRAFT_KEY); }
function seedIfEmpty() {
  if (localStorage.getItem(KEY)) return;
  const data = structuredClone(initial);
  data.appointments = [
    { id: crypto.randomUUID(), patientName: 'John Smith', date: new Date().toISOString().slice(0,10), time: '09:00', service: 'Follow-up Acupuncture', status: 'Confirmed' },
    { id: crypto.randomUUID(), patientName: 'Emily Johnson', date: new Date().toISOString().slice(0,10), time: '10:30', service: 'Initial Consultation', status: 'Pending' }
  ];
  writeStore(data);
}


/* ===== src/services/ui.js ===== */
function toast(message) {
  const el = document.querySelector('#toast');
  el.textContent = message; el.classList.add('show');
  clearTimeout(window.__toastTimer); window.__toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
}
function openModal(html) {
  const modal = document.querySelector('#modal');
  document.querySelector('#modal-card').innerHTML = html;
  modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false');
}
function closeModal() {
  const modal = document.querySelector('#modal'); modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true');
}
function escapeHtml(value='') { return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function formatDate(value) { if (!value) return '—'; return new Date(`${value}T12:00:00`).toLocaleDateString('en-CA', { month:'short', day:'numeric', year:'numeric' }); }


/* ===== src/pages/shared.js ===== */
const hero = (title, text, actions='') => `<div class="hero"><div><h2>${title}</h2><p>${text}</p></div>${actions}</div>`;
const empty = text => `<div class="empty-state">${text}</div>`;
const badge = (text, tone='default') => `<span class="badge ${tone}">${text}</span>`;


/* ===== src/modules/intake/intakeState.js ===== */
let step=0;
let draft=readDraft();
function setStep(value){step=Math.max(0,Math.min(4,value));}
function updateDraft(values){draft={...draft,...values};writeDraft(draft);}
function toggleConcern(value){const s=new Set(draft.concerns||[]);s.has(value)?s.delete(value):s.add(value);updateDraft({concerns:[...s]});}
function resetIntake(){step=0;draft={};clearDraft();}


/* ===== src/modules/intake/intakeEngine.js ===== */
function makeSummary(d){return `${d.firstName||''} ${d.lastName||''} reports ${(d.concerns||[]).join(', ')||'general health concerns'}. ${d.notes||''} Pain is ${d.painScore||0}/10${d.painLocation?` at ${d.painLocation}`:''}. Sleep quality is ${d.sleepScore||7}/10, energy ${d.energyScore||6}/10, and stress ${d.stressScore||4}/10.`.replace(/\s+/g,' ').trim();}
function makeTcmSummary(d){return `Cold/heat: ${d.coldHeat||'no clear tendency'}. Digestion: ${d.digestion||'generally comfortable'}.`;}
function detectRisks(d){const risks=[];if(Number(d.painScore)>=8)risks.push('High reported pain score requires practitioner review.');if((d.redFlags||'').trim())risks.push('Patient reported possible red-flag symptoms or significant recent injury.');if(Number(d.stressScore)>=9)risks.push('Very high reported stress level requires follow-up.');return risks;}


/* ===== src/modules/intake/intakeView.js ===== */
const concerns=['Pain','Sleep','Digestion','Emotional Health',"Women's Health","Men's Health",'Wellness','Other'];
function intakeView(){const dots=Array.from({length:5},(_,i)=>`<span class="step-dot ${i<=step?'active':''}"></span>`).join('');return `<div class="stepper">${dots}</div><div class="panel intake-panel">${screens[step]()}</div>`;}
const nav=(next='Continue',back=true)=>`<div class="button-row">${back?'<button class="button secondary" data-intake-back>Back</button>':''}<button class="button primary" data-intake-next>${next}</button></div>`;
const screens=[
()=>`<h2>About You</h2><div class="form-grid"><label>First Name *<input id="firstName" value="${escapeHtml(draft.firstName||'')}"></label><label>Last Name *<input id="lastName" value="${escapeHtml(draft.lastName||'')}"></label><label>Date of Birth *<input id="dob" type="date" value="${escapeHtml(draft.dob||'')}"></label><label>Gender<select id="gender"><option>${escapeHtml(draft.gender||'Select')}</option><option>Female</option><option>Male</option><option>Prefer not to say</option></select></label><label>Phone *<input id="phone" value="${escapeHtml(draft.phone||'')}"></label><label>Email<input id="email" type="email" value="${escapeHtml(draft.email||'')}"></label></div>${nav('Continue',false)}`,
()=>`<h2>Main Concern</h2><p>Select all that apply.</p><div class="pill-grid">${concerns.map(c=>`<button class="pill ${(draft.concerns||[]).includes(c)?'selected':''}" data-concern="${c}">${c}</button>`).join('')}</div><label>Tell us more<textarea id="notes">${escapeHtml(draft.notes||'')}</textarea></label>${nav()}`,
()=>`<h2>Pain & Function</h2><div class="form-grid"><label>Pain Location<input id="painLocation" value="${escapeHtml(draft.painLocation||'')}"></label><label>Pain Score 0–10<input id="painScore" type="number" min="0" max="10" value="${escapeHtml(draft.painScore??0)}"></label><label>Duration<select id="duration"><option>${escapeHtml(draft.duration||'Select')}</option><option>Less than 1 week</option><option>1–4 weeks</option><option>1–3 months</option><option>More than 3 months</option></select></label><label>Affects sleep?<select id="sleepImpact"><option>${escapeHtml(draft.sleepImpact||'No')}</option><option>Yes</option><option>No</option></select></label></div><label>Red-flag symptoms or significant recent injury<textarea id="redFlags">${escapeHtml(draft.redFlags||'')}</textarea></label>${nav()}`,
()=>`<h2>TCM Health Assessment</h2><div class="form-grid"><label>Sleep Quality 0–10<input id="sleepScore" type="number" min="0" max="10" value="${escapeHtml(draft.sleepScore??7)}"></label><label>Energy 0–10<input id="energyScore" type="number" min="0" max="10" value="${escapeHtml(draft.energyScore??6)}"></label><label>Cold / Heat<select id="coldHeat"><option>${escapeHtml(draft.coldHeat||'No clear tendency')}</option><option>Often feels cold</option><option>Often feels hot</option><option>Cold hands or feet</option><option>No clear tendency</option></select></label><label>Digestion<select id="digestion"><option>${escapeHtml(draft.digestion||'Generally comfortable')}</option><option>Generally comfortable</option><option>Bloating</option><option>Reflux</option><option>Low appetite</option><option>Loose stool</option><option>Constipation</option></select></label><label>Stress 0–10<input id="stressScore" type="number" min="0" max="10" value="${escapeHtml(draft.stressScore??4)}"></label></div>${nav('Review')}`,
()=>`<h2>Review & Submit</h2><div class="summary-box"><h3>${escapeHtml(`${draft.firstName||''} ${draft.lastName||''}`)}</h3><p><b>Concerns:</b> ${escapeHtml((draft.concerns||[]).join(', ')||'Not provided')}</p><p><b>Notes:</b> ${escapeHtml(draft.notes||'Not provided')}</p><p><b>Pain:</b> ${escapeHtml(draft.painScore??0)}/10 · ${escapeHtml(draft.painLocation||'No location')}</p><p><b>Sleep:</b> ${escapeHtml(draft.sleepScore??7)}/10 · <b>Energy:</b> ${escapeHtml(draft.energyScore??6)}/10 · <b>Stress:</b> ${escapeHtml(draft.stressScore??4)}/10</p></div><div class="notice">This assessment supports clinical preparation and does not provide a medical diagnosis.</div>${nav('Submit Assessment')}`
];


/* ===== src/pages/today.js ===== */
async function todayPage() {
  const d = readStore();
  const openFollowups = d.followups.filter(x => !x.done);
  const schedule = d.appointments.slice().sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
  return { title:'Today', subtitle:'Practitioner workspace', html:`
    ${hero('Good evening, Dr. Ling.','Here is what needs your attention today.')}
    <div class="stats-grid">
      <div class="stat-card"><span>Patients</span><strong>${d.patients.length}</strong><small>Active local records</small></div>
      <div class="stat-card"><span>Pending Requests</span><strong>${d.appointments.filter(x=>x.status==='Pending').length}</strong><small>Awaiting review</small></div>
      <div class="stat-card"><span>AI Summaries</span><strong>${d.intakes.length}</strong><small>Available for review</small></div>
      <div class="stat-card"><span>Follow-up Tasks</span><strong>${openFollowups.length}</strong><small>Open tasks</small></div>
    </div>
    <div class="two-panel">
      <div class="panel"><div class="panel-head"><h3>Today's Schedule</h3><button class="button secondary" data-route="booking">Add</button></div>
      ${schedule.length ? schedule.map(x=>`<div class="list-row"><b>${escapeHtml(x.time)}</b><div><strong>${escapeHtml(x.patientName)}</strong><small>${escapeHtml(x.service)} · ${formatDate(x.date)}</small></div>${badge(x.status,x.status==='Pending'?'warning':'default')}</div>`).join('') : empty('No appointments yet.')}</div>
      <div class="panel"><div class="panel-head"><h3>Priorities</h3></div>
      ${d.intakes.slice(-2).map(i=>`<div class="list-row"><b>AI</b><div><strong>Review ${escapeHtml(i.patientName)}</strong><small>${escapeHtml(i.concerns.join(', '))}</small></div>${badge('Review','warning')}</div>`).join('') || empty('No priority tasks.')}
      </div>
    </div>` };
}


/* ===== src/pages/booking.js ===== */
async function bookingFormPage() {
  const d = readStore();
  const requestedDate=routeParams.get('date')||calendarTodayISO();
  const patientId=routeParams.get('patient')||'';
  const selectedPatient=d.patients.find(p=>p.id===patientId);
  return { title:'New Booking', subtitle:'Create an appointment', html:`
    ${backBar('booking','Booking')}
    ${hero('New Booking','Save an appointment and return directly to the calendar.')}
    <div class="panel"><form id="booking-form" class="form-grid">
      <label>Patient Name<input name="patientName" required value="${escapeHtml(selectedPatient?.name||'')}"></label>
      <label>Date<input type="date" name="date" required value="${escapeHtml(requestedDate)}"></label>
      <label>Time<input type="time" name="time" required value="${escapeHtml(routeParams.get('time')||'09:00')}"></label>
      <label>Duration<select name="duration"><option value="30">30 minutes</option><option value="45">45 minutes</option><option value="60">60 minutes</option><option value="90">90 minutes</option></select></label>
      <label>Service<select name="service"><option>Follow-up Acupuncture</option><option>Initial Consultation</option><option>Pain Assessment</option><option>Wellness Consultation</option></select></label>
      <label>Status<select name="status"><option>Pending</option><option>Confirmed</option><option>Completed</option><option>Cancelled</option></select></label>
      <label class="wide">Notes<textarea name="notes" placeholder="Optional booking note"></textarea></label>
      <div class="form-action"><button class="button primary">Save Appointment</button></div>
    </form></div>`,
    mount(){
      document.querySelector('#booking-form').addEventListener('submit',e=>{
        e.preventDefault();
        const v=Object.fromEntries(new FormData(e.currentTarget));
        updateStore(store=>store.appointments.push({id:crypto.randomUUID(),...v}));
        toast('Appointment saved');
        router.go(`booking-calendar?view=day&date=${encodeURIComponent(v.date)}`);
      });
    }
  };
}


/* ===== src/pages/patients.js ===== */
async function patientsPage(){const d=readStore();return{title:'Patients',subtitle:'Patient workspace and health snapshots',html:`${hero('Patients','Patient profiles created from completed intake assessments.','<button class="button primary" data-route="intake">New Intake</button>')}<div class="panel">${d.patients.length?`<div class="patient-grid">${d.patients.map(p=>`<article class="patient-card"><div class="patient-avatar">${escapeHtml(p.name.split(' ').map(x=>x[0]).join('').slice(0,2))}</div><div><h3>${escapeHtml(p.name)}</h3><p>${escapeHtml(p.phone||'No phone')}</p><small>${escapeHtml(p.primaryConcern||'No concern')}</small></div><button class="button secondary" data-route="clinical">Open Clinical</button></article>`).join('')}</div>`:empty('Complete an intake assessment to create the first patient.')}</div>`}};


/* ===== src/pages/clinical.js ===== */
async function clinicalNewNotePage(){const d=readStore();const opts=d.patients.map(p=>`<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');return{title:'Clinical',subtitle:'Visit documentation and treatment planning',html:`${hero('Clinical Workspace','Review intake summaries and save practitioner-approved notes.')}<div class="panel"><form id="clinical-form"><label>Patient<select name="patientId">${opts||'<option value="">No patients yet</option>'}</select></label><label>Chief Concern<textarea name="chiefConcern"></textarea></label><label>Assessment<textarea name="assessment"></textarea></label><label>Treatment<textarea name="treatment"></textarea></label><label>Response & Plan<textarea name="plan"></textarea></label><div class="button-row"><button type="button" class="button secondary" id="draft-note">Generate Draft from Intake</button><button class="button primary">Save Clinical Note</button></div></form></div>`,mount(){const form=document.querySelector('#clinical-form');document.querySelector('#draft-note').onclick=()=>{const pid=form.patientId.value;const i=d.intakes.slice().reverse().find(x=>x.patientId===pid);if(!i)return toast('No intake found for this patient');form.chiefConcern.value=i.concerns.join(', ');form.assessment.value=i.summary;form.plan.value='Review response, update care plan, and arrange follow-up as clinically appropriate.';toast('Draft prepared for practitioner review');};form.onsubmit=e=>{e.preventDefault();const v=Object.fromEntries(new FormData(form));if(!v.patientId)return toast('Select a patient');updateStore(d=>d.clinicalNotes.push({id:crypto.randomUUID(),createdAt:new Date().toISOString(),...v}));toast('Clinical note saved');};}}}


/* ===== src/pages/aiCare.js ===== */
async function aiCarePage(){const cards=[['💬','AI Intake','Guided pre-visit questions and structured summary.','ai-intake'],['🧠','Clinical Summary','Condense patient history and recent changes.','clinical-summary'],['📈','Health Analysis','Review trends across pain, sleep, energy, and activity.','health-analysis'],['🏡','Remote Care','Collect daily check-ins and care-plan progress.','remote-care'],['🔄','Follow-up','Prepare reminders and follow-up questions.','follow-up'],['⚠️','Risk Review','Flag information that may need prompt human review.','risk-review']];return{title:'AI Care',subtitle:'Intake, analysis, summaries, and remote care',html:`${hero('AI Care Centre','AI supports intake, summaries, follow-up, and remote care. Practitioner review remains required.')}<div class="module-grid">${cards.map(c=>`<button class="module-card" data-route="${c[3]}"><span>${c[0]}</span><h3>${c[1]}</h3><p>${c[2]}</p></button>`).join('')}</div><div class="notice">AI Care does not provide an independent medical diagnosis. Clinical decisions remain with qualified healthcare professionals.</div>`}};


/* ===== src/pages/intake.js ===== */
function capture(){const value=id=>document.querySelector(`#${id}`)?.value;const maps=[['firstName','lastName','dob','gender','phone','email'],['notes'],['painLocation','painScore','duration','sleepImpact','redFlags'],['sleepScore','energyScore','coldHeat','digestion','stressScore']];if(step<4){const values={};maps[step].forEach(k=>values[k]=value(k));updateDraft(values);}}
function rerender(){document.querySelector('#intake-content').innerHTML=intakeView();mountControls();}
function mountControls(){document.querySelectorAll('[data-concern]').forEach(b=>b.onclick=()=>{toggleConcern(b.dataset.concern);rerender();});document.querySelector('[data-intake-back]')?.addEventListener('click',()=>{capture();setStep(step-1);rerender();});document.querySelector('[data-intake-next]')?.addEventListener('click',()=>{capture();if(step===0&&(!draft.firstName||!draft.lastName||!draft.phone))return toast('First name, last name and phone are required');if(step===1&&!(draft.concerns||[]).length)return toast('Select at least one concern');if(step<4){setStep(step+1);rerender();return;}submit();});}
function submit(){const d={...draft};const name=`${d.firstName} ${d.lastName}`.trim();updateStore(store=>{let patient=store.patients.find(p=>p.name.toLowerCase()===name.toLowerCase());if(!patient){patient={id:crypto.randomUUID(),name,phone:d.phone,email:d.email,primaryConcern:(d.concerns||[]).join(', ')};store.patients.push(patient);}store.intakes.push({id:crypto.randomUUID(),patientId:patient.id,patientName:name,concerns:d.concerns||[],summary:makeSummary(d),tcmSummary:makeTcmSummary(d),risks:detectRisks(d),raw:d,createdAt:new Date().toISOString()});});resetIntake();toast('Assessment submitted');router.go('clinical-summary');}
async function classicIntakePage(){return{title:'AI Intake',subtitle:'Patient health assessment',html:`${hero('Patient Health Assessment','Classic structured intake inside the main LINGGUANG system.')}<div id="intake-content">${intakeView()}</div>`,mount:mountControls};}


/* ===== src/pages/clinicalSummary.js ===== */

async function clinicalSummaryPage(){const d=readStore();return{title:'Clinical Summary',subtitle:'Structured intake summaries',html:`${hero('Clinical Summary','Structured summaries generated from completed intake records.')}<div class="stack">${d.intakes.length?d.intakes.slice().reverse().map(i=>`<article class="panel"><div class="panel-head"><h3>${escapeHtml(i.patientName)}</h3>${badge('Ready')}</div><div class="summary-box"><p><b>Primary concerns:</b> ${escapeHtml(i.concerns.join(', '))}</p><p>${escapeHtml(i.summary)}</p><p><b>TCM observations:</b> ${escapeHtml(i.tcmSummary)}</p>${i.risks.length?`<p class="risk-text"><b>Review flags:</b> ${escapeHtml(i.risks.join('; '))}</p>`:''}</div><button class="button primary" data-route="clinical">Open Clinical Workspace</button></article>`).join(''):empty('No completed intake summaries.')}</div>`}};


/* ===== src/pages/healthAnalysis.js ===== */

async function healthAnalysisPage(){const d=readStore(),v=d.checkins,avg=k=>v.length?(v.reduce((s,x)=>s+Number(x[k]||0),0)/v.length).toFixed(1):'—';const items=[['Pain burden',avg('pain')],['Sleep quality',avg('sleep')],['Energy',avg('energy')]];return{title:'Health Analysis',subtitle:'Pain, sleep, energy, and activity trends',html:`${hero('Health Analysis','Review trends from Remote Care check-ins.')}<div class="stats-grid"><div class="stat-card"><span>Average Pain</span><strong>${avg('pain')}</strong></div><div class="stat-card"><span>Average Sleep</span><strong>${avg('sleep')}</strong></div><div class="stat-card"><span>Average Energy</span><strong>${avg('energy')}</strong></div><div class="stat-card"><span>Check-ins</span><strong>${v.length}</strong></div></div><div class="panel">${items.map(([n,x])=>`<div class="progress-row"><div><b>${n}</b><span>${x==='—'?'No data':x+'/10'}</span></div><div class="progress"><i style="width:${x==='—'?0:Number(x)*10}%"></i></div></div>`).join('')}</div>`}};


/* ===== src/pages/remoteCare.js ===== */

async function remoteCarePage(){const d=readStore(),opts=d.patients.map(p=>`<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');return{title:'Remote Care',subtitle:'Daily check-ins and care-plan progress',html:`${hero('Remote Care','Record daily pain, sleep, energy, and notes.')}<div class="panel"><form id="checkin-form" class="form-grid"><label>Patient<select name="patientId">${opts||'<option value="">No patients yet</option>'}</select></label><label>Pain 0–10<input type="number" name="pain" min="0" max="10" value="3"></label><label>Sleep 0–10<input type="number" name="sleep" min="0" max="10" value="7"></label><label>Energy 0–10<input type="number" name="energy" min="0" max="10" value="6"></label><label class="wide">Daily Note<textarea name="note"></textarea></label><div class="form-action"><button class="button primary">Save Check-in</button></div></form></div><div class="panel">${d.checkins.length?`<table><thead><tr><th>Date</th><th>Patient</th><th>Pain</th><th>Sleep</th><th>Energy</th></tr></thead><tbody>${d.checkins.slice().reverse().map(c=>`<tr><td>${new Date(c.createdAt).toLocaleDateString()}</td><td>${escapeHtml(c.patientName)}</td><td>${c.pain}</td><td>${c.sleep}</td><td>${c.energy}</td></tr>`).join('')}</tbody></table>`:empty('No daily check-ins.')}</div>`,mount(){document.querySelector('#checkin-form').onsubmit=e=>{e.preventDefault();const v=Object.fromEntries(new FormData(e.currentTarget));const p=d.patients.find(p=>p.id===v.patientId);if(!p)return toast('Select a patient');updateStore(s=>s.checkins.push({id:crypto.randomUUID(),patientName:p.name,createdAt:new Date().toISOString(),...v}));toast('Daily check-in saved');location.reload();};}}}


/* ===== src/pages/followUp.js ===== */

async function followUpPage(){const d=readStore(),opts=d.patients.map(p=>`<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');return{title:'Follow-up',subtitle:'Reminders and follow-up questions',html:`${hero('Follow-up','Create and complete follow-up tasks.')}<div class="panel"><form id="follow-form" class="form-grid"><label>Patient<select name="patientId">${opts||'<option value="">No patients yet</option>'}</select></label><label>Due Date<input type="date" name="dueDate" required></label><label class="wide">Task<input name="task" required placeholder="Check pain response after treatment"></label><div class="form-action"><button class="button primary">Add Follow-up</button></div></form></div><div class="panel">${d.followups.length?`<table><thead><tr><th>Patient</th><th>Task</th><th>Due</th><th>Status</th><th></th></tr></thead><tbody>${d.followups.map(f=>`<tr><td>${escapeHtml(f.patientName)}</td><td>${escapeHtml(f.task)}</td><td>${formatDate(f.dueDate)}</td><td>${badge(f.done?'Completed':'Open',f.done?'default':'warning')}</td><td><button class="button mini secondary" data-toggle-follow="${f.id}">${f.done?'Reopen':'Complete'}</button></td></tr>`).join('')}</tbody></table>`:empty('No follow-up tasks.')}</div>`,mount(){document.querySelector('#follow-form').onsubmit=e=>{e.preventDefault();const v=Object.fromEntries(new FormData(e.currentTarget));const p=d.patients.find(p=>p.id===v.patientId);if(!p)return toast('Select a patient');updateStore(s=>s.followups.push({id:crypto.randomUUID(),patientName:p.name,done:false,...v}));toast('Follow-up added');location.reload();};document.querySelectorAll('[data-toggle-follow]').forEach(b=>b.onclick=()=>{updateStore(s=>{const f=s.followups.find(x=>x.id===b.dataset.toggleFollow);f.done=!f.done;});location.reload();});}}}


/* ===== src/pages/riskReview.js ===== */

async function riskReviewPage(){const d=readStore(),risks=d.intakes.flatMap(i=>i.risks.map(r=>({name:i.patientName,reason:r})));return{title:'Risk Review',subtitle:'Information needing human review',html:`${hero('Risk Review','Human review queue created from intake answers.')}<div class="stack">${risks.length?risks.map(r=>`<article class="panel"><div class="panel-head"><h3>${escapeHtml(r.name)}</h3>${badge('Review','danger')}</div><p>${escapeHtml(r.reason)}</p><button class="button secondary">Mark Reviewed</button></article>`).join(''):empty('No current risk flags.')}</div><div class="notice danger">These are screening prompts, not diagnoses. Urgent symptoms require appropriate emergency assessment.</div>`}};


/* ===== src/pages/healthJourney.js ===== */

async function healthJourneyPage(){const d=readStore(),last=d.checkins.at(-1);return{title:'Health Journey',subtitle:'Long-term health and recovery progress',html:`${hero('Health Journey','Long-term change, presented clearly for the patient and practitioner.')}<div class="panel">${last?[['Pain improvement',10-Number(last.pain)],['Sleep quality',Number(last.sleep)],['Energy',Number(last.energy)]].map(([n,v])=>`<div class="progress-row"><div><b>${n}</b><span>${v}/10</span></div><div class="progress"><i style="width:${v*10}%"></i></div></div>`).join(''):empty('Add a Remote Care check-in to begin the Health Journey.')}</div>`}};


/* ===== src/pages/clinic.js ===== */

async function clinicPage(){const d=readStore();return{title:'Clinic',subtitle:'Clinic operations and local data',html:`${hero('Clinic Intelligence','Operational information based on locally stored records.')}<div class="stats-grid"><div class="stat-card"><span>Patients</span><strong>${d.patients.length}</strong></div><div class="stat-card"><span>Appointments</span><strong>${d.appointments.length}</strong></div><div class="stat-card"><span>Clinical Notes</span><strong>${d.clinicalNotes.length}</strong></div><div class="stat-card"><span>Check-ins</span><strong>${d.checkins.length}</strong></div></div><div class="panel"><h3>Local Data Controls</h3><p>This development build stores data in the current browser.</p><button class="button danger" id="reset-data">Reset All Local Data</button></div>`,mount(){document.querySelector('#reset-data').onclick=()=>{if(confirm('Reset all local LINGGUANG data?')){resetStore();toast('Local data reset');location.reload();}};}}}




/* ===== Voice AI Build 010 ===== */
const PLATFORM_ROLE_KEY='lingguang-platform-role-v4';
const PLATFORM_USER_KEY='lingguang-platform-user-v4';

function platformRole(){return sessionStorage.getItem(PLATFORM_ROLE_KEY)||''}
function platformUser(){try{return JSON.parse(sessionStorage.getItem(PLATFORM_USER_KEY)||'{}')}catch{return{}}}
function setPlatformSession(role,user={}){
  sessionStorage.setItem(PLATFORM_ROLE_KEY,role);
  sessionStorage.setItem(PLATFORM_USER_KEY,JSON.stringify(user));
}
function clearPlatformSession(){
  sessionStorage.removeItem(PLATFORM_ROLE_KEY);
  sessionStorage.removeItem(PLATFORM_USER_KEY);
}
function roleHome(role=platformRole()){
  return role==='patient'?'patient-portal':role==='admin'?'admin-portal':'today';
}
function applicationTone(status){
  return status==='Rejected'?'danger':status==='Need More Information'||status==='Waiting Review'?'warning':'default';
}

async function platformEntryPage(){
  return {title:'LINGGUANG',subtitle:'Choose your portal',html:`
    <section class="platform-entry-page">
      <div class="platform-entry-brand">
        <img src="lingguang-logo-full.png?v=2.5.0-icon008" alt="LINGGUANG HEALTH official logo" class="official-logo-full">
        <strong>LINGGUANG</strong><span>Health OS</span>
        <p>AI-powered integrative healthcare platform</p>
      </div>
      <div class="platform-role-grid">
        <button class="platform-role-card professional" data-role-choice="professional">
          <b>👨‍⚕️</b><strong>Healthcare Professional</strong><span>Practitioner · Therapist · Reception</span><i>Enter Professional Portal ›</i>
        </button>
        <button class="platform-role-card patient" data-role-choice="patient">
          <b>🧑</b><strong>Patient Portal</strong><span>Requests · Appointments · Assessments</span><i>Enter Patient Portal ›</i>
        </button>
        <button class="platform-role-card admin" data-role-choice="admin">
          <b>🏥</b><strong>Clinic Administration</strong><span>Staff · Rooms · Services · Reports</span><i>Enter Admin Portal ›</i>
        </button>
      </div>
      <div class="platform-entry-footer"><button class="text-button" data-route="clinic-create">Create a New Clinic</button><span>English · 中文 · Français</span></div>
    </section>`,
    mount(){document.querySelectorAll('[data-role-choice]').forEach(b=>b.onclick=()=>router.go(`role-login?role=${b.dataset.roleChoice}`))}};
}

async function roleLoginPage(){
  const role=routeParams.get('role')||'professional',d=readStore();
  const title=role==='patient'?'Patient Portal':role==='admin'?'Clinic Administration':'Healthcare Professional';
  return {title,subtitle:'Secure portal entry',html:`
    ${backBar('platform-entry','Portal Selection')}
    <section class="role-login-wrap"><div class="role-login-card">
      <img src="lingguang-logo-full.png?v=2.5.0-icon008" alt="LINGGUANG HEALTH official logo" class="official-logo-full">
      <span class="role-login-type">${title}</span><h2>Welcome</h2>
      <form id="role-login-form">
        ${role==='patient'?`
          <label>Patient Profile<select name="patientId" required><option value="">Select patient</option>${d.patients.map(p=>`<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('')}</select></label>
          <label>Phone or access code<input name="credential" required value="demo"></label>
        `:`
          <label>Email or username<input name="username" required value="${role==='admin'?'Clinic Admin':'Dr. Ling'}"></label>
          <label>Password<input name="password" type="password" required value="lingguang"></label>
        `}
        <label class="remember"><input type="checkbox" checked> Remember this session</label>
        <button class="button primary role-login-submit">Enter ${title}</button>
      </form>
      ${role==='patient'&&!d.patients.length?'<div class="notice">No patient profile exists yet. Enter the Professional Portal first and create one.</div>':''}
    </div></section>`,
    mount(){document.querySelector('#role-login-form').onsubmit=e=>{
      e.preventDefault();const v=Object.fromEntries(new FormData(e.currentTarget));
      if(role==='patient'){
        const p=d.patients.find(x=>x.id===v.patientId);if(!p)return toast('Select a patient');
        setPlatformSession('patient',{patientId:p.id,name:p.name});
      }else setPlatformSession(role,{name:v.username||title});
      router.go(roleHome(role));
    }}};
}

async function patientPortalPage(){
  const d=readStore(),u=platformUser(),p=d.patients.find(x=>x.id===u.patientId);
  if(!p)return {title:'Patient Portal',subtitle:'Profile required',html:`${hero('Patient profile unavailable','Choose a valid patient profile.')}<button class="button primary" data-route="platform-entry">Portal Selection</button>`};
  const apps=d.applications.filter(a=>a.patientId===p.id),appts=d.appointments.filter(a=>a.patientName.toLowerCase()===p.name.toLowerCase());
  return {title:'Patient Portal',subtitle:p.name,html:`
    <section class="patient-portal-welcome"><div><span>WELCOME</span><h2>${escapeHtml(p.name)}</h2><p>Only information linked to your patient profile is shown here.</p></div><button class="button secondary" id="patient-switch">Switch Portal</button></section>
    <div class="patient-portal-stats"><div><span>Applications</span><strong>${apps.length}</strong></div><div><span>Appointments</span><strong>${appts.length}</strong></div><div><span>Check-ins</span><strong>${d.checkins.filter(c=>c.patientId===p.id).length}</strong></div></div>
    <div class="panel"><div class="menu-list">
      ${menuCard('📝','Request Appointment','Submit an application for clinic review','patient-application-new')}
      ${menuCard('📄','My Applications','Track application status','patient-applications')}
      ${menuCard('📅','My Appointments','View appointments linked to you','patient-appointments')}
      ${menuCard('🤖','AI Health Assessment','Conversation-style pre-assessment','ai-conversation')}
      ${menuCard('📋','Classic Intake Form','Structured health assessment','intake')}
      ${menuCard('📈','My Health Journey','Your own progress records','patient-my-journey')}
      ${menuCard('📤','Upload Reports','Secure upload placeholder','patient-upload')}
      ${menuCard('💬','Messages','Communicate with the clinic','patient-messages')}
      ${menuCard('👤','My Profile','Personal information','patient-my-profile')}
    </div></div>`,
    mount(){document.querySelector('#patient-switch').onclick=()=>{clearPlatformSession();router.go('platform-entry')}}};
}

async function patientApplicationNewPage(){
  const d=readStore(),u=platformUser(),p=d.patients.find(x=>x.id===u.patientId);
  if(!p)return patientPortalPage();
  return {title:'Appointment Request',subtitle:p.name,html:`
    ${backBar('patient-portal','Patient Portal')}
    ${hero('Request an Appointment','This application does not occupy the calendar until a professional approves it.')}
    <div class="panel"><form id="application-form" class="form-grid">
      <label>Primary Concern<select name="concern"><option>Pain</option><option>Sleep</option><option>Digestion</option><option>Stress / Emotional Health</option><option>Women’s Health</option><option>Wellness</option><option>Other</option></select></label>
      <label>Preferred Service<select name="service"><option>Initial Consultation</option><option>Follow-up Acupuncture</option><option>Pain Assessment</option><option>Wellness Consultation</option></select></label>
      <label>Preferred Date<input name="preferredDate" type="date"></label>
      <label>Preferred Time<select name="preferredTime"><option>Morning</option><option>Afternoon</option><option>Evening</option><option>Any time</option></select></label>
      <label class="wide">Describe Your Concern<textarea name="description" required></textarea></label>
      <label class="wide">Reports / Images Note<textarea name="filesNote"></textarea></label>
      <div class="form-action"><button class="button primary">Submit Application</button></div>
    </form></div>`,
    mount(){document.querySelector('#application-form').onsubmit=async e=>{
      e.preventDefault();const v=Object.fromEntries(new FormData(e.currentTarget));
      let analysis={mode:'rule',summary:v.description,missingQuestions:[]};
      try{analysis=await window.LINGGUANG_LOCAL_AI.analyze(v.description)}catch{}
      updateStore(s=>s.applications.push({id:crypto.randomUUID(),patientId:p.id,patientName:p.name,createdAt:new Date().toISOString(),status:'Waiting Review',...v,aiMode:analysis.mode,aiSummary:analysis.summary,missingQuestions:analysis.missingQuestions||[],reviewNote:''}));
      toast('Application submitted');router.go('patient-applications');
    }}};
}

async function patientApplicationsPage(){
  const u=platformUser(),rows=readStore().applications.filter(a=>a.patientId===u.patientId).reverse();
  return {title:'My Applications',subtitle:'Status tracking',html:`
    ${backBar('patient-portal','Patient Portal')}
    ${hero('My Applications','Review status and clinic responses.','<button class="button primary" data-route="patient-application-new">New Request</button>')}
    <div class="panel">${rows.length?rows.map(a=>`<article class="application-card"><div class="application-card-head"><div><strong>${escapeHtml(a.concern)}</strong><small>${new Date(a.createdAt).toLocaleDateString()} · ${escapeHtml(a.service)}</small></div>${badge(a.status,applicationTone(a.status))}</div><p>${escapeHtml(a.description)}</p>${a.reviewNote?`<div class="application-review-note"><b>Clinic note:</b> ${escapeHtml(a.reviewNote)}</div>`:''}${a.status==='Need More Information'?`<button class="button primary" data-reply-app="${a.id}">Provide More Information</button>`:''}</article>`).join(''):empty('No applications yet.')}</div>`,
    mount(){document.querySelectorAll('[data-reply-app]').forEach(b=>b.onclick=()=>{
      const a=readStore().applications.find(x=>x.id===b.dataset.replyApp);
      openModal(`<div class="panel-head"><h3>More Information</h3><button class="button secondary" onclick="closeModal()">Close</button></div><p>${escapeHtml(a.reviewNote)}</p><label>Your Response<textarea id="app-patient-reply"></textarea></label><button class="button primary" onclick="submitPatientReply('${a.id}')">Send Response</button>`);
    })}};
}
window.submitPatientReply=id=>{
  const text=document.querySelector('#app-patient-reply')?.value.trim();if(!text)return toast('Enter your response');
  updateStore(d=>{const a=d.applications.find(x=>x.id===id);a.patientReply=text;a.status='Waiting Review';a.reviewNote='Patient supplied additional information.'});
  closeModal();toast('Response sent');render();
};

async function patientAppointmentsPage(){
  const d=readStore(),u=platformUser(),p=d.patients.find(x=>x.id===u.patientId);
  const rows=p?d.appointments.filter(a=>a.patientName.toLowerCase()===p.name.toLowerCase()).sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time)):[];
  return {title:'My Appointments',subtitle:p?.name||'',html:`${backBar('patient-portal','Patient Portal')}${hero('My Appointments','Only appointments linked to your profile are shown.')}<div class="panel">${rows.length?rows.map(a=>`<article class="patient-appointment-card"><time>${formatDate(a.date)} · ${escapeHtml(a.time)}</time><strong>${escapeHtml(a.service)}</strong>${badge(a.status,a.status==='Pending'?'warning':'default')}</article>`).join(''):empty('No appointments yet.')}</div>`};
}
async function patientMyJourneyPage(){routeParams=new URLSearchParams(`patient=${encodeURIComponent(platformUser().patientId||'')}`);return patientJourneyPage()}
async function patientMyProfilePage(){routeParams=new URLSearchParams(`patient=${encodeURIComponent(platformUser().patientId||'')}`);return patientBasicPage()}
async function patientUploadPage(){return{title:'Upload Reports',subtitle:'Patient documents',html:`${backBar('patient-portal','Patient Portal')}${hero('Upload Reports','Secure upload is reserved for the cloud version.')}<div class="panel"><label>Document Type<select><option>Lab Report</option><option>MRI / X-ray</option><option>Referral</option><option>Prescription</option></select></label><label>Select File<input type="file" disabled></label><div class="notice">File transfer is disabled until secure storage and audit logging are connected.</div></div>`}}
async function patientMessagesPage(){
  const u=platformUser(),rows=readStore().messages.filter(m=>m.patientId===u.patientId);
  return {title:'Messages',subtitle:'Patient and clinic',html:`${backBar('patient-portal','Patient Portal')}${hero('Messages','Non-urgent communication with the clinic.')}<div class="panel">${rows.map(m=>`<div class="message-bubble ${m.sender}"><b>${m.sender==='patient'?'You':'Clinic'}</b><p>${escapeHtml(m.text)}</p><small>${new Date(m.createdAt).toLocaleString()}</small></div>`).join('')||empty('No messages yet.')}<form id="patient-message-form"><label>New Message<textarea name="text" required></textarea></label><button class="button primary">Send Message</button></form></div>`,mount(){document.querySelector('#patient-message-form').onsubmit=e=>{e.preventDefault();const v=Object.fromEntries(new FormData(e.currentTarget));updateStore(d=>d.messages.push({id:crypto.randomUUID(),patientId:u.patientId,sender:'patient',text:v.text,createdAt:new Date().toISOString()}));toast('Message sent');render()}}}
}

async function applicationsHubPage(){
  const d=readStore();
  return {title:'Applications',subtitle:'Review before scheduling',html:`${backBar('booking','Booking')}${hero('Appointment Applications','Applications stay outside the calendar until approved.')}<div class="panel"><div class="menu-list">
    ${menuCard('⏳','Waiting Review',`${d.applications.filter(a=>a.status==='Waiting Review').length} application(s)`,'applications-waiting')}
    ${menuCard('❓','Need More Information',`${d.applications.filter(a=>a.status==='Need More Information').length} application(s)`,'applications-more-info')}
    ${menuCard('✅','Approved',`${d.applications.filter(a=>a.status==='Approved').length} application(s)`,'applications-approved')}
    ${menuCard('📅','Scheduled',`${d.applications.filter(a=>a.status==='Scheduled').length} application(s)`,'applications-scheduled')}
    ${menuCard('🗄️','All Applications',`${d.applications.length} total`,'applications-all')}
  </div></div>`};
}
function applicationListFactory(status,title){
  return async function(){
    const rows=readStore().applications.filter(a=>!status||a.status===status).reverse();
    return {title,subtitle:'Application queue',html:`${backBar('applications','Applications')}${hero(title,'Select an application to review.')}<div class="panel">${rows.length?rows.map(a=>`<button class="application-list-row" data-open-application="${a.id}"><div><strong>${escapeHtml(a.patientName)}</strong><small>${escapeHtml(a.concern)} · ${escapeHtml(a.service)}</small></div>${badge(a.status,applicationTone(a.status))}<span>›</span></button>`).join(''):empty('No applications in this category.')}</div>`,mount(){document.querySelectorAll('[data-open-application]').forEach(b=>b.onclick=()=>router.go(`application-review?id=${b.dataset.openApplication}`))}};
  }
}
const applicationsWaitingPage=applicationListFactory('Waiting Review','Waiting Review');
const applicationsMoreInfoPage=applicationListFactory('Need More Information','Need More Information');
const applicationsApprovedPage=applicationListFactory('Approved','Approved Applications');
const applicationsScheduledPage=applicationListFactory('Scheduled','Scheduled Applications');
const applicationsAllPage=applicationListFactory(null,'All Applications');

async function applicationReviewPage(){
  const d=readStore(),a=d.applications.find(x=>x.id===routeParams.get('id'));
  if(!a)return{title:'Application Review',subtitle:'Not found',html:`${backBar('applications','Applications')}${empty('Application not found.')}`};
  return {title:'Application Review',subtitle:a.patientName,html:`${backBar('applications','Applications')}<div class="application-review-hero"><div><span>APPLICATION</span><h2>${escapeHtml(a.patientName)}</h2><p>${escapeHtml(a.concern)} · ${escapeHtml(a.service)}</p></div>${badge(a.status,applicationTone(a.status))}</div><div class="application-review-grid"><section class="panel"><h3>Patient Request</h3><p><b>Preferred:</b> ${formatDate(a.preferredDate)} · ${escapeHtml(a.preferredTime)}</p><p>${escapeHtml(a.description)}</p>${a.patientReply?`<p><b>Patient reply:</b> ${escapeHtml(a.patientReply)}</p>`:''}</section><section class="panel"><h3>AI Pre-assessment</h3><p><b>Mode:</b> ${escapeHtml(a.aiMode||'rule')}</p><p>${escapeHtml(a.aiSummary||a.description)}</p><p><b>Suggested questions:</b> ${escapeHtml((a.missingQuestions||[]).join('; ')||'None')}</p></section></div><div class="panel"><label>Professional Review Note<textarea id="review-note">${escapeHtml(a.reviewNote||'')}</textarea></label><div class="button-row"><button class="button primary" data-review-action="approve">Approve</button><button class="button secondary" data-review-action="more">Need More Information</button><button class="button danger" data-review-action="reject">Reject</button></div></div>`,
    mount(){document.querySelectorAll('[data-review-action]').forEach(b=>b.onclick=()=>{
      const note=document.querySelector('#review-note').value.trim(),action=b.dataset.reviewAction;
      if(action==='approve'){updateStore(d=>{const x=d.applications.find(x=>x.id===a.id);x.status='Approved';x.reviewNote=note||'Approved for scheduling.'});router.go(`application-schedule?id=${a.id}`)}
      else if(action==='more'){if(!note)return toast('Enter the information needed');updateStore(d=>{const x=d.applications.find(x=>x.id===a.id);x.status='Need More Information';x.reviewNote=note});toast('Information request saved');router.go('applications')}
      else{updateStore(d=>{const x=d.applications.find(x=>x.id===a.id);x.status='Rejected';x.reviewNote=note||'Application rejected.'});toast('Application rejected');router.go('applications')}
    })}};
}
async function applicationSchedulePage(){
  const d=readStore(),a=d.applications.find(x=>x.id===routeParams.get('id'));
  if(!a)return applicationReviewPage();
  return {title:'Schedule Application',subtitle:a.patientName,html:`${backBar(`application-review?id=${a.id}`,'Application Review')}${hero('Create Appointment','Approved application becomes a confirmed calendar appointment.')}<div class="panel"><form id="schedule-application-form" class="form-grid"><label>Patient<input value="${escapeHtml(a.patientName)}" disabled></label><label>Date<input name="date" type="date" required value="${escapeHtml(a.preferredDate||calendarTodayISO())}"></label><label>Time<input name="time" type="time" required value="09:00"></label><label>Duration<select name="duration"><option value="60">60 minutes</option><option value="30">30 minutes</option><option value="45">45 minutes</option><option value="90">90 minutes</option></select></label><label>Service<input name="service" value="${escapeHtml(a.service)}"></label><label>Practitioner<input name="practitioner" value="Dr. Ling"></label><div class="form-action"><button class="button primary">Confirm Appointment</button></div></form></div>`,mount(){document.querySelector('#schedule-application-form').onsubmit=e=>{e.preventDefault();const v=Object.fromEntries(new FormData(e.currentTarget));updateStore(d=>{d.appointments.push({id:crypto.randomUUID(),patientName:a.patientName,date:v.date,time:v.time,duration:v.duration,service:v.service,status:'Confirmed',practitioner:v.practitioner,applicationId:a.id,notes:`Created from application ${a.id}`});const x=d.applications.find(x=>x.id===a.id);x.status='Scheduled';x.appointmentDate=v.date;x.appointmentTime=v.time});toast('Appointment created');router.go(`booking-calendar?view=day&date=${v.date}`)}}};
}

async function adminPortalPage(){
  const d=readStore();
  return {title:'Clinic Administration',subtitle:'Operations portal',html:`<section class="admin-portal-welcome"><div><span>CLINIC ADMINISTRATION</span><h2>LINGGUANG Clinic</h2><p>Administrative controls are separated from clinical and patient portals.</p></div><button class="button secondary" id="admin-switch">Switch Portal</button></section><div class="dashboard-metrics"><div class="dashboard-metric emerald"><span>Staff</span><strong>1</strong><small>Active</small></div><div class="dashboard-metric amber"><span>Rooms</span><strong>3</strong><small>Configured</small></div><div class="dashboard-metric violet"><span>Services</span><strong>4</strong><small>Bookable</small></div><div class="dashboard-metric blue"><span>Applications</span><strong>${d.applications.length}</strong><small>Total</small></div></div><div class="panel"><div class="menu-list">${menuCard('👨‍⚕️','Staff','People and permissions','admin-staff')}${menuCard('🚪','Rooms','Treatment rooms','admin-rooms')}${menuCard('🧾','Services','Services and duration','admin-services')}${menuCard('🕘','Business Hours','Clinic availability','admin-hours')}${menuCard('📊','Reports','Clinic statistics','clinic')}${menuCard('⚙️','System Settings','Privacy, language and Local AI','settings')}</div></div>`,mount(){document.querySelector('#admin-switch').onclick=()=>{clearPlatformSession();router.go('platform-entry')}}};
}
async function adminPlaceholderPage(){
  const names={'admin-staff':'Staff','admin-rooms':'Rooms','admin-services':'Services','admin-hours':'Business Hours','clinic-create':'Create Clinic'},name=names[currentRouteInfo().route]||'Administration';
  return {title:name,subtitle:'Administration module',html:`${backBar(currentRouteInfo().route==='clinic-create'?'platform-entry':'admin-portal',currentRouteInfo().route==='clinic-create'?'Portal Selection':'Administration')}${hero(name,'This navigation level is active. Secure multi-user administration will be connected with the cloud database and authentication layer.')}<div class="notice">Current settings are local development placeholders.</div>`};
}



/* ===== Voice AI Build 010 ===== */
const SpeechRecognitionAPI=window.SpeechRecognition||window.webkitSpeechRecognition;
function voiceNewSession(patient){return{id:crypto.randomUUID(),code:`VS-${Date.now()}`,patientId:patient?.id||'',patientName:patient?.name||'',doctor:platformUser().name||'Dr. Ling',startedAt:new Date().toISOString(),endedAt:'',status:'Draft',language:'en-CA',transcript:'',soap:{subjective:'',objective:'',assessment:'',plan:''},confidence:0,confirmed:false}}
function voiceSaveSession(s){updateStore(d=>{d.voiceSessions=d.voiceSessions||[];const i=d.voiceSessions.findIndex(x=>x.id===s.id);i>=0?d.voiceSessions[i]=s:d.voiceSessions.push(s)})}
function voiceSOAP(text){const t=String(text||'').trim(),l=t.toLowerCase(),missing=[];if(/pain|疼|痛/.test(l)&&!/\b(10|[0-9])\s*(?:\/\s*10|out of 10)?\b/.test(l))missing.push('Pain score (VAS) is missing.');if(/shoulder|肩/.test(l)&&!/rom|range of motion|活动度|活动范围/.test(l))missing.push('Consider documenting shoulder ROM.');return{subjective:t,objective:/rom|range of motion|检查|活动度/.test(l)?t:'',assessment:/improv|better|worse|改善|加重/.test(l)?t:'',plan:/acupuncture|针灸|cupping|拔罐|plan|计划|复诊/.test(l)?t:'',missing,confidence:t.length>20?88:72}}
function voiceIntent(text){const t=String(text||'').toLowerCase();if(/预约|calendar|appointment/.test(t))return['booking-calendar?view=day&date='+calendarTodayISO(),'Today calendar'];if(/申请|application/.test(t))return['applications-waiting','Pending applications'];if(/新建患者|new patient/.test(t))return['patient-new','New patient'];if(/病历|clinical note/.test(t))return['clinical-new','Clinical note'];return null}
async function voiceAIPage(){const d=readStore(),rows=(d.voiceSessions||[]).slice().reverse();return{title:'Voice AI',subtitle:'Consultation and reviewed voice drafts',html:`${backBar('today','Dashboard')}${hero('LINGGUANG Voice AI','Create a consultation session, dictate a draft and confirm it before saving.','<button class="button primary" data-route="voice-consultation">Start Consultation</button>')}<div class="voice-status-grid"><div class="voice-status-card"><span>Browser Speech</span><strong>${SpeechRecognitionAPI?'Available':'Typed Fallback'}</strong><small>Cloud speech is not connected yet.</small></div><div class="voice-status-card"><span>Safety</span><strong>Review Required</strong><small>No voice draft becomes a clinical note automatically.</small></div><div class="voice-status-card"><span>Sessions</span><strong>${rows.length}</strong><small>${rows.filter(x=>x.status!=='Saved').length} awaiting review</small></div></div><div class="panel"><div class="menu-list">${menuCard('💬','Voice Conversation','Talk with LINGGUANG and receive spoken follow-up questions','voice-conversation')}${menuCard('🩺','Consultation Workspace','Patient-linked voice session','voice-consultation')}${menuCard('🧭','Voice Command','Open common modules by voice','voice-command')}${menuCard('✅','Review Center','Review and save voice drafts','voice-review')}</div></div><div class="notice">Build 010 adds a working voice conversation loop with spoken questions, speech input, typed fallback, context memory and reviewed summaries. Cloud language-model connection remains optional.</div>`}}
async function voiceConsultationPage(){const d=readStore();return{title:'Consultation Workspace',subtitle:'Create a voice session',html:`${backBar('voice-ai','Voice AI')}${hero('Start Consultation','Select a patient and begin a reviewed session.')}<div class="panel"><form id="voice-start-form" class="form-grid"><label>Patient<select name="patientId" required><option value="">Select patient</option>${d.patients.map(p=>`<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('')}</select></label><label>Language<select name="language"><option value="en-CA">English</option><option value="zh-CN">中文</option><option value="yue-Hant-HK">粵語</option><option value="fr-CA">Français</option></select></label><label>Session Type<select name="sessionType"><option>Follow-up Consultation</option><option>Initial Consultation</option><option>Treatment Session</option></select></label><div class="form-action"><button class="button primary">Create Session</button></div></form></div>`,mount(){document.querySelector('#voice-start-form').onsubmit=e=>{e.preventDefault();const v=Object.fromEntries(new FormData(e.currentTarget)),p=d.patients.find(x=>x.id===v.patientId);if(!p)return toast('Select a patient');const s=voiceNewSession(p);s.language=v.language;s.sessionType=v.sessionType;voiceSaveSession(s);router.go(`voice-session?id=${s.id}`)}}}}
async function voiceSessionPage(){const s=(readStore().voiceSessions||[]).find(x=>x.id===routeParams.get('id'));if(!s)return{title:'Voice Session',subtitle:'Not found',html:empty('Session not found')};return{title:'Voice Session',subtitle:s.patientName,html:`${backBar('voice-ai','Voice AI')}<section class="voice-session-banner"><div><span>${escapeHtml(s.code)}</span><h2>${escapeHtml(s.patientName)}</h2><p>${escapeHtml(s.sessionType||'Consultation')} · ${escapeHtml(s.doctor)}</p></div><div><b id="voice-state">Draft</b></div></section><div class="voice-workspace-grid"><section class="panel"><div class="panel-head"><h3>Live Transcript</h3><span>${SpeechRecognitionAPI?'Ready':'Typed fallback'}</span></div><label>Language<select id="voice-language"><option value="en-CA">English</option><option value="zh-CN">中文</option><option value="yue-Hant-HK">粵語</option><option value="fr-CA">Français</option></select></label><button type="button" class="voice-record-button" id="voice-record"><span>🎙</span><strong>Start Listening</strong><small>Tap to begin</small></button><textarea id="voice-transcript" rows="11" placeholder="Speak or type here">${escapeHtml(s.transcript||'')}</textarea><div class="button-row"><button class="button secondary" id="voice-command-test">Run as Command</button><button class="button primary" id="voice-soap">Generate SOAP Draft</button></div></section><section class="panel"><h3>Clinical Copilot</h3><div id="voice-copilot" class="voice-empty">Generate a draft to see documentation reminders.</div></section></div>`,mount(){let r=null,listening=false;const box=document.querySelector('#voice-transcript'),btn=document.querySelector('#voice-record'),lang=document.querySelector('#voice-language');lang.value=s.language||'en-CA';if(SpeechRecognitionAPI){r=new SpeechRecognitionAPI();r.continuous=true;r.interimResults=false;r.onresult=e=>{for(let i=e.resultIndex;i<e.results.length;i++)if(e.results[i].isFinal)box.value=(box.value+' '+e.results[i][0].transcript).trim();s.transcript=box.value;voiceSaveSession(s)};r.onend=()=>{if(listening)try{r.start()}catch{}}}btn.onclick=()=>{if(!r)return toast('Live browser speech unavailable. Type the transcript instead.');listening=!listening;r.lang=lang.value;try{listening?r.start():r.stop()}catch{}btn.classList.toggle('listening',listening);btn.querySelector('strong').textContent=listening?'Listening…':'Start Listening'};box.oninput=()=>{s.transcript=box.value;voiceSaveSession(s)};document.querySelector('#voice-command-test').onclick=()=>{const x=voiceIntent(box.value);if(x){toast(`Opening ${x[1]}`);router.go(x[0])}else toast('Clinical content detected. Generate a SOAP draft instead.')};document.querySelector('#voice-soap').onclick=()=>{s.transcript=box.value;if(!s.transcript.trim())return toast('Add transcript text first');s.soap=voiceSOAP(s.transcript);s.confidence=s.soap.confidence;s.status='Review';voiceSaveSession(s);router.go(`voice-review-session?id=${s.id}`)}}}}
async function voiceReviewSessionPage(){const s=(readStore().voiceSessions||[]).find(x=>x.id===routeParams.get('id'));if(!s)return voiceReviewPage();const q=s.soap||voiceSOAP(s.transcript);return{title:'Voice Review',subtitle:s.patientName,html:`${backBar(`voice-session?id=${s.id}`,'Voice Session')}${hero('Review Before Saving','Edit every section. Nothing enters the clinical record until confirmed.')}<div class="panel"><form id="voice-review-form" class="form-grid"><label class="wide">Subjective<textarea name="subjective" rows="5">${escapeHtml(q.subjective||'')}</textarea></label><label class="wide">Objective<textarea name="objective" rows="4">${escapeHtml(q.objective||'')}</textarea></label><label class="wide">Assessment<textarea name="assessment" rows="4">${escapeHtml(q.assessment||'')}</textarea></label><label class="wide">Plan<textarea name="plan" rows="4">${escapeHtml(q.plan||'')}</textarea></label><div class="wide">${(q.missing||[]).map(x=>`<div class="voice-suggestion">⚠ ${escapeHtml(x)}</div>`).join('')}</div><div class="form-action"><button class="button primary">Confirm & Save Clinical Note</button></div></form></div>`,mount(){document.querySelector('#voice-review-form').onsubmit=e=>{e.preventDefault();const v=Object.fromEntries(new FormData(e.currentTarget));s.soap=v;s.status='Saved';s.confirmed=true;s.endedAt=new Date().toISOString();voiceSaveSession(s);updateStore(d=>d.clinicalNotes.push({id:crypto.randomUUID(),patientId:s.patientId,date:calendarTodayISO(),type:'Voice SOAP Note',note:`S: ${v.subjective}\n\nO: ${v.objective}\n\nA: ${v.assessment}\n\nP: ${v.plan}`,sessionId:s.id,createdAt:new Date().toISOString()}));toast('Voice note saved to Clinical');router.go(`patient-clinical?patient=${s.patientId}`)}}}}
async function voiceCommandPage(){return{title:'Voice Command',subtitle:'Local navigation',html:`${backBar('voice-ai','Voice AI')}${hero('Voice Command','Test common commands without a language-model call.')}<div class="panel"><label>Command<input id="voice-command-input" placeholder="Open today calendar"></label><div class="button-row"><button class="button secondary" id="voice-command-speak">🎙 Speak</button><button class="button primary" id="voice-command-run">Run</button></div></div>`,mount(){const input=document.querySelector('#voice-command-input');document.querySelector('#voice-command-speak').onclick=()=>{if(!SpeechRecognitionAPI)return toast('Browser speech unavailable');const r=new SpeechRecognitionAPI();r.onresult=e=>input.value=e.results[0][0].transcript;r.start()};document.querySelector('#voice-command-run').onclick=()=>{const x=voiceIntent(input.value);x?router.go(x[0]):toast('Command not recognized')}}}}
async function voiceReviewPage(){const rows=(readStore().voiceSessions||[]).slice().reverse();return{title:'Voice Review Center',subtitle:'Sessions',html:`${backBar('voice-ai','Voice AI')}${hero('Review Center','Every voice session remains a draft until confirmed.')}<div class="panel">${rows.length?rows.map(s=>`<button class="application-list-row" data-vs="${s.id}"><div><strong>${escapeHtml(s.patientName||'Unassigned')}</strong><small>${escapeHtml(s.code)} · ${new Date(s.startedAt).toLocaleString()}</small></div>${badge(s.status,s.status==='Saved'?'default':'warning')}<span>›</span></button>`).join(''):empty('No voice sessions yet.')}</div>`,mount(){document.querySelectorAll('[data-vs]').forEach(b=>b.onclick=()=>router.go(`voice-review-session?id=${b.dataset.vs}`))}}}
function bindVoiceHeader(){const b=document.querySelector('#voice-header-button');if(b){b.hidden=!platformRole();b.onclick=()=>router.go('voice-conversation')}}
async function voicePatientPage(){
  router.go('voice-conversation');
  return{title:'Patient Voice Intake',subtitle:'Opening conversation',html:'<div class="notice">Opening Voice Conversation…</div>'};
}
function voiceConversationCopy(language){
  const zh=String(language).startsWith('zh')||String(language).startsWith('yue');
  return zh ? {
    welcome:'您好，我是 LINGGUANG Voice AI。请告诉我，今天最想咨询的健康问题是什么？',
    duration:'这个问题持续多久了？',
    location:'具体是身体哪个部位？左侧、右侧，还是两侧？',
    severity:'如果用 0 到 10 分表示，目前大约几分？',
    pattern:'什么情况下会加重或减轻？',
    sleep:'它是否影响睡眠或日常活动？',
    treatment:'之前做过哪些治疗或检查？效果怎么样？',
    goal:'这次最希望得到什么帮助？',
    complete:'谢谢，我已经整理好本次情况。请检查摘要，确认后再保存。',
    noSpeech:'我没有听清楚。您可以再说一次，也可以直接输入文字。',
    processing:'我正在整理您的回答。'
  } : {
    welcome:'Hello, I am LINGGUANG Voice AI. What is the main health concern you would like to discuss today?',
    duration:'How long has this concern been present?',
    location:'Where exactly is it located? Is it on the left, right, or both sides?',
    severity:'On a scale from 0 to 10, how severe is it now?',
    pattern:'What makes it better or worse?',
    sleep:'Does it affect sleep or daily activity?',
    treatment:'What treatment or testing have you already had, and did it help?',
    goal:'What help are you hoping to receive from this visit?',
    complete:'Thank you. I have organized the information. Please review the summary before saving.',
    noSpeech:'I did not catch that. Please try again or type your response.',
    processing:'I am organizing your response.'
  };
}
function voiceConversationQuestion(stage,copy){
  return copy[stage]||copy.complete;
}
function voiceConversationNormalize(text){
  return String(text||'')
    .replace(/\s+/g,' ')
    .replace(/油漆厉害/g,'尤其厉害')
    .replace(/肩与/g,'肩髃')
    .trim();
}
function voiceConversationExtract(convo,text){
  const t=voiceConversationNormalize(text);
  const l=t.toLowerCase();
  const facts=convo.facts;
  if(convo.stage==='concern')facts.concern=t;
  if(convo.stage==='duration')facts.duration=t;
  if(convo.stage==='location')facts.location=t;
  if(convo.stage==='severity'){
    const m=t.match(/(?:^|\D)(10|[0-9])(?:\s*(?:\/\s*10|out of 10|分))?/i);
    facts.severity=m?m[1]:t;
  }
  if(convo.stage==='pattern')facts.pattern=t;
  if(convo.stage==='sleep')facts.sleep=t;
  if(convo.stage==='treatment')facts.treatment=t;
  if(convo.stage==='goal')facts.goal=t;

  // Helpful opportunistic extraction from any answer.
  if(!facts.duration){
    const m=t.match(/(?:for\s+)?(\d+\s*(?:day|days|week|weeks|month|months|year|years)|\d+\s*(?:天|周|星期|个月|月|年))/i);
    if(m)facts.duration=m[1];
  }
  if(!facts.severity){
    const m=t.match(/(?:pain|疼痛|痛).{0,8}(10|[0-9])(?:\s*(?:\/\s*10|out of 10|分))?/i);
    if(m)facts.severity=m[1];
  }
  if(!facts.location && /(shoulder|back|neck|knee|hip|head|肩|腰|颈|脖子|膝|髋|头)/i.test(t))facts.location=t;
  return facts;
}
function voiceConversationNextStage(stage){
  const order=['concern','duration','location','severity','pattern','sleep','treatment','goal'];
  const i=order.indexOf(stage);
  return i<0||i===order.length-1?'complete':order[i+1];
}
function voiceConversationSummary(convo){
  const f=convo.facts;
  const zh=String(convo.language).startsWith('zh')||String(convo.language).startsWith('yue');
  if(zh){
    return {
      title:'健康情况摘要',
      lines:[
        ['主要问题',f.concern||'未记录'],
        ['持续时间',f.duration||'未记录'],
        ['部位/侧别',f.location||'未记录'],
        ['程度',f.severity?`${f.severity}/10`:'未记录'],
        ['加重或缓解因素',f.pattern||'未记录'],
        ['睡眠/活动影响',f.sleep||'未记录'],
        ['既往治疗/检查',f.treatment||'未记录'],
        ['本次目标',f.goal||'未记录']
      ]
    };
  }
  return {
    title:'Health Concern Summary',
    lines:[
      ['Main concern',f.concern||'Not recorded'],
      ['Duration',f.duration||'Not recorded'],
      ['Location / side',f.location||'Not recorded'],
      ['Severity',f.severity?`${f.severity}/10`:'Not recorded'],
      ['Better / worse factors',f.pattern||'Not recorded'],
      ['Sleep / activity impact',f.sleep||'Not recorded'],
      ['Prior treatment / testing',f.treatment||'Not recorded'],
      ['Goal for this visit',f.goal||'Not recorded']
    ]
  };
}
function voiceSpeak(text,language){
  if(!('speechSynthesis' in window))return;
  window.speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(text);
  u.lang=language||'en-CA';
  u.rate=0.96;
  window.speechSynthesis.speak(u);
}
function voiceConversationSave(convo){
  localStorage.setItem(VOICE_CONVO_KEY,JSON.stringify(convo));
}
function voiceConversationLoad(){
  try{return JSON.parse(localStorage.getItem(VOICE_CONVO_KEY)||'null')}catch{return null}
}
function voiceConversationRenderMessages(convo){
  return convo.messages.map(m=>`
    <div class="voice-chat-message ${m.sender}">
      <div class="voice-chat-avatar">${m.sender==='assistant'?'✦':'●'}</div>
      <div class="voice-chat-bubble">
        <strong>${m.sender==='assistant'?'LINGGUANG':'You'}</strong>
        <p>${escapeHtml(m.text)}</p>
      </div>
    </div>`).join('');
}
function voiceConversationSummaryHTML(convo){
  const s=voiceConversationSummary(convo);
  return `<section class="voice-summary-card">
    <h3>${escapeHtml(s.title)}</h3>
    ${s.lines.map(([k,v])=>`<div><span>${escapeHtml(k)}</span><strong>${escapeHtml(v)}</strong></div>`).join('')}
  </section>`;
}

async function voiceConversationPage(){
  const requestedLanguage=routeParams.get('language')||'en-CA';
  const requestedRole=platformRole()==='patient'?'patient':'professional';
  let convo=voiceConversationLoad();
  if(!convo||convo.completed||convo.role!==requestedRole){
    convo=voiceConversationInitial(requestedLanguage,requestedRole);
    const copy=voiceConversationCopy(convo.language);
    convo.messages.push({sender:'assistant',text:copy.welcome,at:new Date().toISOString()});
    voiceConversationSave(convo);
  }
  return {
    title:'Voice Conversation',
    subtitle:'Listen · Understand · Respond',
    html:`${backBar(requestedRole==='patient'?'patient-portal':'voice-ai',requestedRole==='patient'?'Patient Portal':'Voice AI')}
      <section class="voice-conversation-hero">
        <div><span>VOICE AI BETA 010</span><h2>LINGGUANG Conversation</h2><p>Speak naturally or type. Every clinical result remains a draft until confirmed.</p></div>
        <div class="voice-conversation-status"><i></i><b id="voice-conversation-status">Ready</b></div>
      </section>
      <div class="voice-conversation-layout">
        <section class="panel voice-chat-panel">
          <div class="voice-chat-toolbar">
            <label>Language
              <select id="voice-chat-language">
                <option value="en-CA">English</option>
                <option value="zh-CN">中文</option>
                <option value="yue-Hant-HK">粵語</option>
                <option value="fr-CA">Français</option>
              </select>
            </label>
            <label class="voice-auto-speak"><input id="voice-auto-speak" type="checkbox" checked> Read replies aloud</label>
            <button class="button secondary" id="voice-new-conversation">New Conversation</button>
          </div>
          <div id="voice-chat-messages" class="voice-chat-messages">${voiceConversationRenderMessages(convo)}</div>
          <div class="voice-chat-composer">
            <button type="button" class="voice-chat-mic" id="voice-chat-mic" aria-label="Start microphone">🎙</button>
            <textarea id="voice-chat-input" rows="2" placeholder="Speak or type your response"></textarea>
            <button type="button" class="button primary" id="voice-chat-send">Send</button>
          </div>
          <div id="voice-chat-interim" class="voice-interim"></div>
        </section>
        <aside id="voice-chat-summary" class="voice-conversation-side">
          ${voiceConversationSummaryHTML(convo)}
          <div class="panel voice-conversation-actions">
            <button class="button secondary" id="voice-copy-summary">Copy Summary</button>
            <button class="button primary" id="voice-save-result" ${convo.completed?'':'disabled'}>${requestedRole==='patient'?'Create Application Draft':'Create Clinical Draft'}</button>
          </div>
        </aside>
      </div>`,
    mount(){mountVoiceConversation(convo)}
  };
}

function mountVoiceConversation(convo){
  const messages=document.querySelector('#voice-chat-messages');
  const input=document.querySelector('#voice-chat-input');
  const send=document.querySelector('#voice-chat-send');
  const mic=document.querySelector('#voice-chat-mic');
  const interim=document.querySelector('#voice-chat-interim');
  const status=document.querySelector('#voice-conversation-status');
  const lang=document.querySelector('#voice-chat-language');
  const autoSpeak=document.querySelector('#voice-auto-speak');
  const summary=document.querySelector('#voice-chat-summary');
  const save=document.querySelector('#voice-save-result');
  let recognition=null,listening=false;
  lang.value=convo.language||'en-CA';

  function refresh(){
    messages.innerHTML=voiceConversationRenderMessages(convo);
    messages.scrollTop=messages.scrollHeight;
    summary.querySelector('.voice-summary-card').outerHTML=voiceConversationSummaryHTML(convo);
    save.disabled=!convo.completed;
    voiceConversationSave(convo);
  }
  function assistantReply(text){
    convo.messages.push({sender:'assistant',text,at:new Date().toISOString()});
    refresh();
    if(autoSpeak.checked)voiceSpeak(text,convo.language);
  }
  function handleUser(text){
    text=voiceConversationNormalize(text);
    if(!text)return;
    convo.messages.push({sender:'user',text,at:new Date().toISOString()});
    voiceConversationExtract(convo,text);
    convo.stage=voiceConversationNextStage(convo.stage);
    const copy=voiceConversationCopy(convo.language);
    if(convo.stage==='complete'){
      convo.completed=true;
      assistantReply(copy.complete);
    }else{
      assistantReply(voiceConversationQuestion(convo.stage,copy));
    }
    input.value='';
  }
  send.onclick=()=>handleUser(input.value);
  input.addEventListener('keydown',e=>{
    if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleUser(input.value)}
  });
  lang.onchange=()=>{
    convo.language=lang.value;
    voiceConversationSave(convo);
    toast('Voice language updated');
  };
  document.querySelector('#voice-new-conversation').onclick=()=>{
    localStorage.removeItem(VOICE_CONVO_KEY);
    router.go(`voice-conversation?language=${encodeURIComponent(lang.value)}`);
    setTimeout(()=>render(),0);
  };
  document.querySelector('#voice-copy-summary').onclick=async()=>{
    const s=voiceConversationSummary(convo);
    const text=s.lines.map(([k,v])=>`${k}: ${v}`).join('\n');
    try{await navigator.clipboard.writeText(text);toast('Summary copied')}catch{toast('Copy unavailable')}
  };
  save.onclick=()=>{
    const s=voiceConversationSummary(convo);
    const note=s.lines.map(([k,v])=>`${k}: ${v}`).join('\n');
    if(convo.role==='patient'){
      const d=readStore(),u=platformUser(),p=d.patients.find(x=>x.id===u.patientId);
      if(!p)return toast('Patient profile is required');
      updateStore(store=>store.applications.push({
        id:crypto.randomUUID(),patientId:p.id,patientName:p.name,
        createdAt:new Date().toISOString(),status:'Waiting Review',
        concern:convo.facts.concern||'Voice Intake',
        service:'Initial Consultation',
        description:note,preferredDate:'',preferredTime:'Any time',
        filesNote:'',aiSummary:note,aiMode:'voice-conversation-local',
        missingQuestions:[],reviewNote:''
      }));
      toast('Application draft created');
      convo.completed=true;voiceConversationSave(convo);
      router.go('patient-applications');
    }else{
      const d=readStore();
      const patient=d.patients[0];
      if(!patient)return toast('Create a patient profile first');
      const soap=voiceSOAP(note);
      updateStore(store=>store.clinicalNotes.push({
        id:crypto.randomUUID(),patientId:patient.id,date:calendarTodayISO(),
        type:'Voice Conversation Draft',
        note:`S: ${soap.subjective}\n\nO: ${soap.objective}\n\nA: ${soap.assessment}\n\nP: ${soap.plan}`,
        createdAt:new Date().toISOString(),draft:true
      }));
      toast('Clinical draft created');
      convo.completed=true;voiceConversationSave(convo);
      router.go(`patient-clinical?patient=${patient.id}`);
    }
  };

  if(SpeechRecognitionAPI){
    recognition=new SpeechRecognitionAPI();
    recognition.continuous=false;
    recognition.interimResults=true;
    recognition.lang=convo.language;
    recognition.onstart=()=>{listening=true;mic.classList.add('listening');status.textContent='Listening'};
    recognition.onresult=e=>{
      let finalText='',temp='';
      for(let i=e.resultIndex;i<e.results.length;i++){
        const t=e.results[i][0].transcript;
        if(e.results[i].isFinal)finalText+=t; else temp+=t;
      }
      interim.textContent=temp;
      if(finalText){input.value=voiceConversationNormalize(finalText);interim.textContent=''}
    };
    recognition.onerror=e=>{
      status.textContent='Ready';mic.classList.remove('listening');
      assistantReply(voiceConversationCopy(convo.language).noSpeech);
    };
    recognition.onend=()=>{
      listening=false;mic.classList.remove('listening');status.textContent='Ready';
      if(input.value.trim())handleUser(input.value);
    };
    mic.onclick=()=>{
      recognition.lang=lang.value;
      if(listening){try{recognition.stop()}catch{};return}
      try{recognition.start()}catch{toast('Microphone is already active')}
    };
  }else{
    mic.onclick=()=>toast('Live speech is unavailable in this browser. Type your response below.');
  }

  // Read the opening message once on page entry.
  if(convo.messages.length===1&&autoSpeak.checked){
    setTimeout(()=>voiceSpeak(convo.messages[0].text,convo.language),350);
  }
}


/* ===== Navigation Edition Build 001 ===== */
let routeParams = new URLSearchParams();

function menuCard(icon,title,text,route,extra=''){
  return `<button class="menu-entry" data-route="${route}" ${extra}>
    <span class="menu-icon">${icon}</span>
    <span class="menu-copy"><strong>${title}</strong><small>${text}</small></span>
    <span class="menu-arrow">›</span>
  </button>`;
}
function backBar(parent,label='Back'){
  return `<div class="back-bar"><button type="button" class="button secondary back-button" onclick="LINGGUANG_NAV.goBack('${parent.replace(/'/g,"\\'")}')">← ${label}</button></div>`;
}
function selectedPatient(){
  const id=routeParams.get('patient');
  return readStore().patients.find(p=>p.id===id);
}
function patientRoute(route,id){
  return `${route}?patient=${encodeURIComponent(id)}`;
}

async function todayPage(){
  const d=readStore();
  const open=d.followups.filter(x=>!x.done).length;
  const pending=d.appointments.filter(x=>x.status==='Pending').length;
  const nextAppointments=d.appointments
    .filter(x=>x.date>=calendarTodayISO()&&x.status!=='Cancelled')
    .sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time))
    .slice(0,4);

  return {title:'Dashboard',subtitle:'Clinic overview',html:`
    <section class="dashboard-welcome">
      <div>
        <span class="dashboard-kicker">LINGGUANG HEALTH OS</span>
        <h2>Good day, Dr. Ling.</h2>
        <p>Today is a good day to care for every patient with insight and balance.</p>
      </div>
      <div class="dashboard-date">
        <strong>${new Date().toLocaleDateString('en-CA',{weekday:'long'})}</strong>
        <span>${new Date().toLocaleDateString('en-CA',{month:'long',day:'numeric',year:'numeric'})}</span>
      </div>
    </section>

    <div class="dashboard-metrics">
      <button class="dashboard-metric emerald" data-route="booking-calendar">
        <span>Today's Appointments</span><strong>${d.appointments.filter(x=>x.date===calendarTodayISO()).length}</strong><small>View calendar</small>
      </button>
      <button class="dashboard-metric amber" data-route="applications-waiting">
        <span>Pending Applications</span><strong>${d.applications.filter(a=>a.status==='Waiting Review').length}</strong><small>Review applications</small>
      </button>
      <button class="dashboard-metric violet" data-route="clinical-summary">
        <span>AI Summaries</span><strong>${d.intakes.length}</strong><small>Available for review</small>
      </button>
      <button class="dashboard-metric blue" data-route="follow-up">
        <span>Follow-up Tasks</span><strong>${open}</strong><small>Open tasks</small>
      </button>
    </div>

    <div class="dashboard-grid">
      <section class="panel dashboard-schedule">
        <div class="panel-head"><h3>Today's Schedule</h3><button class="button secondary" data-route="booking-calendar?view=day&date=${calendarTodayISO()}">View Full Calendar</button></div>
        ${nextAppointments.length?nextAppointments.map(a=>`
          <button class="schedule-row" data-route="booking-calendar?view=day&date=${encodeURIComponent(a.date)}">
            <time>${escapeHtml(a.time||'—')}</time>
            <div><strong>${escapeHtml(a.patientName)}</strong><small>${escapeHtml(a.service||'Appointment')} · ${formatDate(a.date)}</small></div>
            <span class="badge">${escapeHtml(a.status||'Pending')}</span>
          </button>`).join(''):empty('No upcoming appointments.')}
      </section>

      <section class="panel dashboard-actions">
        <div class="panel-head"><h3>Quick Actions</h3><span>Choose one</span></div>
        <div class="quick-action-grid">
          ${menuCard('📄','Applications','Review appointment applications','applications')}${menuCard('➕','New Booking','Create a direct appointment','booking-new')}
          ${menuCard('👤','New Patient','Create a patient profile','patient-new')}
          ${menuCard('💬','AI Intake','Start a health assessment','ai-intake')}
          ${menuCard('🩺','Clinical Note','Create a practitioner note','clinical-new')}
        </div>
      </section>
    </div>`};
}

async function patientsPage(){
  const d=readStore();
  return {title:'Patients',subtitle:'Patient hub',html:`
    ${backBar('today','Dashboard')}
    ${hero('Patients','Choose the next patient action.')}
    <div class="panel"><div class="menu-list">
      ${menuCard('➕','New Patient','Create a basic patient profile','patient-new')}
      ${menuCard('💬','New Health Assessment','Start an intake and create/update a patient','ai-intake')}
      ${menuCard('👥','Patient List',`${d.patients.length} patient record(s)`,'patient-list')}
      ${menuCard('🗄️','Archived Patients','View archived patient records','patient-archived')}
    </div></div>`};
}

async function patientNewPage(){
  return {title:'New Patient',subtitle:'Create a basic profile',html:`
    ${backBar('patients','Patients')}
    ${hero('New Patient','Create the profile first. Clinical and AI records can be added afterward.')}
    <div class="panel"><form id="new-patient-form" class="form-grid">
      <label>First Name *<input name="firstName" required></label>
      <label>Last Name *<input name="lastName" required></label>
      <label>Phone *<input name="phone" required></label>
      <label>Email<input name="email" type="email"></label>
      <label>Date of Birth<input name="dob" type="date"></label>
      <label>Preferred Language<select name="language"><option>English</option><option>中文</option><option>Français</option><option>Other</option></select></label>
      <div class="form-action"><button class="button primary">Save Patient</button></div>
    </form></div>`,mount(){
      document.querySelector('#new-patient-form').onsubmit=e=>{
        e.preventDefault(); const v=Object.fromEntries(new FormData(e.currentTarget));
        const id=crypto.randomUUID();
        updateStore(d=>d.patients.push({id,name:`${v.firstName} ${v.lastName}`.trim(),phone:v.phone,email:v.email,dob:v.dob,language:v.language,primaryConcern:'Not recorded',archived:false}));
        toast('Patient saved'); router.go(patientRoute('patient-detail',id));
      };
    }};
}

async function patientListPage(){
  const d=readStore(); const active=d.patients.filter(p=>!p.archived);
  return {title:'Patient List',subtitle:'Select a patient',html:`
    ${backBar('patients','Patients')}
    ${hero('Patient List','Tap the Open button to enter the patient profile.')}
    <div class="panel">${active.length?`<div class="patient-grid">${active.map(p=>`
      <article class="patient-card">
        <div class="patient-avatar">${escapeHtml(p.name.split(' ').map(x=>x[0]).join('').slice(0,2))}</div>
        <div><h3>${escapeHtml(p.name)}</h3><p>${escapeHtml(p.phone||'No phone')}</p><small>${escapeHtml(p.primaryConcern||'No concern')}</small></div>
        <button class="button primary" data-route="${patientRoute('patient-detail',p.id)}">Open ›</button>
      </article>`).join('')}</div>`:empty('No patients yet. Create a patient or complete an intake.')}</div>`};
}

async function patientArchivedPage(){
  const d=readStore(); const rows=d.patients.filter(p=>p.archived);
  return {title:'Archived Patients',subtitle:'Archived patient records',html:`
    ${backBar('patients','Patients')}
    ${hero('Archived Patients','Archived records remain available for review.')}
    <div class="panel">${rows.length?rows.map(p=>menuCard('👤',p.name,p.phone||'No phone',patientRoute('patient-detail',p.id))).join(''):empty('No archived patients.')}</div>`};
}

async function patientDetailPage(){
  const p=selectedPatient(); if(!p)return {title:'Patient',subtitle:'Record not found',html:`${backBar('patient-list','Patient List')}${empty('Patient record not found.')}`};
  return {title:p.name,subtitle:'Patient profile hub',html:`
    ${backBar('patient-list','Patient List')}
    <div class="hero patient-profile-hero"><div><h2>${escapeHtml(p.name)}</h2><p>${escapeHtml(p.phone||'No phone')} · ${escapeHtml(p.primaryConcern||'No main concern')}</p></div><span class="badge">${p.archived?'Archived':'Active'}</span></div>
    <div class="panel"><div class="menu-list">
      ${menuCard('👤','Basic Information','Contact, language and personal details',patientRoute('patient-basic',p.id))}
      ${menuCard('📅','Booking History','Appointments connected to this patient',patientRoute('patient-bookings',p.id))}
      ${menuCard('🩺','Clinical Records','Clinical notes and treatment history',patientRoute('patient-clinical',p.id))}
      ${menuCard('🤖','AI Care','Intake summaries, risks and analysis',patientRoute('patient-ai',p.id))}
      ${menuCard('📈','Health Journey','Check-ins and recovery timeline',patientRoute('patient-journey',p.id))}
      ${menuCard('🏡','Remote Care','Daily pain, sleep and energy check-in',patientRoute('patient-remote',p.id))}
      ${menuCard('📄','Documents','Reports, consent and referral placeholders',patientRoute('patient-documents',p.id))}
    </div></div>
    <button class="button ${p.archived?'secondary':'danger'}" id="archive-patient">${p.archived?'Restore Patient':'Archive Patient'}</button>`,
    mount(){document.querySelector('#archive-patient').onclick=()=>{updateStore(d=>{const x=d.patients.find(x=>x.id===p.id);x.archived=!x.archived});toast(p.archived?'Patient restored':'Patient archived');router.go('patient-list');};}};
}

async function patientBasicPage(){
  const p=selectedPatient(); if(!p)return patientDetailPage();
  return {title:'Basic Information',subtitle:p.name,html:`
    ${backBar(patientRoute('patient-detail',p.id),p.name)}
    ${hero('Basic Information','Update the patient profile.')}
    <div class="panel"><form id="patient-basic-form" class="form-grid">
      <label>Name *<input name="name" required value="${escapeHtml(p.name)}"></label>
      <label>Phone<input name="phone" value="${escapeHtml(p.phone||'')}"></label>
      <label>Email<input name="email" type="email" value="${escapeHtml(p.email||'')}"></label>
      <label>Date of Birth<input name="dob" type="date" value="${escapeHtml(p.dob||'')}"></label>
      <label>Preferred Language<input name="language" value="${escapeHtml(p.language||'')}"></label>
      <label>Primary Concern<input name="primaryConcern" value="${escapeHtml(p.primaryConcern||'')}"></label>
      <div class="form-action"><button class="button primary">Save Changes</button></div>
    </form></div>`,mount(){document.querySelector('#patient-basic-form').onsubmit=e=>{e.preventDefault();const v=Object.fromEntries(new FormData(e.currentTarget));updateStore(d=>Object.assign(d.patients.find(x=>x.id===p.id),v));toast('Patient profile updated');};}};
}

async function patientBookingsPage(){
  const p=selectedPatient(),d=readStore();if(!p)return patientDetailPage();
  const rows=d.appointments.filter(a=>a.patientName.toLowerCase()===p.name.toLowerCase());
  return {title:'Booking History',subtitle:p.name,html:`
    ${backBar(patientRoute('patient-detail',p.id),p.name)}
    ${hero('Booking History','Appointments matched to this patient name.','<button class="button primary" data-route="booking-new">New Booking</button>')}
    <div class="panel">${rows.length?`<table><thead><tr><th>Date</th><th>Time</th><th>Service</th><th>Status</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${formatDate(x.date)}</td><td>${escapeHtml(x.time)}</td><td>${escapeHtml(x.service)}</td><td>${badge(x.status,x.status==='Pending'?'warning':'default')}</td></tr>`).join('')}</tbody></table>`:empty('No matching appointments.')}</div>`};
}

async function patientClinicalPage(){
  const p=selectedPatient(),d=readStore();if(!p)return patientDetailPage();
  const notes=d.clinicalNotes.filter(n=>n.patientId===p.id);
  return {title:'Clinical Records',subtitle:p.name,html:`
    ${backBar(patientRoute('patient-detail',p.id),p.name)}
    ${hero('Clinical Records','Open existing records or create a new practitioner note.','<button class="button primary" data-route="clinical-new">New Note</button>')}
    <div class="panel">${notes.length?notes.slice().reverse().map(n=>`<div class="record-row"><div><strong>${new Date(n.createdAt).toLocaleDateString()}</strong><small>${escapeHtml(n.chiefConcern||'Clinical note')}</small></div><button class="button secondary" data-note="${n.id}">View ›</button></div>`).join(''):empty('No clinical records for this patient.')}</div>`,
    mount(){document.querySelectorAll('[data-note]').forEach(b=>b.onclick=()=>{const n=notes.find(x=>x.id===b.dataset.note);openModal(`<div class="panel-head"><h3>Clinical Note</h3><button class="button secondary" onclick="closeModal()">Close</button></div><p><b>Chief concern:</b> ${escapeHtml(n.chiefConcern||'—')}</p><p><b>Assessment:</b> ${escapeHtml(n.assessment||'—')}</p><p><b>Treatment:</b> ${escapeHtml(n.treatment||'—')}</p><p><b>Plan:</b> ${escapeHtml(n.plan||'—')}</p>`);});}};
}

async function patientAiPage(){
  const p=selectedPatient(),d=readStore();if(!p)return patientDetailPage();
  const count=d.intakes.filter(i=>i.patientId===p.id).length;
  return {title:'Patient AI Care',subtitle:p.name,html:`
    ${backBar(patientRoute('patient-detail',p.id),p.name)}
    ${hero('AI Care','Choose an AI-assisted function for this patient.')}
    <div class="panel"><div class="menu-list">
      ${menuCard('💬','New AI Intake','Start a new structured assessment','ai-intake')}
      ${menuCard('🧠','Clinical Summaries',`${count} summary record(s)`,'clinical-summary')}
      ${menuCard('📈','Health Analysis','Review remote-care trends','health-analysis')}
      ${menuCard('⚠️','Risk Review','Review screening flags','risk-review')}
      ${menuCard('🧠','Local AI Engine','Download and test the browser-based local model','settings-local-ai')}
    </div></div>`};
}

async function patientJourneyPage(){
  const p=selectedPatient(),d=readStore();if(!p)return patientDetailPage();
  const rows=d.checkins.filter(c=>c.patientId===p.id);
  return {title:'Health Journey',subtitle:p.name,html:`
    ${backBar(patientRoute('patient-detail',p.id),p.name)}
    ${hero('Health Journey','A timeline of assessments, care and progress.')}
    <div class="panel">${rows.length?rows.slice().reverse().map(c=>`<div class="timeline-item"><b>${new Date(c.createdAt).toLocaleDateString()}</b><div>Pain ${c.pain}/10 · Sleep ${c.sleep}/10 · Energy ${c.energy}/10</div><small>${escapeHtml(c.note||'Daily check-in')}</small></div>`).join(''):empty('No remote-care check-ins yet.')}</div>`};
}

async function patientRemotePage(){
  const p=selectedPatient();if(!p)return patientDetailPage();
  return {title:'Remote Care',subtitle:p.name,html:`
    ${backBar(patientRoute('patient-detail',p.id),p.name)}
    ${hero('Remote Care Check-in','Record today’s pain, sleep and energy.')}
    <div class="panel"><form id="patient-checkin" class="form-grid">
      <label>Pain 0–10<input name="pain" type="number" min="0" max="10" value="3"></label>
      <label>Sleep 0–10<input name="sleep" type="number" min="0" max="10" value="7"></label>
      <label>Energy 0–10<input name="energy" type="number" min="0" max="10" value="6"></label>
      <label class="wide">Daily Note<textarea name="note"></textarea></label>
      <div class="form-action"><button class="button primary">Save Check-in</button></div>
    </form></div>`,mount(){document.querySelector('#patient-checkin').onsubmit=e=>{e.preventDefault();const v=Object.fromEntries(new FormData(e.currentTarget));updateStore(d=>d.checkins.push({id:crypto.randomUUID(),patientId:p.id,patientName:p.name,createdAt:new Date().toISOString(),...v}));toast('Remote-care check-in saved');router.go(patientRoute('patient-journey',p.id));};}};
}

async function patientDocumentsPage(){
  const p=selectedPatient();if(!p)return patientDetailPage();
  return {title:'Documents',subtitle:p.name,html:`
    ${backBar(patientRoute('patient-detail',p.id),p.name)}
    ${hero('Documents','The navigation and document categories are active. Cloud file storage will be connected later.')}
    <div class="panel"><div class="menu-list">
      ${menuCard('✍️','Consent Forms','Patient consent records','document-placeholder')}
      ${menuCard('🧪','Lab Reports','Blood tests and other laboratory results','document-placeholder')}
      ${menuCard('🩻','Imaging','MRI, X-ray and ultrasound reports','document-placeholder')}
      ${menuCard('📨','Referrals','Referral and specialist letters','document-placeholder')}
    </div></div>`};
}
async function documentPlaceholderPage(){return{title:'Document Category',subtitle:'Storage connection pending',html:`${backBar('patients','Patients')}${hero('Document Category','This button and navigation level are active. Secure cloud upload will be added with the database layer.')}<div class="notice">No patient document is uploaded or transmitted in this local build.</div>`};}


/* ===== Booking Calendar Build 002 ===== */
const CALENDAR_STATE_KEY='lingguang-booking-calendar-state-v2';

function calendarTodayISO(){
  const d=new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function calendarParseISO(value){
  const match=String(value||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(!match)return new Date();
  return new Date(Number(match[1]),Number(match[2])-1,Number(match[3]),12,0,0,0);
}
function calendarISO(date){
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
function calendarAddDays(value,days){
  const d=calendarParseISO(value);d.setDate(d.getDate()+days);return calendarISO(d);
}
function calendarAddMonths(value,months){
  const d=calendarParseISO(value);d.setDate(1);d.setMonth(d.getMonth()+months);return calendarISO(d);
}
function calendarStartMonday(value){
  const d=calendarParseISO(value);
  const offset=(d.getDay()+6)%7;
  d.setDate(d.getDate()-offset);
  return calendarISO(d);
}
function calendarMonthTitle(value){
  return calendarParseISO(value).toLocaleDateString('en-CA',{month:'long',year:'numeric'});
}
function calendarDayTitle(value){
  return calendarParseISO(value).toLocaleDateString('en-CA',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
}
function calendarShortDay(value){
  return calendarParseISO(value).toLocaleDateString('en-CA',{weekday:'short',month:'short',day:'numeric'});
}
function calendarAppointmentsOn(date,appointments=readStore().appointments){
  return appointments.filter(a=>a.date===date).sort((a,b)=>(a.time||'').localeCompare(b.time||''));
}
function calendarTone(status){
  if(status==='Confirmed')return 'confirmed';
  if(status==='Pending')return 'pending';
  if(status==='Completed')return 'completed';
  if(status==='Cancelled')return 'cancelled';
  return 'default';
}
function calendarLoadState(){
  try{return JSON.parse(localStorage.getItem(CALENDAR_STATE_KEY))||{view:'month',date:calendarTodayISO()}}
  catch{return{view:'month',date:calendarTodayISO()}}
}
function calendarSaveState(view,date){
  localStorage.setItem(CALENDAR_STATE_KEY,JSON.stringify({view,date}));
}
function calendarRoute(view,date){
  return `booking-calendar?view=${encodeURIComponent(view)}&date=${encodeURIComponent(date)}`;
}
function calendarAppointmentChip(a,compact=false){
  return `<button type="button" class="calendar-event ${calendarTone(a.status)} ${compact?'compact':''}" data-calendar-appointment="${a.id}">
    <span class="calendar-event-time">${escapeHtml(a.time||'—')}</span>
    <span class="calendar-event-name">${escapeHtml(a.patientName)}</span>
    ${compact?'':`<small>${escapeHtml(a.service||'Appointment')}</small>`}
  </button>`;
}
function calendarControls(view,date,title){
  return `<div class="calendar-toolbar">
    <div class="calendar-nav-actions">
      <button type="button" class="button secondary" data-calendar-move="-1">‹</button>
      <button type="button" class="button secondary" data-calendar-today>Today</button>
      <button type="button" class="button secondary" data-calendar-move="1">›</button>
    </div>
    <h3>${escapeHtml(title)}</h3>
    <div class="calendar-view-switch" role="group" aria-label="Calendar view">
      <button type="button" class="${view==='month'?'active':''}" data-calendar-view="month">Month</button>
      <button type="button" class="${view==='week'?'active':''}" data-calendar-view="week">Week</button>
      <button type="button" class="${view==='day'?'active':''}" data-calendar-view="day">Day</button>
    </div>
  </div>`;
}
function calendarMonthHTML(date,appointments){
  const focus=calendarParseISO(date);
  const first=new Date(focus.getFullYear(),focus.getMonth(),1,12);
  const gridStart=new Date(first);
  gridStart.setDate(first.getDate()-((first.getDay()+6)%7));
  const weekdays=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  let cells='';
  for(let i=0;i<42;i++){
    const d=new Date(gridStart);d.setDate(gridStart.getDate()+i);
    const iso=calendarISO(d);
    const rows=calendarAppointmentsOn(iso,appointments);
    const outside=d.getMonth()!==focus.getMonth();
    const today=iso===calendarTodayISO();
    const selected=iso===date;
    cells+=`<div class="calendar-month-cell ${outside?'outside':''} ${today?'today':''} ${selected?'selected':''}">
      <button type="button" class="calendar-date-button" data-calendar-date="${iso}">
        <span>${d.getDate()}</span>${rows.length?`<b>${rows.length}</b>`:''}
      </button>
      <div class="calendar-cell-events">
        ${rows.slice(0,3).map(a=>calendarAppointmentChip(a,true)).join('')}
        ${rows.length>3?`<button type="button" class="calendar-more" data-calendar-date="${iso}">+${rows.length-3} more</button>`:''}
      </div>
    </div>`;
  }
  return `<div class="calendar-month-scroll"><div class="calendar-month">
    ${weekdays.map(x=>`<div class="calendar-weekday">${x}</div>`).join('')}
    ${cells}
  </div></div>`;
}
function calendarWeekHTML(date,appointments){
  const start=calendarStartMonday(date);
  const days=Array.from({length:7},(_,i)=>calendarAddDays(start,i));
  const hours=Array.from({length:13},(_,i)=>i+7);
  return `<div class="calendar-week-scroll"><div class="calendar-week">
    <div class="calendar-week-corner"></div>
    ${days.map(day=>`<button type="button" class="calendar-week-header ${day===calendarTodayISO()?'today':''}" data-calendar-date="${day}"><strong>${calendarParseISO(day).toLocaleDateString('en-CA',{weekday:'short'})}</strong><span>${calendarParseISO(day).getDate()}</span></button>`).join('')}
    ${hours.map(hour=>{
      const hourLabel=`${String(hour).padStart(2,'0')}:00`;
      return `<div class="calendar-hour-label">${hourLabel}</div>${days.map(day=>{
        const rows=calendarAppointmentsOn(day,appointments).filter(a=>Number((a.time||'00').slice(0,2))===hour);
        return `<button type="button" class="calendar-week-slot" data-calendar-new="${day}|${hourLabel}">
          ${rows.map(a=>calendarAppointmentChip(a,true)).join('')}
        </button>`;
      }).join('')}`;
    }).join('')}
  </div></div>`;
}
function calendarDayHTML(date,appointments){
  const rows=calendarAppointmentsOn(date,appointments);
  const hours=Array.from({length:15},(_,i)=>i+7);
  return `<div class="calendar-day">
    <div class="calendar-day-summary">
      <strong>${rows.length}</strong><span>appointment${rows.length===1?'':'s'}</span>
      <button type="button" class="button primary" data-route="booking-new?date=${encodeURIComponent(date)}">New Appointment</button>
    </div>
    <div class="calendar-day-timeline">
      ${hours.map(hour=>{
        const hourLabel=`${String(hour).padStart(2,'0')}:00`;
        const inHour=rows.filter(a=>Number((a.time||'00').slice(0,2))===hour);
        return `<div class="calendar-day-hour">
          <div class="calendar-day-time">${hourLabel}</div>
          <button type="button" class="calendar-day-slot" data-calendar-new="${date}|${hourLabel}">
            ${inHour.map(a=>calendarAppointmentChip(a,false)).join('')}
            ${inHour.length===0?'<span class="calendar-empty-slot">Tap to book</span>':''}
          </button>
        </div>`;
      }).join('')}
    </div>
  </div>`;
}
function calendarOpenAppointment(id){
  const d=readStore();
  const a=d.appointments.find(x=>x.id===id);
  if(!a)return toast('Appointment not found');
  openModal(`<div class="panel-head"><h3>Appointment</h3><button class="button secondary" onclick="closeModal()">Close</button></div>
    <div class="appointment-detail">
      <p><b>Patient:</b> ${escapeHtml(a.patientName)}</p>
      <p><b>Date:</b> ${formatDate(a.date)}</p>
      <p><b>Time:</b> ${escapeHtml(a.time||'—')}</p>
      <p><b>Duration:</b> ${escapeHtml(a.duration||'30')} minutes</p>
      <p><b>Service:</b> ${escapeHtml(a.service||'—')}</p>
      <p><b>Status:</b> ${escapeHtml(a.status||'—')}</p>
      <p><b>Notes:</b> ${escapeHtml(a.notes||'None')}</p>
    </div>
    <div class="button-row">
      <button class="button primary" onclick="calendarSetAppointmentStatus('${a.id}','Confirmed')">Confirm</button>
      <button class="button secondary" onclick="calendarSetAppointmentStatus('${a.id}','Completed')">Complete</button>
      <button class="button danger" onclick="calendarDeleteAppointment('${a.id}')">Delete</button>
    </div>`);
}
window.calendarSetAppointmentStatus=(id,status)=>{
  updateStore(d=>{const a=d.appointments.find(x=>x.id===id);if(a)a.status=status});
  closeModal();toast(`Appointment marked ${status.toLowerCase()}`);render();
};
window.calendarDeleteAppointment=id=>{
  if(!confirm('Delete this appointment?'))return;
  updateStore(d=>d.appointments=d.appointments.filter(x=>x.id!==id));
  closeModal();toast('Appointment deleted');render();
};

async function bookingCalendarPage(){
  const stored=calendarLoadState();
  const view=['month','week','day'].includes(routeParams.get('view'))?routeParams.get('view'):stored.view;
  const date=/^\d{4}-\d{2}-\d{2}$/.test(routeParams.get('date')||'')?routeParams.get('date'):stored.date;
  calendarSaveState(view,date);
  const appointments=readStore().appointments;
  const title=view==='month'?calendarMonthTitle(date):view==='week'?`${calendarShortDay(calendarStartMonday(date))} – ${calendarShortDay(calendarAddDays(calendarStartMonday(date),6))}`:calendarDayTitle(date);
  const content=view==='month'?calendarMonthHTML(date,appointments):view==='week'?calendarWeekHTML(date,appointments):calendarDayHTML(date,appointments);
  return{
    title:'Calendar',
    subtitle:'Month, week and day appointment views',
    html:`${backBar('booking','Booking')}
      ${hero('Booking Calendar','Switch between month, week and day. Tap a date, time slot or appointment to continue.','<button class="button primary" data-route="booking-new">New Booking</button>')}
      <div class="panel calendar-panel">${calendarControls(view,date,title)}${content}</div>`,
    mount(){
      document.querySelectorAll('[data-calendar-view]').forEach(b=>b.onclick=()=>router.go(calendarRoute(b.dataset.calendarView,date)));
      document.querySelector('[data-calendar-today]').onclick=()=>router.go(calendarRoute(view,calendarTodayISO()));
      document.querySelectorAll('[data-calendar-move]').forEach(b=>b.onclick=()=>{
        const direction=Number(b.dataset.calendarMove);
        const next=view==='month'?calendarAddMonths(date,direction):view==='week'?calendarAddDays(date,direction*7):calendarAddDays(date,direction);
        router.go(calendarRoute(view,next));
      });
      document.querySelectorAll('[data-calendar-date]').forEach(b=>b.onclick=e=>{
        if(e.target.closest('[data-calendar-appointment]'))return;
        router.go(calendarRoute('day',b.dataset.calendarDate));
      });
      document.querySelectorAll('[data-calendar-new]').forEach(b=>b.onclick=e=>{
        if(e.target.closest('[data-calendar-appointment]'))return;
        const [newDate,newTime]=b.dataset.calendarNew.split('|');
        router.go(`booking-new?date=${encodeURIComponent(newDate)}&time=${encodeURIComponent(newTime)}`);
      });
      document.querySelectorAll('[data-calendar-appointment]').forEach(b=>b.onclick=e=>{
        e.stopPropagation();calendarOpenAppointment(b.dataset.calendarAppointment);
      });
    }
  };
}

async function bookingPage(){
  const d=readStore();
  return {title:'Booking',subtitle:'Applications and appointments',html:`
    ${backBar('today','Dashboard')}
    ${hero('Booking Centre','Applications are reviewed first. Approved applications become calendar appointments.')}
    <div class="booking-engine-grid">
      <section class="booking-engine-card application-engine"><span>ENGINE 1</span><h3>Applications</h3><p>Request → AI pre-assessment → Professional review</p><strong>${d.applications.filter(a=>a.status==='Waiting Review').length}</strong><small>waiting review</small><button class="button primary" data-route="applications">Open Applications</button></section>
      <section class="booking-engine-card appointment-engine"><span>ENGINE 2</span><h3>Appointments</h3><p>Approved visits → Month / Week / Day calendar</p><strong>${d.appointments.length}</strong><small>appointment records</small><button class="button primary" data-route="booking-calendar">Open Appointments</button></section>
    </div>
    <div class="panel"><div class="menu-list">
      ${menuCard('🗓️','Appointment Calendar','Month, week and day views','booking-calendar')}
      ${menuCard('➕','New Direct Booking','Create without application','booking-new')}
      ${menuCard('⏳','Pending Appointment Records',`${d.appointments.filter(x=>x.status==='Pending').length} pending`,'booking-pending')}
      ${menuCard('✅','Confirmed Appointments',`${d.appointments.filter(x=>x.status==='Confirmed').length} confirmed`,'booking-confirmed')}
      ${menuCard('🕘','Appointment History','All appointments','booking-history')}
    </div></div>`};
}
async function bookingFilteredPage(status,title){
  const d=readStore();const rows=status?d.appointments.filter(x=>x.status===status):d.appointments;
  return {title,subtitle:'Appointment list',html:`${backBar('booking','Booking')}${hero(title,'Select an appointment action.')}<div class="panel">${rows.length?`<table><thead><tr><th>Patient</th><th>Date</th><th>Service</th><th>Status</th><th></th></tr></thead><tbody>${rows.map(x=>`<tr><td>${escapeHtml(x.patientName)}</td><td>${formatDate(x.date)} ${escapeHtml(x.time)}</td><td>${escapeHtml(x.service)}</td><td>${badge(x.status,x.status==='Pending'?'warning':'default')}</td><td><button class="button mini secondary" data-toggle-appointment="${x.id}">Toggle</button><button class="button mini danger" data-delete-appointment="${x.id}">Delete</button></td></tr>`).join('')}</tbody></table>`:empty('No appointments in this category.')}</div>`,mount(){document.querySelectorAll('[data-toggle-appointment]').forEach(b=>b.onclick=()=>{updateStore(d=>{const x=d.appointments.find(x=>x.id===b.dataset.toggleAppointment);x.status=x.status==='Pending'?'Confirmed':'Pending';});render();});document.querySelectorAll('[data-delete-appointment]').forEach(b=>b.onclick=()=>{updateStore(d=>d.appointments=d.appointments.filter(x=>x.id!==b.dataset.deleteAppointment));render();});}};
}
const bookingPendingPage=()=>bookingFilteredPage('Pending','Pending Requests');
const bookingConfirmedPage=()=>bookingFilteredPage('Confirmed','Confirmed Appointments');
const bookingHistoryPage=()=>bookingFilteredPage(null,'Appointment History');

async function clinicalPage(){
  const d=readStore();
  return {title:'Clinical',subtitle:'Clinical hub',html:`
    ${backBar('today','Dashboard')}
    ${hero('Clinical','Choose a clinical work area.')}
    <div class="panel"><div class="menu-list">
      ${menuCard('➕','New Clinical Note','Create a practitioner-approved note','clinical-new')}
      ${menuCard('📋','Clinical Notes',`${d.clinicalNotes.length} saved note(s)`,'clinical-notes')}
      ${menuCard('🗓️','Today’s Visits','Open today’s appointments','clinical-today')}
      ${menuCard('💉','Treatment Records','Review saved treatment fields','clinical-notes')}
    </div></div>`};
}
async function clinicalNotesPage(){
  const d=readStore();
  return {title:'Clinical Notes',subtitle:'Saved practitioner notes',html:`${backBar('clinical','Clinical')}${hero('Clinical Notes','Select a saved record.')}<div class="panel">${d.clinicalNotes.length?d.clinicalNotes.slice().reverse().map(n=>{const p=d.patients.find(p=>p.id===n.patientId);return `<div class="record-row"><div><strong>${escapeHtml(p?.name||'Unknown patient')}</strong><small>${new Date(n.createdAt).toLocaleDateString()} · ${escapeHtml(n.chiefConcern||'Clinical note')}</small></div><button class="button secondary" data-open-clinical="${n.id}">Open ›</button></div>`}).join(''):empty('No clinical notes yet.')}</div>`,mount(){document.querySelectorAll('[data-open-clinical]').forEach(b=>b.onclick=()=>{const n=d.clinicalNotes.find(x=>x.id===b.dataset.openClinical);openModal(`<div class="panel-head"><h3>Clinical Note</h3><button class="button secondary" onclick="closeModal()">Close</button></div><p><b>Chief concern:</b> ${escapeHtml(n.chiefConcern||'—')}</p><p><b>Assessment:</b> ${escapeHtml(n.assessment||'—')}</p><p><b>Treatment:</b> ${escapeHtml(n.treatment||'—')}</p><p><b>Plan:</b> ${escapeHtml(n.plan||'—')}</p>`);});}};
}
async function clinicalTodayPage(){
  const d=readStore(),today=new Date().toISOString().slice(0,10),rows=d.appointments.filter(x=>x.date===today);
  return {title:"Today's Visits",subtitle:'Appointments scheduled today',html:`${backBar('clinical','Clinical')}${hero("Today's Visits",'Select a patient to continue.')}<div class="panel">${rows.length?rows.map(x=>menuCard('🩺',x.patientName,`${x.time} · ${x.service}`,'patient-list')).join(''):empty('No appointments scheduled for today.')}</div>`};
}

async function aiIntakeHubPage(){
  const hasDraft=Object.keys(readDraft()).length>0;
  return {title:'AI Intake',subtitle:'Choose an intake method',html:`
    ${backBar('ai-care','AI Care')}
    ${hero('AI Intake','Choose one entry method. Both methods lead to structured clinical data.')}
    <div class="panel"><div class="menu-list">
      ${menuCard('📝','Classic Health Form','Structured five-step health assessment','intake')}
      ${menuCard('🤖','AI Conversation','Guided conversation-style assessment','ai-conversation')}
      ${menuCard('🕓','Continue Draft',hasDraft?'A saved draft is available':'No saved draft currently','intake')}
      ${menuCard('📚','Intake History','View completed assessment summaries','clinical-summary')}
    </div></div>`};
}
async function aiConversationPage(){
  const aiState=window.LINGGUANG_LOCAL_AI?.getState?.()||{status:'idle',supported:!!navigator.gpu};
  return {title:'AI Conversation',subtitle:'Conversation intake',html:`
    ${backBar('ai-intake','AI Intake')}
    ${hero('AI Conversation','LINGGUANG first tries the on-device language model. If it is not ready, the local rule engine creates the draft instead.')}
    <div class="panel">
      <div class="local-ai-inline-status">
        <span class="status-dot ${aiState.status==='ready'?'ready':''}"></span>
        <div><strong>${aiState.status==='ready'?'Local model ready':'Rule fallback active'}</strong><small>${escapeHtml(aiState.message||'Open Settings → Local AI to download the model.')}</small></div>
        <button type="button" class="button secondary" data-route="settings-local-ai">Local AI Settings</button>
      </div>
      <form id="ai-conversation-form">
        <label>Patient Name *<input name="patientName" required placeholder="Full name"></label>
        <label>Tell LINGGUANG what is happening<textarea name="message" required placeholder="For example: My right shoulder has hurt for two months..."></textarea></label>
        <div class="button-row"><button class="button primary" id="conversation-submit">Create Structured Draft</button></div>
      </form>
      <div id="conversation-working" class="notice" hidden>LINGGUANG is processing the description locally…</div>
    </div>`,mount(){
      document.querySelector('#ai-conversation-form').onsubmit=async e=>{
        e.preventDefault();
        const submit=document.querySelector('#conversation-submit');
        const working=document.querySelector('#conversation-working');
        const v=Object.fromEntries(new FormData(e.currentTarget));
        submit.disabled=true;working.hidden=false;
        try{
          const analysis=await window.LINGGUANG_LOCAL_AI.analyze(v.message);
          const parts=v.patientName.trim().split(/\s+/);
          const painMatch=String(v.message).match(/\b(10|[0-9])\s*(?:\/\s*10|out of 10)?\b/i);
          writeDraft({
            firstName:parts.shift()||'',
            lastName:parts.join(' '),
            phone:'To be completed',
            concerns:[analysis.category||'Other'],
            notes:v.message,
            location:analysis.location||'',
            duration:analysis.duration||'Select',
            painScore:painMatch?Number(painMatch[1]):0,
            sleepScore:7,
            energyScore:6,
            stressScore:4,
            localAISummary:analysis.summary||'',
            localAIMode:analysis.mode||'rule'
          });
          setStep(0);
          toast(`Draft created with ${analysis.mode==='model'?'Local AI model':'local rule engine'}`);
          router.go('intake');
        }catch(error){
          toast(error?.message||'Could not create a draft');
        }finally{
          submit.disabled=false;working.hidden=true;
        }
      };
    }};
}

async function settingsPage(){
  return {title:'Settings',subtitle:'System preferences',html:`
    ${backBar('today','Dashboard')}
    ${hero('Settings','Mobile Navigation Edition preferences and information.')}
    <div class="panel"><div class="menu-list">
      ${menuCard('🌐','Language','English / 中文 workflow preparation','settings-language')}
      ${menuCard('🧠','Local AI','Download, test and manage the on-device model','settings-local-ai')}
      ${menuCard('🔒','Privacy & Security','Local build privacy information','settings-privacy')}
      ${menuCard('ℹ️','About','Version and build information','settings-about')}
    </div></div>`};
}
async function settingsInfoPage(){
 const kind=currentRouteInfo().route;
 const copy=kind==='settings-language'?'Language switching will be connected after all clinical wording is finalized.':kind==='settings-privacy'?'This build stores records only in the current browser. It is not yet a production medical-record system.':'LINGGUANG Health OS · Voice AI Build 010 · Booking Calendar Build 002 · Local AI Beta 001.';
 return {title:'Settings',subtitle:'Information',html:`${backBar('settings','Settings')}${hero('System Information',copy)}`};
}



/* ===== Local AI Beta 001 ===== */
function localAIStatusLabel(status){
  const map={
    unavailable:'Not supported',
    idle:'Ready to download',
    loading:'Downloading / loading',
    ready:'Local model ready',
    error:'Model unavailable'
  };
  return map[status]||status;
}

async function localAIPage(){
  const ai=window.LINGGUANG_LOCAL_AI;
  const snapshot=ai?.getState?.()||{
    supported:!!navigator.gpu,
    status:'idle',
    progress:0,
    message:'Local AI module is preparing.',
    modelId:'SmolLM2-360M-Instruct-q4f32_1-MLC'
  };
  const supported=snapshot.supported;
  return {
    title:'Local AI',
    subtitle:'On-device language model',
    html:`
      ${backBar('settings','Settings')}
      ${hero('LINGGUANG Local AI','Download and run a small language model inside this browser. Patient text stays on the device during local inference.')}
      <div class="stats-grid local-ai-stats">
        <div class="stat-card"><span>WebGPU</span><strong>${supported?'Yes':'No'}</strong><small>${supported?'Hardware acceleration detected':'Rule mode will remain available'}</small></div>
        <div class="stat-card"><span>Model Status</span><strong id="local-ai-status">${escapeHtml(localAIStatusLabel(snapshot.status))}</strong><small id="local-ai-message">${escapeHtml(snapshot.message||'')}</small></div>
        <div class="stat-card"><span>Model</span><strong class="model-name">SmolLM2</strong><small>360M instruct · local browser model</small></div>
        <div class="stat-card"><span>Cloud API Cost</span><strong>$0</strong><small>For local model inference</small></div>
      </div>

      <div class="panel">
        <div class="panel-head"><h3>Local Model Control</h3><span>Beta</span></div>
        <p class="muted">The first installation downloads model files and stores them in browser cache. Loading time and storage depend on the device and connection.</p>
        <div class="progress-shell" aria-label="Model loading progress">
          <div class="progress-fill" id="local-ai-progress" style="width:${Math.round((snapshot.progress||0)*100)}%"></div>
        </div>
        <div class="progress-copy" id="local-ai-progress-copy">${Math.round((snapshot.progress||0)*100)}%</div>
        <div class="button-row">
          <button type="button" class="button primary" id="local-ai-load" ${!supported||snapshot.status==='loading'?'disabled':''}>
            ${snapshot.status==='ready'?'Reload Local Model':'Download / Load Local Model'}
          </button>
          <button type="button" class="button secondary" id="local-ai-unload">Unload from Memory</button>
          <button type="button" class="button danger" id="local-ai-clear">Delete Local Model Cache</button>
        </div>
        <div class="notice">Local AI is an information-structuring assistant. It does not diagnose disease or replace practitioner review.</div>
      </div>

      <div class="panel">
        <div class="panel-head"><h3>Test Local Text Understanding</h3><span id="local-ai-mode">${snapshot.status==='ready'?'Local model':'Rule fallback'}</span></div>
        <label>Patient description
          <textarea id="local-ai-test-text" rows="5" placeholder="Example: My right shoulder has hurt for two months. It is worse at night and lifting my arm is difficult."></textarea>
        </label>
        <div class="button-row"><button type="button" class="button primary" id="local-ai-analyze">Analyze Locally</button></div>
        <div id="local-ai-result" class="summary-box" hidden></div>
      </div>`,
    mount(){
      const ai=window.LINGGUANG_LOCAL_AI;
      const statusEl=document.querySelector('#local-ai-status');
      const messageEl=document.querySelector('#local-ai-message');
      const bar=document.querySelector('#local-ai-progress');
      const percent=document.querySelector('#local-ai-progress-copy');
      const mode=document.querySelector('#local-ai-mode');
      const loadBtn=document.querySelector('#local-ai-load');

      const updateUI=state=>{
        if(!state)return;
        statusEl.textContent=localAIStatusLabel(state.status);
        messageEl.textContent=state.message||'';
        const value=Math.max(0,Math.min(100,Math.round((state.progress||0)*100)));
        bar.style.width=`${value}%`;
        percent.textContent=`${value}%`;
        mode.textContent=state.status==='ready'?'Local model':'Rule fallback';
        loadBtn.disabled=!state.supported||state.status==='loading';
        loadBtn.textContent=state.status==='ready'?'Reload Local Model':'Download / Load Local Model';
      };

      const unsubscribe=ai?.subscribe?.(updateUI);
      document.querySelector('#local-ai-load').onclick=async()=>{
        if(!ai)return toast('Local AI module is not available');
        try{
          await ai.load();
          toast('Local AI model is ready');
        }catch(error){
          toast(error?.message||'Local model could not be loaded');
        }
      };
      document.querySelector('#local-ai-unload').onclick=async()=>{
        await ai?.unload?.();
        toast('Local model unloaded from memory');
      };
      document.querySelector('#local-ai-clear').onclick=async()=>{
        if(!confirm('Delete the locally cached AI model from this browser?'))return;
        await ai?.clearCache?.();
        toast('Local AI cache cleared');
      };
      document.querySelector('#local-ai-analyze').onclick=async()=>{
        const text=document.querySelector('#local-ai-test-text').value.trim();
        const resultEl=document.querySelector('#local-ai-result');
        if(!text)return toast('Enter a patient description first');
        resultEl.hidden=false;
        resultEl.innerHTML='<p>Analyzing…</p>';
        try{
          const result=await ai.analyze(text);
          resultEl.innerHTML=`
            <h4>Structured Result</h4>
            <p><b>Mode:</b> ${escapeHtml(result.mode||'rule')}</p>
            <p><b>Category:</b> ${escapeHtml(result.category||'Other')}</p>
            <p><b>Location:</b> ${escapeHtml(result.location||'Not identified')}</p>
            <p><b>Duration:</b> ${escapeHtml(result.duration||'Not identified')}</p>
            <p><b>Pattern:</b> ${escapeHtml((result.patterns||[]).join(', ')||'Not identified')}</p>
            <p><b>Missing questions:</b> ${escapeHtml((result.missingQuestions||[]).join('; ')||'None identified')}</p>
            <p><b>Summary:</b> ${escapeHtml(result.summary||text)}</p>`;
        }catch(error){
          resultEl.innerHTML=`<p>Analysis failed: ${escapeHtml(error?.message||String(error))}</p>`;
        }
      };

      const cleanup=()=>{unsubscribe?.();window.removeEventListener('hashchange',cleanup)};
      window.addEventListener('hashchange',cleanup,{once:true});
    }
  };
}

async function localAIPrivacyPage(){
  return {
    title:'Local AI Privacy',
    subtitle:'How local inference works',
    html:`
      ${backBar('settings-local-ai','Local AI')}
      ${hero('Local Processing','When the local model is active, the entered text is processed by the model running in this browser.')}
      <div class="panel">
        <h3>What remains local</h3>
        <p>Text submitted to the Local AI test or Local AI conversation is processed by the downloaded browser model and is not sent to a GPT API by this feature.</p>
        <h3>What still uses the internet</h3>
        <p>The model and WebLLM software must be downloaded from their hosting services. GitHub Pages also serves the LINGGUANG application files.</p>
        <h3>Current limitation</h3>
        <p>This beta is not a production medical-record environment. Do not use identifiable patient information for real clinical care until authentication, secure cloud storage, consent, audit logging, and applicable compliance controls are implemented.</p>
      </div>`
  };
}


/* ===== src/shell.js ===== */
function shell(){
  document.body.innerHTML=`
    <div class="app-shell">
      <aside class="sidebar">
        <button type="button" class="brand brand-button" id="brand-home-button" aria-label="About LINGGUANG Health OS">
          <img class="brand-logo-image" src="lingguang-logo.png?v=2.5.0-icon008" alt="LINGGUANG official logo">
          <span><strong>LINGGUANG HEALTH</strong><small>Health OS</small></span>
        </button>
        <nav class="main-nav">
          <button data-route="today">🏠 Today</button>
          <button data-route="booking">📅 Booking</button>
          <button data-route="patients">👥 Patients</button>
          <button data-route="clinical">🩺 Clinical</button>
          <button data-route="ai-care">🤖 AI Care</button>
          <button data-route="voice-ai">🎙 Voice AI</button>
          <button data-route="health-journey">📈 Health Journey</button>
          <button data-route="clinic">🏥 Clinic</button>
          <button data-route="settings">⚙️ Settings</button>
        </nav>
        <div class="build-label">Voice AI Build 010</div>
      </aside>
      <main class="workspace">
        <header class="workspace-header">
          <div class="header-title-row">
            <button type="button" id="global-back-button" class="global-back-button" aria-label="Back">←</button>
            <div><h1 id="page-title"></h1><p id="page-subtitle"></p></div>
          </div>
          <div class="header-actions">
            <button type="button" class="header-icon" title="Notifications">🔔</button>
            <button type="button" class="header-icon" id="voice-header-button" title="Voice AI">🎙</button>
            <button type="button" class="portal-switch-button" id="portal-switch-button">Switch Portal</button>
            <div class="avatar" id="role-avatar">DL</div>
          </div>
        </header>
        <section id="page-root"></section>
      </main>
    </div>

    <div class="toast" id="toast"></div>
    <div class="modal" id="modal" aria-hidden="true"><div class="modal-card" id="modal-card"></div></div>

    <div class="brand-splash" id="brand-splash" aria-hidden="true">
      <div class="brand-splash-atmosphere"></div>
      <div class="brand-splash-card">
        <img src="lingguang-logo-full.png?v=2.5.0-icon008" alt="LINGGUANG HEALTH official logo" class="official-logo-full">
        <strong>LINGGUANG HEALTH</strong>
        <span>Health OS</span>
        <small>科技赋能 · 用心守护健康</small>
        <div class="splash-progress"><i></i></div>
      </div>
    </div>

    <div class="login-screen" id="login-screen" hidden>
      <div class="login-panel">
        <div class="login-brand">
          <img src="lingguang-logo-full.png?v=2.5.0-icon008" alt="LINGGUANG HEALTH official logo" class="official-logo-full">
          <strong>LINGGUANG</strong>
          <span>Health OS</span>
        </div>
        <h2>Welcome back</h2>
        <p>Sign in to continue to your clinic workspace.</p>
        <form id="login-form">
          <label>Email or username<input name="username" required autocomplete="username" value="Dr. Ling"></label>
          <label>Password<input name="password" type="password" required autocomplete="current-password" value="lingguang"></label>
          <div class="login-options">
            <label class="remember"><input type="checkbox" name="remember" checked> Remember me</label>
            <button type="button" class="text-button" id="forgot-password">Forgot password?</button>
          </div>
          <button class="button primary login-submit">Sign In</button>
        </form>
        <div class="login-note">Demo login for the local development build.</div>
      </div>
    </div>`;
}

function openModal(html){
  const modal=document.querySelector('#modal');
  document.querySelector('#modal-card').innerHTML=html;
  modal.classList.add('open');modal.setAttribute('aria-hidden','false');
}
window.closeModal=function(){
  const modal=document.querySelector('#modal');
  modal.classList.remove('open');modal.setAttribute('aria-hidden','true');
};
function toast(message){
  const el=document.querySelector('#toast');el.textContent=message;el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'),1800);
}


const routes={
  'platform-entry':platformEntryPage,'role-login':roleLoginPage,
  'patient-portal':patientPortalPage,'patient-application-new':patientApplicationNewPage,
  'patient-applications':patientApplicationsPage,'patient-appointments':patientAppointmentsPage,
  'patient-my-journey':patientMyJourneyPage,'patient-upload':patientUploadPage,
  'patient-messages':patientMessagesPage,'patient-my-profile':patientMyProfilePage,
  applications:applicationsHubPage,'applications-waiting':applicationsWaitingPage,
  'applications-more-info':applicationsMoreInfoPage,'applications-approved':applicationsApprovedPage,
  'applications-scheduled':applicationsScheduledPage,'applications-all':applicationsAllPage,
  'application-review':applicationReviewPage,'application-schedule':applicationSchedulePage,
  'admin-portal':adminPortalPage,'admin-staff':adminPlaceholderPage,'admin-rooms':adminPlaceholderPage,
  'admin-services':adminPlaceholderPage,'admin-hours':adminPlaceholderPage,'clinic-create':adminPlaceholderPage,
  'voice-ai':voiceAIPage,'voice-conversation':voiceConversationPage,'voice-consultation':voiceConsultationPage,'voice-session':voiceSessionPage,'voice-review-session':voiceReviewSessionPage,'voice-command':voiceCommandPage,'voice-review':voiceReviewPage,'voice-patient':voicePatientPage,
  today:todayPage,patients:patientsPage,'patient-new':patientNewPage,'patient-list':patientListPage,
  'patient-archived':patientArchivedPage,'patient-detail':patientDetailPage,'patient-basic':patientBasicPage,
  'patient-bookings':patientBookingsPage,'patient-clinical':patientClinicalPage,'patient-ai':patientAiPage,
  'patient-journey':patientJourneyPage,'patient-remote':patientRemotePage,'patient-documents':patientDocumentsPage,
  'document-placeholder':documentPlaceholderPage,booking:bookingPage,'booking-calendar':bookingCalendarPage,
  'booking-new':bookingFormPage,'booking-pending':bookingPendingPage,'booking-confirmed':bookingConfirmedPage,
  'booking-history':bookingHistoryPage,clinical:clinicalPage,'clinical-new':clinicalNewNotePage,
  'clinical-notes':clinicalNotesPage,'clinical-today':clinicalTodayPage,'ai-care':aiCarePage,
  'ai-intake':aiIntakeHubPage,intake:classicIntakePage,'ai-conversation':aiConversationPage,
  'clinical-summary':clinicalSummaryPage,'health-analysis':healthAnalysisPage,'remote-care':remoteCarePage,
  'follow-up':followUpPage,'risk-review':riskReviewPage,'health-journey':healthJourneyPage,clinic:clinicPage,
  settings:settingsPage,'settings-local-ai':localAIPage,'settings-local-ai-privacy':localAIPrivacyPage,
  'settings-language':settingsInfoPage,'settings-privacy':settingsInfoPage,'settings-about':settingsInfoPage
};

function currentRouteInfo(){
  const raw=location.hash.replace(/^#\/?/,'')||'platform-entry',parts=raw.split('?');
  return{route:parts[0]||'platform-entry',params:new URLSearchParams(parts[1]||'')};
}
function allowedForRole(route,role){
  if(!role)return['platform-entry','role-login','clinic-create'].includes(route);
  if(role==='patient')return['patient-portal','patient-application-new','patient-applications','patient-appointments','patient-my-journey','patient-upload','patient-messages','patient-my-profile','ai-conversation','intake','voice-patient','voice-conversation','platform-entry','role-login'].includes(route);
  if(role==='admin')return['admin-portal','admin-staff','admin-rooms','admin-services','admin-hours','clinic','settings','settings-local-ai','settings-language','settings-privacy','settings-about','platform-entry','role-login'].includes(route);
  return true;
}
function parentRoute(route,params){
  const patient=params.get('patient'),pd=patient?`patient-detail?patient=${patient}`:'patient-list';
  const map={'role-login':'platform-entry','patient-portal':'platform-entry','patient-application-new':'patient-portal','patient-applications':'patient-portal','patient-appointments':'patient-portal','patient-my-journey':'patient-portal','patient-upload':'patient-portal','patient-messages':'patient-portal','patient-my-profile':'patient-portal',applications:'booking','applications-waiting':'applications','applications-more-info':'applications','applications-approved':'applications','applications-scheduled':'applications','applications-all':'applications','application-review':'applications','application-schedule':'application-review','admin-portal':'platform-entry','admin-staff':'admin-portal','admin-rooms':'admin-portal','admin-services':'admin-portal','admin-hours':'admin-portal','clinic-create':'platform-entry','voice-ai':'today','voice-conversation':'voice-ai','voice-consultation':'voice-ai','voice-session':'voice-ai','voice-review-session':'voice-review','voice-command':'voice-ai','voice-review':'voice-ai','voice-patient':'patient-portal',today:null,patients:'today','patient-new':'patients','patient-list':'patients','patient-archived':'patients','patient-detail':'patient-list','patient-basic':pd,'patient-bookings':pd,'patient-clinical':pd,'patient-ai':pd,'patient-journey':pd,'patient-remote':pd,'patient-documents':pd,booking:'today','booking-calendar':'booking','booking-new':'booking-calendar','booking-pending':'booking','booking-confirmed':'booking','booking-history':'booking',clinical:'today','clinical-new':'clinical','clinical-notes':'clinical','clinical-today':'clinical','ai-care':'today','ai-intake':'ai-care',intake:'ai-intake','ai-conversation':'ai-intake','clinical-summary':'ai-care','health-analysis':'ai-care','remote-care':'ai-care','follow-up':'ai-care','risk-review':'ai-care','health-journey':'today',clinic:'today',settings:'today','settings-local-ai':'settings','settings-local-ai-privacy':'settings-local-ai','settings-language':'settings','settings-privacy':'settings','settings-about':'settings'};
  return map[route]??roleHome();
}
async function render(){
  let {route,params}=currentRouteInfo();routeParams=params;const role=platformRole();
  if(!allowedForRole(route,role)){route=roleHome(role);history.replaceState(null,'',`#/${route}`);routeParams=new URLSearchParams()}
  const page=routes[route]||routes[roleHome(role)]||routes['platform-entry'],result=await page();
  document.querySelector('#page-title').textContent=result.title||'';
  document.querySelector('#page-subtitle').textContent=result.subtitle||'';
  document.querySelector('#page-root').innerHTML=result.html||'';
  const sidebar=document.querySelector('.sidebar'),shellRoot=document.querySelector('.app-shell');
  const portalLayout=!role||role==='patient'||role==='admin';
  if(sidebar)sidebar.hidden=portalLayout;shellRoot?.classList.toggle('portal-layout',portalLayout);
  const sw=document.querySelector('#portal-switch-button');if(sw){sw.hidden=!role;sw.onclick=()=>{clearPlatformSession();router.go('platform-entry')}}
  const avatar=document.querySelector('#role-avatar');if(avatar){const n=platformUser().name||'LG';avatar.textContent=n.split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase()}
  const back=document.querySelector('#global-back-button'),parent=parentRoute(route,routeParams);
  if(back){back.hidden=!parent;back.onclick=()=>parent&&router.go(parent)}
  document.querySelectorAll('[data-route]').forEach(b=>b.classList.toggle('active',b.dataset.route.split('?')[0]===route));
  bindBrandHome();bindVoiceHeader();result.mount?.();window.scrollTo({top:0,behavior:'instant'});
}

function bindBrandHome(){
  const brand=document.querySelector('#brand-home-button');
  if(brand)brand.onclick=()=>router.go(roleHome(platformRole()));
}

const router={go(route){location.hash=`#/${route}`},start(){
  document.addEventListener('click',e=>{const b=e.target.closest('[data-route]');if(b){e.preventDefault();router.go(b.dataset.route)}});
  addEventListener('hashchange',render);render();
}};
window.LINGGUANG_NAV={go:r=>router.go(r),goBack:r=>router.go(r||roleHome())};


/* ===== src/main.js ===== */
seedIfEmpty();
shell();

const splash=document.querySelector('#brand-splash');
document.querySelector('#login-screen')?.remove();
if(splash){
  requestAnimationFrame(()=>splash.classList.add('show'));
  setTimeout(()=>{splash.classList.add('hide');setTimeout(()=>splash.remove(),420)},1050);
}
if(!location.hash)location.hash=platformRole()?`#/${roleHome()}`:'#/platform-entry';
router.start();
