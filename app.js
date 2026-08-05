/* LINGGUANG Health OS Mobile GitHub bundle 1.3 */
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
async function bookingPage() {
  const d = readStore();
  return { title:'Booking', subtitle:'Smart booking and appointment requests', html:`
    ${hero('Smart Booking','Create, confirm, and manage appointment requests.')}
    <div class="panel"><form id="booking-form" class="form-grid">
      <label>Patient Name<input name="patientName" required></label><label>Date<input type="date" name="date" required></label>
      <label>Time<input type="time" name="time" required></label><label>Service<select name="service"><option>Follow-up Acupuncture</option><option>Initial Consultation</option><option>Pain Assessment</option><option>Wellness Consultation</option></select></label>
      <label>Status<select name="status"><option>Pending</option><option>Confirmed</option></select></label><div class="form-action"><button class="button primary">Save Appointment</button></div>
    </form></div>
    <div class="panel"><div class="panel-head"><h3>Appointments</h3><span>${d.appointments.length}</span></div><div id="appointment-list">
    ${d.appointments.length ? `<table><thead><tr><th>Patient</th><th>Date</th><th>Service</th><th>Status</th><th></th></tr></thead><tbody>${d.appointments.map(x=>`<tr><td>${escapeHtml(x.patientName)}</td><td>${formatDate(x.date)} ${escapeHtml(x.time)}</td><td>${escapeHtml(x.service)}</td><td>${badge(x.status,x.status==='Pending'?'warning':'default')}</td><td><button class="button mini secondary" data-toggle-appointment="${x.id}">Toggle</button><button class="button mini danger" data-delete-appointment="${x.id}">Delete</button></td></tr>`).join('')}</tbody></table>` : empty('No appointments saved.')}</div></div>`,
    mount(){
      document.querySelector('#booking-form').addEventListener('submit',e=>{e.preventDefault();const v=Object.fromEntries(new FormData(e.currentTarget));updateStore(d=>d.appointments.push({id:crypto.randomUUID(),...v}));toast('Appointment saved');bookingPage().then(p=>{document.querySelector('#page-root').innerHTML=p.html;p.mount();});});
      document.querySelectorAll('[data-toggle-appointment]').forEach(b=>b.onclick=()=>{updateStore(d=>{const x=d.appointments.find(x=>x.id===b.dataset.toggleAppointment);x.status=x.status==='Pending'?'Confirmed':'Pending';});location.reload();});
      document.querySelectorAll('[data-delete-appointment]').forEach(b=>b.onclick=()=>{updateStore(d=>d.appointments=d.appointments.filter(x=>x.id!==b.dataset.deleteAppointment));location.reload();});
    }
  };
}


/* ===== src/pages/patients.js ===== */
async function patientsPage(){const d=readStore();return{title:'Patients',subtitle:'Patient workspace and health snapshots',html:`${hero('Patients','Patient profiles created from completed intake assessments.','<button class="button primary" data-route="intake">New Intake</button>')}<div class="panel">${d.patients.length?`<div class="patient-grid">${d.patients.map(p=>`<article class="patient-card"><div class="patient-avatar">${escapeHtml(p.name.split(' ').map(x=>x[0]).join('').slice(0,2))}</div><div><h3>${escapeHtml(p.name)}</h3><p>${escapeHtml(p.phone||'No phone')}</p><small>${escapeHtml(p.primaryConcern||'No concern')}</small></div><button class="button secondary" data-route="clinical">Open Clinical</button></article>`).join('')}</div>`:empty('Complete an intake assessment to create the first patient.')}</div>`}};


/* ===== src/pages/clinical.js ===== */
async function clinicalPage(){const d=readStore();const opts=d.patients.map(p=>`<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');return{title:'Clinical',subtitle:'Visit documentation and treatment planning',html:`${hero('Clinical Workspace','Review intake summaries and save practitioner-approved notes.')}<div class="panel"><form id="clinical-form"><label>Patient<select name="patientId">${opts||'<option value="">No patients yet</option>'}</select></label><label>Chief Concern<textarea name="chiefConcern"></textarea></label><label>Assessment<textarea name="assessment"></textarea></label><label>Treatment<textarea name="treatment"></textarea></label><label>Response & Plan<textarea name="plan"></textarea></label><div class="button-row"><button type="button" class="button secondary" id="draft-note">Generate Draft from Intake</button><button class="button primary">Save Clinical Note</button></div></form></div>`,mount(){const form=document.querySelector('#clinical-form');document.querySelector('#draft-note').onclick=()=>{const pid=form.patientId.value;const i=d.intakes.slice().reverse().find(x=>x.patientId===pid);if(!i)return toast('No intake found for this patient');form.chiefConcern.value=i.concerns.join(', ');form.assessment.value=i.summary;form.plan.value='Review response, update care plan, and arrange follow-up as clinically appropriate.';toast('Draft prepared for practitioner review');};form.onsubmit=e=>{e.preventDefault();const v=Object.fromEntries(new FormData(form));if(!v.patientId)return toast('Select a patient');updateStore(d=>d.clinicalNotes.push({id:crypto.randomUUID(),createdAt:new Date().toISOString(),...v}));toast('Clinical note saved');};}}}


/* ===== src/pages/aiCare.js ===== */
async function aiCarePage(){const cards=[['💬','AI Intake','Guided pre-visit questions and structured summary.','intake'],['🧠','Clinical Summary','Condense patient history and recent changes.','clinical-summary'],['📈','Health Analysis','Review trends across pain, sleep, energy, and activity.','health-analysis'],['🏡','Remote Care','Collect daily check-ins and care-plan progress.','remote-care'],['🔄','Follow-up','Prepare reminders and follow-up questions.','follow-up'],['⚠️','Risk Review','Flag information that may need prompt human review.','risk-review']];return{title:'AI Care',subtitle:'Intake, analysis, summaries, and remote care',html:`${hero('AI Care Centre','AI supports intake, summaries, follow-up, and remote care. Practitioner review remains required.')}<div class="module-grid">${cards.map(c=>`<button class="module-card" data-route="${c[3]}"><span>${c[0]}</span><h3>${c[1]}</h3><p>${c[2]}</p></button>`).join('')}</div><div class="notice">AI Care does not provide an independent medical diagnosis. Clinical decisions remain with qualified healthcare professionals.</div>`}};


/* ===== src/pages/intake.js ===== */
function capture(){const value=id=>document.querySelector(`#${id}`)?.value;const maps=[['firstName','lastName','dob','gender','phone','email'],['notes'],['painLocation','painScore','duration','sleepImpact','redFlags'],['sleepScore','energyScore','coldHeat','digestion','stressScore']];if(step<4){const values={};maps[step].forEach(k=>values[k]=value(k));updateDraft(values);}}
function rerender(){document.querySelector('#intake-content').innerHTML=intakeView();mountControls();}
function mountControls(){document.querySelectorAll('[data-concern]').forEach(b=>b.onclick=()=>{toggleConcern(b.dataset.concern);rerender();});document.querySelector('[data-intake-back]')?.addEventListener('click',()=>{capture();setStep(step-1);rerender();});document.querySelector('[data-intake-next]')?.addEventListener('click',()=>{capture();if(step===0&&(!draft.firstName||!draft.lastName||!draft.phone))return toast('First name, last name and phone are required');if(step===1&&!(draft.concerns||[]).length)return toast('Select at least one concern');if(step<4){setStep(step+1);rerender();return;}submit();});}
function submit(){const d={...draft};const name=`${d.firstName} ${d.lastName}`.trim();updateStore(store=>{let patient=store.patients.find(p=>p.name.toLowerCase()===name.toLowerCase());if(!patient){patient={id:crypto.randomUUID(),name,phone:d.phone,email:d.email,primaryConcern:(d.concerns||[]).join(', ')};store.patients.push(patient);}store.intakes.push({id:crypto.randomUUID(),patientId:patient.id,patientName:name,concerns:d.concerns||[],summary:makeSummary(d),tcmSummary:makeTcmSummary(d),risks:detectRisks(d),raw:d,createdAt:new Date().toISOString()});});resetIntake();toast('Assessment submitted');router.go('clinical-summary');}
async function intakePage(){return{title:'AI Intake',subtitle:'Patient health assessment',html:`${hero('Patient Health Assessment','Classic structured intake inside the main LINGGUANG system.')}<div id="intake-content">${intakeView()}</div>`,mount:mountControls};}


/* ===== src/pages/clinicalSummary.js ===== */
import { hero,empty,badge } from './shared.js';import { escapeHtml } from '../services/ui.js';
async function clinicalSummaryPage(){const d=readStore();return{title:'Clinical Summary',subtitle:'Structured intake summaries',html:`${hero('Clinical Summary','Structured summaries generated from completed intake records.')}<div class="stack">${d.intakes.length?d.intakes.slice().reverse().map(i=>`<article class="panel"><div class="panel-head"><h3>${escapeHtml(i.patientName)}</h3>${badge('Ready')}</div><div class="summary-box"><p><b>Primary concerns:</b> ${escapeHtml(i.concerns.join(', '))}</p><p>${escapeHtml(i.summary)}</p><p><b>TCM observations:</b> ${escapeHtml(i.tcmSummary)}</p>${i.risks.length?`<p class="risk-text"><b>Review flags:</b> ${escapeHtml(i.risks.join('; '))}</p>`:''}</div><button class="button primary" data-route="clinical">Open Clinical Workspace</button></article>`).join(''):empty('No completed intake summaries.')}</div>`}};


/* ===== src/pages/healthAnalysis.js ===== */
import { hero } from './shared.js';
async function healthAnalysisPage(){const d=readStore(),v=d.checkins,avg=k=>v.length?(v.reduce((s,x)=>s+Number(x[k]||0),0)/v.length).toFixed(1):'—';const items=[['Pain burden',avg('pain')],['Sleep quality',avg('sleep')],['Energy',avg('energy')]];return{title:'Health Analysis',subtitle:'Pain, sleep, energy, and activity trends',html:`${hero('Health Analysis','Review trends from Remote Care check-ins.')}<div class="stats-grid"><div class="stat-card"><span>Average Pain</span><strong>${avg('pain')}</strong></div><div class="stat-card"><span>Average Sleep</span><strong>${avg('sleep')}</strong></div><div class="stat-card"><span>Average Energy</span><strong>${avg('energy')}</strong></div><div class="stat-card"><span>Check-ins</span><strong>${v.length}</strong></div></div><div class="panel">${items.map(([n,x])=>`<div class="progress-row"><div><b>${n}</b><span>${x==='—'?'No data':x+'/10'}</span></div><div class="progress"><i style="width:${x==='—'?0:Number(x)*10}%"></i></div></div>`).join('')}</div>`}};


/* ===== src/pages/remoteCare.js ===== */
import { hero,empty } from './shared.js';import { toast,escapeHtml } from '../services/ui.js';
async function remoteCarePage(){const d=readStore(),opts=d.patients.map(p=>`<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');return{title:'Remote Care',subtitle:'Daily check-ins and care-plan progress',html:`${hero('Remote Care','Record daily pain, sleep, energy, and notes.')}<div class="panel"><form id="checkin-form" class="form-grid"><label>Patient<select name="patientId">${opts||'<option value="">No patients yet</option>'}</select></label><label>Pain 0–10<input type="number" name="pain" min="0" max="10" value="3"></label><label>Sleep 0–10<input type="number" name="sleep" min="0" max="10" value="7"></label><label>Energy 0–10<input type="number" name="energy" min="0" max="10" value="6"></label><label class="wide">Daily Note<textarea name="note"></textarea></label><div class="form-action"><button class="button primary">Save Check-in</button></div></form></div><div class="panel">${d.checkins.length?`<table><thead><tr><th>Date</th><th>Patient</th><th>Pain</th><th>Sleep</th><th>Energy</th></tr></thead><tbody>${d.checkins.slice().reverse().map(c=>`<tr><td>${new Date(c.createdAt).toLocaleDateString()}</td><td>${escapeHtml(c.patientName)}</td><td>${c.pain}</td><td>${c.sleep}</td><td>${c.energy}</td></tr>`).join('')}</tbody></table>`:empty('No daily check-ins.')}</div>`,mount(){document.querySelector('#checkin-form').onsubmit=e=>{e.preventDefault();const v=Object.fromEntries(new FormData(e.currentTarget));const p=d.patients.find(p=>p.id===v.patientId);if(!p)return toast('Select a patient');updateStore(s=>s.checkins.push({id:crypto.randomUUID(),patientName:p.name,createdAt:new Date().toISOString(),...v}));toast('Daily check-in saved');location.reload();};}}}


/* ===== src/pages/followUp.js ===== */
import { hero,empty,badge } from './shared.js';import { toast,escapeHtml,formatDate } from '../services/ui.js';
async function followUpPage(){const d=readStore(),opts=d.patients.map(p=>`<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');return{title:'Follow-up',subtitle:'Reminders and follow-up questions',html:`${hero('Follow-up','Create and complete follow-up tasks.')}<div class="panel"><form id="follow-form" class="form-grid"><label>Patient<select name="patientId">${opts||'<option value="">No patients yet</option>'}</select></label><label>Due Date<input type="date" name="dueDate" required></label><label class="wide">Task<input name="task" required placeholder="Check pain response after treatment"></label><div class="form-action"><button class="button primary">Add Follow-up</button></div></form></div><div class="panel">${d.followups.length?`<table><thead><tr><th>Patient</th><th>Task</th><th>Due</th><th>Status</th><th></th></tr></thead><tbody>${d.followups.map(f=>`<tr><td>${escapeHtml(f.patientName)}</td><td>${escapeHtml(f.task)}</td><td>${formatDate(f.dueDate)}</td><td>${badge(f.done?'Completed':'Open',f.done?'default':'warning')}</td><td><button class="button mini secondary" data-toggle-follow="${f.id}">${f.done?'Reopen':'Complete'}</button></td></tr>`).join('')}</tbody></table>`:empty('No follow-up tasks.')}</div>`,mount(){document.querySelector('#follow-form').onsubmit=e=>{e.preventDefault();const v=Object.fromEntries(new FormData(e.currentTarget));const p=d.patients.find(p=>p.id===v.patientId);if(!p)return toast('Select a patient');updateStore(s=>s.followups.push({id:crypto.randomUUID(),patientName:p.name,done:false,...v}));toast('Follow-up added');location.reload();};document.querySelectorAll('[data-toggle-follow]').forEach(b=>b.onclick=()=>{updateStore(s=>{const f=s.followups.find(x=>x.id===b.dataset.toggleFollow);f.done=!f.done;});location.reload();});}}}


/* ===== src/pages/riskReview.js ===== */
import { hero,empty,badge } from './shared.js';import { escapeHtml } from '../services/ui.js';
async function riskReviewPage(){const d=readStore(),risks=d.intakes.flatMap(i=>i.risks.map(r=>({name:i.patientName,reason:r})));return{title:'Risk Review',subtitle:'Information needing human review',html:`${hero('Risk Review','Human review queue created from intake answers.')}<div class="stack">${risks.length?risks.map(r=>`<article class="panel"><div class="panel-head"><h3>${escapeHtml(r.name)}</h3>${badge('Review','danger')}</div><p>${escapeHtml(r.reason)}</p><button class="button secondary">Mark Reviewed</button></article>`).join(''):empty('No current risk flags.')}</div><div class="notice danger">These are screening prompts, not diagnoses. Urgent symptoms require appropriate emergency assessment.</div>`}};


/* ===== src/pages/healthJourney.js ===== */
import { hero,empty } from './shared.js';
async function healthJourneyPage(){const d=readStore(),last=d.checkins.at(-1);return{title:'Health Journey',subtitle:'Long-term health and recovery progress',html:`${hero('Health Journey','Long-term change, presented clearly for the patient and practitioner.')}<div class="panel">${last?[['Pain improvement',10-Number(last.pain)],['Sleep quality',Number(last.sleep)],['Energy',Number(last.energy)]].map(([n,v])=>`<div class="progress-row"><div><b>${n}</b><span>${v}/10</span></div><div class="progress"><i style="width:${v*10}%"></i></div></div>`).join(''):empty('Add a Remote Care check-in to begin the Health Journey.')}</div>`}};


/* ===== src/pages/clinic.js ===== */
import { hero } from './shared.js';import { toast } from '../services/ui.js';
async function clinicPage(){const d=readStore();return{title:'Clinic',subtitle:'Clinic operations and local data',html:`${hero('Clinic Intelligence','Operational information based on locally stored records.')}<div class="stats-grid"><div class="stat-card"><span>Patients</span><strong>${d.patients.length}</strong></div><div class="stat-card"><span>Appointments</span><strong>${d.appointments.length}</strong></div><div class="stat-card"><span>Clinical Notes</span><strong>${d.clinicalNotes.length}</strong></div><div class="stat-card"><span>Check-ins</span><strong>${d.checkins.length}</strong></div></div><div class="panel"><h3>Local Data Controls</h3><p>This development build stores data in the current browser.</p><button class="button danger" id="reset-data">Reset All Local Data</button></div>`,mount(){document.querySelector('#reset-data').onclick=()=>{if(confirm('Reset all local LINGGUANG data?')){resetStore();toast('Local data reset');location.reload();}};}}}


/* ===== src/shell.js ===== */
function createAppShell() {
  return `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand">
          <div class="brand-logo">LG</div>
          <div><strong>LINGGUANG</strong><small>Health OS</small></div>
        </div>
        <nav class="main-nav" aria-label="Main navigation">
          <button data-route="today">🏠 Today</button>
          <button data-route="booking">📅 Booking</button>
          <button data-route="patients">👥 Patients</button>
          <button data-route="clinical">🩺 Clinical</button>
          <button data-route="ai-care">🤖 AI Care</button>
          <button data-route="health-journey">📈 Health Journey</button>
          <button data-route="clinic">🏥 Clinic</button>
        </nav>
        <div class="build-label">Full Project 1.3</div>
      </aside>
      <main class="workspace">
        <header class="workspace-header">
          <div><h1 id="page-title"></h1><p id="page-subtitle"></p></div>
          <div class="avatar">DL</div>
        </header>
        <section id="page-root" aria-live="polite"></section>
      </main>
    </div>
    <div class="toast" id="toast"></div>
    <div class="modal" id="modal" aria-hidden="true"><div class="modal-card" id="modal-card"></div></div>
  `;
}


/* ===== src/router.js ===== */
const routes = {
  today: todayPage,
  booking: bookingPage,
  patients: patientsPage,
  clinical: clinicalPage,
  'ai-care': aiCarePage,
  intake: intakePage,
  'clinical-summary': clinicalSummaryPage,
  'health-analysis': healthAnalysisPage,
  'remote-care': remoteCarePage,
  'follow-up': followUpPage,
  'risk-review': riskReviewPage,
  'health-journey': healthJourneyPage,
  clinic: clinicPage
};

function currentRoute() {
  return location.hash.replace('#/', '') || 'today';
}

async function render() {
  const route = currentRoute();
  const page = routes[route] || routes.today;
  const result = await page();
  document.querySelector('#page-title').textContent = result.title;
  document.querySelector('#page-subtitle').textContent = result.subtitle;
  document.querySelector('#page-root').innerHTML = result.html;
  document.querySelectorAll('[data-route]').forEach(btn => btn.classList.toggle('active', btn.dataset.route === route));
  result.mount?.();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

const router = {
  start() {
    document.addEventListener('click', event => {
      const trigger = event.target.closest('[data-route]');
      if (trigger) location.hash = `#/${trigger.dataset.route}`;
    });
    addEventListener('hashchange', render);
    render();
  },
  go(route) { location.hash = `#/${route}`; }
};


/* ===== src/main.js ===== */
seedIfEmpty();
document.querySelector('#app').innerHTML = createAppShell();
router.start();
