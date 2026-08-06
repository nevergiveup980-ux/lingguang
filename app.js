/* LINGGUANG Health OS Mobile GitHub bundle 1.3.1 */
"use strict";

/* ===== src/services/store.js ===== */
const KEY = 'lingguang-health-os-v1.3';
const DRAFT_KEY = 'lingguang-intake-draft-v1.3';

const initial = {
  patients: [], appointments: [], intakes: [], clinicalNotes: [], checkins: [], followups: [], riskReviews: []
};

function readStore() {
  try { return JSON.parse(localStorage.getItem(KEY)) || structuredClone(initial); }
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
  return {title:'Dashboard',subtitle:'Choose a work area',html:`
    ${hero('Good day, Dr. Ling.','Select a button to enter the next level. Numbers below are information only.')}
    <div class="stats-grid">
      <div class="stat-card"><span>Patients</span><strong>${d.patients.length}</strong><small>Active local records</small></div>
      <div class="stat-card"><span>Pending Requests</span><strong>${d.appointments.filter(x=>x.status==='Pending').length}</strong><small>Awaiting review</small></div>
      <div class="stat-card"><span>AI Summaries</span><strong>${d.intakes.length}</strong><small>Available for review</small></div>
      <div class="stat-card"><span>Follow-up Tasks</span><strong>${open}</strong><small>Open tasks</small></div>
    </div>
    <div class="panel">
      <div class="panel-head"><h3>Main Menu</h3><span>Choose one</span></div>
      <div class="menu-list">
        ${menuCard('👥','Patients','Patient list, profiles, records and documents','patients')}
        ${menuCard('📅','Booking','New bookings, pending requests and appointment history','booking')}
        ${menuCard('🩺','Clinical','Today’s visits, notes and treatment records','clinical')}
        ${menuCard('🤖','AI Care','Intake, summaries, analysis and follow-up','ai-care')}
        ${menuCard('📈','Health Journey','Recovery timeline and long-term trends','health-journey')}
        ${menuCard('🏥','Clinic','Clinic activity and local data controls','clinic')}
        ${menuCard('⚙️','Settings','Preferences and system information','settings')}
      </div>
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
  return {title:'Booking',subtitle:'Booking hub',html:`
    ${backBar('today','Dashboard')}
    ${hero('Booking','Choose one booking function.')}
    <div class="panel"><div class="menu-list">
      ${menuCard('🗓️','Calendar','Month, week and day appointment views','booking-calendar')}
      ${menuCard('➕','New Booking','Create and save a new appointment','booking-new')}
      ${menuCard('⏳','Pending Requests',`${d.appointments.filter(x=>x.status==='Pending').length} pending request(s)`,'booking-pending')}
      ${menuCard('✅','Confirmed Appointments',`${d.appointments.filter(x=>x.status==='Confirmed').length} confirmed appointment(s)`,'booking-confirmed')}
      ${menuCard('🕘','Appointment History','View all locally stored appointments','booking-history')}
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
 const copy=kind==='settings-language'?'Language switching will be connected after all clinical wording is finalized.':kind==='settings-privacy'?'This build stores records only in the current browser. It is not yet a production medical-record system.':'LINGGUANG Health OS · Booking Calendar Build 002 · Local AI Beta 001.';
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
function createAppShell() {
  return `
    <div class="app-shell">
      <aside class="sidebar">
        <button type="button" class="brand brand-button" data-route="settings-about" aria-label="About LINGGUANG Health OS">
          <img class="brand-logo-image" src="lingguang-logo.png?v=1.4.2-brand" alt="LINGGUANG logo">
          <span><strong>LINGGUANG</strong><small>Health OS</small></span>
        </button>
        <nav class="main-nav" aria-label="Main navigation">
          <button data-route="today">🏠 Today</button>
          <button data-route="booking">📅 Booking</button>
          <button data-route="patients">👥 Patients</button>
          <button data-route="clinical">🩺 Clinical</button>
          <button data-route="ai-care">🤖 AI Care</button>
          <button data-route="health-journey">📈 Health Journey</button>
          <button data-route="clinic">🏥 Clinic</button>
          <button data-route="settings">⚙️ Settings</button>
        </nav>
        <div class="build-label">Booking Calendar Build 002</div>
      </aside>
      <main class="workspace">
        <header class="workspace-header">
          <div class="header-title-row">
            <button type="button" id="global-back-button" class="global-back-button" aria-label="Back">←</button>
            <div><h1 id="page-title"></h1><p id="page-subtitle"></p></div>
          </div>
          <div class="avatar">DL</div>
        </header>
        <section id="page-root" aria-live="polite"></section>
      </main>
    </div>
    <div class="toast" id="toast"></div>
    <div class="modal" id="modal" aria-hidden="true"><div class="modal-card" id="modal-card"></div></div>
    <div class="brand-splash" id="brand-splash" aria-hidden="true">
      <div class="brand-splash-card">
        <img src="lingguang-logo.png?v=1.4.2-brand" alt="">
        <strong>LINGGUANG</strong>
        <span>Health OS</span>
        <small>Insight · Balance · Health</small>
      </div>
    </div>
  `;
}


/* ===== src/router.js ===== */
const routes = {
  today: todayPage,
  patients: patientsPage,
  'patient-new': patientNewPage,
  'patient-list': patientListPage,
  'patient-archived': patientArchivedPage,
  'patient-detail': patientDetailPage,
  'patient-basic': patientBasicPage,
  'patient-bookings': patientBookingsPage,
  'patient-clinical': patientClinicalPage,
  'patient-ai': patientAiPage,
  'patient-journey': patientJourneyPage,
  'patient-remote': patientRemotePage,
  'patient-documents': patientDocumentsPage,
  'document-placeholder': documentPlaceholderPage,
  booking: bookingPage,
  'booking-calendar': bookingCalendarPage,
  'booking-new': bookingFormPage,
  'booking-pending': bookingPendingPage,
  'booking-confirmed': bookingConfirmedPage,
  'booking-history': bookingHistoryPage,
  clinical: clinicalPage,
  'clinical-new': clinicalNewNotePage,
  'clinical-notes': clinicalNotesPage,
  'clinical-today': clinicalTodayPage,
  'ai-care': aiCarePage,
  'ai-intake': aiIntakeHubPage,
  intake: classicIntakePage,
  'ai-conversation': aiConversationPage,
  'clinical-summary': clinicalSummaryPage,
  'health-analysis': healthAnalysisPage,
  'remote-care': remoteCarePage,
  'follow-up': followUpPage,
  'risk-review': riskReviewPage,
  'health-journey': healthJourneyPage,
  clinic: clinicPage,
  settings: settingsPage,
  'settings-local-ai': localAIPage,
  'settings-local-ai-privacy': localAIPrivacyPage,
  'settings-language': settingsInfoPage,
  'settings-privacy': settingsInfoPage,
  'settings-about': settingsInfoPage
};

function currentRouteInfo(){
  const raw=location.hash.replace('#/','')||'today';
  const [route,query='']=raw.split('?');
  return {route,params:new URLSearchParams(query)};
}
function currentRoute(){return currentRouteInfo().route;}


function fallbackParentRoute(route,params){
  const patient=params.get('patient');
  const patientDetail=patient?`patient-detail?patient=${encodeURIComponent(patient)}`:'patient-list';
  const map={
    today:null,
    patients:'today',
    'patient-new':'patients',
    'patient-list':'patients',
    'patient-archived':'patients',
    'patient-detail':'patient-list',
    'patient-basic':patientDetail,
    'patient-bookings':patientDetail,
    'patient-clinical':patientDetail,
    'patient-ai':patientDetail,
    'patient-journey':patientDetail,
    'patient-remote':patientDetail,
    'patient-documents':patientDetail,
    'document-placeholder':patientDetail,
    booking:'today',
    'booking-calendar':'booking',
    'booking-new':'booking-calendar',
    'booking-pending':'booking',
    'booking-confirmed':'booking',
    'booking-history':'booking',
    clinical:'today',
    'clinical-new':'clinical',
    'clinical-notes':'clinical',
    'clinical-today':'clinical',
    'ai-care':'today',
    'ai-intake':'ai-care',
    intake:'ai-intake',
    'ai-conversation':'ai-intake',
    'clinical-summary':'ai-care',
    'health-analysis':'ai-care',
    'remote-care':'ai-care',
    'follow-up':'ai-care',
    'risk-review':'ai-care',
    'health-journey':'today',
    clinic:'today',
    settings:'today',
    'settings-local-ai':'settings',
    'settings-local-ai-privacy':'settings-local-ai',
    'settings-language':'settings',
    'settings-privacy':'settings',
    'settings-about':'settings'
  };
  return map[route]??'today';
}

window.LINGGUANG_NAV={
  go(route){
    if(!route)return;
    location.hash=`#/${route}`;
  },
  goBack(fallback='today'){
    // Use the explicit parent route so mobile Safari and GitHub Pages behave consistently.
    location.hash=`#/${fallback||'today'}`;
  }
};

async function render(){
  const info=currentRouteInfo();
  routeParams=info.params;
  const route=info.route;
  const page=routes[route]||routes.today;
  const result=await page();
  document.querySelector('#page-title').textContent=result.title;
  document.querySelector('#page-subtitle').textContent=result.subtitle;
  document.querySelector('#page-root').innerHTML=result.html;
  document.querySelectorAll('[data-route]').forEach(btn=>btn.classList.toggle('active',btn.dataset.route.split('?')[0]===route));
  const globalBack=document.querySelector('#global-back-button');
  const parent=fallbackParentRoute(route,info.params);
  if(globalBack){
    globalBack.hidden=!parent;
    globalBack.onclick=()=>LINGGUANG_NAV.goBack(parent||'today');
  }
  result.mount?.();
  window.scrollTo({top:0,behavior:'instant'});
}

const router={
  start(){
    document.addEventListener('click',event=>{
      const trigger=event.target.closest('[data-route]');
      if(trigger){
        event.preventDefault();
        LINGGUANG_NAV.go(trigger.dataset.route);
      }
    });
    addEventListener('hashchange',render);
    render();
  },
  go(route){location.hash=`#/${route}`;}
};


/* ===== src/main.js ===== */
seedIfEmpty();
document.querySelector('#app').innerHTML = createAppShell();
const splash=document.querySelector('#brand-splash');
if(splash){
  const seen=sessionStorage.getItem('lingguangBrandSplashSeen');
  if(seen){splash.remove();}
  else{
    sessionStorage.setItem('lingguangBrandSplashSeen','1');
    requestAnimationFrame(()=>splash.classList.add('show'));
    setTimeout(()=>{splash.classList.add('hide');setTimeout(()=>splash.remove(),450)},1100);
  }
}
router.start();
