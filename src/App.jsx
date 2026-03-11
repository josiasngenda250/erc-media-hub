//  ERC MEDIA HUB v4 — Firebase Auth + Ready to Post page
//  Requires: npm install firebase xlsx-js-style
//  Deploy to Vercel as a Vite/React project

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import * as XLSX from "xlsx-js-style";

// 🔥 PASTE YOUR FIREBASE CONFIG HERE
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAUE2ohr2O7tegziJsDx0LA6JRRriPXILM",
  authDomain: "erc-media-hub.firebaseapp.com",
  projectId: "erc-media-hub",
  storageBucket: "erc-media-hub.firebasestorage.app",
  messagingSenderId: "550924583691",
  appId: "1:550924583691:web:5fe9b4f003bdecb401d80e",
  measurementId: "G-DN3XTSEHPR",
};

const CACHE_KEY = "erc_hub_v4_cache";

const sanitize = (val) => {
  if (val === undefined || val === null) return "";
  if (Array.isArray(val)) return val.map(sanitize);
  if (typeof val === "object") {
    const out = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) out[k] = sanitize(v);
    }
    return out;
  }
  return val;
};

const fbApp = !getApps().length ? initializeApp(FIREBASE_CONFIG) : getApps()[0];
const fsDb = getFirestore(fbApp);
const fbAuth = getAuth(fbApp);
const DB_DOC = doc(fsDb, "erc-hub", "data");

const loadFromFirebase = async () => {
  const snap = await getDoc(DB_DOC);
  if (snap.exists()) return { ...EMPTY_DB, ...snap.data() };
  return { ...EMPTY_DB };
};

const saveDB = async (d) => {
  await setDoc(DB_DOC, sanitize(d));
};

// CONSTANTS
const PLATFORMS = ["Instagram","Facebook","YouTube","TikTok","WhatsApp","Church Website"];
const CONTENT_TYPES = ["Image/Graphic","Video/Reel","Story","Carousel","Flyer","Livestream","Photo Album","Announcement"];
const STATUSES = ["Draft","Ready for Review","Approved","Needs Changes","Posted","Rejected"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const PLATFORM_COLORS = {
  Instagram:"#E1306C", Facebook:"#1877F2", YouTube:"#FF0000",
  TikTok:"#111111", WhatsApp:"#25D366", "Church Website":"#6366F1"
};
const PLATFORM_ICONS = {
  Instagram:"📸", Facebook:"👍", YouTube:"▶️",
  TikTok:"🎵", WhatsApp:"💬", "Church Website":"🌐"
};
const STATUS_CONFIG = {
  Draft:{ bg:"#EEF2FF", fg:"#4338CA", icon:"✏️" },
  "Ready for Review":{ bg:"#FEF9C3", fg:"#92400E", icon:"👁" },
  Approved:{ bg:"#DCFCE7", fg:"#166534", icon:"✅" },
  "Needs Changes":{ bg:"#FED7AA", fg:"#9A3412", icon:"🔄" },
  Posted:{ bg:"#D1FAE5", fg:"#065F46", icon:"🚀" },
  Rejected:{ bg:"#FEE2E2", fg:"#991B1B", icon:"✕" },
};
const CAT_COLORS = {
  Prayer:"#7C3AED", Youth:"#2563EB", Leadership:"#1E3A5F",
  Ministry:"#059669", "Home Cells":"#D97706", Men:"#4F46E5",
  Women:"#DB2777", Couples:"#EA580C", "Sunday School":"#0D9488", Other:"#6B7280",
};
const TYPE_CONFIG = {
  lead:{ label:"Team Lead", color:"#1a2e44" },
  creator:{ label:"Creator", color:"#059669" },
  approver:{ label:"Approver", color:"#7C3AED" },
};
const MEMBER_TYPES = ["lead","creator","approver"];

const DEFAULT_MEMBERS = [
  {id:1,name:"Serena",fullName:"Serena Munezero",role:"Co-Lead / Design",type:"lead",tasks:"Oversees all content, final design reviews, keeps everything on-brand",active:true},
  {id:2,name:"Elisha",fullName:"Elisha",role:"Co-Lead / Technical",type:"lead",tasks:"Manages database, sound, livestreaming, and the technical side",active:true},
  {id:3,name:"Vanessa",fullName:"Vanessa",role:"Designer / Photographer",type:"creator",tasks:"Creates graphics, shoots event photos, handles image editing",active:true},
  {id:4,name:"Josias",fullName:"Josias",role:"Designer / Videographer",type:"creator",tasks:"Video editing, motion graphics, films church events",active:true},
  {id:5,name:"Moses",fullName:"Moses",role:"Designer / Content Creator",type:"creator",tasks:"Designs posts, stories, and promotional material",active:true},
  {id:6,name:"Doriane",fullName:"Doriane",role:"Designer / Photographer",type:"creator",tasks:"Event photography, post design, and stories",active:true},
  {id:7,name:"Papa Elijah",fullName:"Papa Elijah",role:"Advisor",type:"approver",tasks:"Reviews and approves content before it goes live",active:true},
  {id:8,name:"Pastor Timothy",fullName:"Pastor Timothy",role:"Supervising Pastor",type:"approver",tasks:"Oversees the media ministry and sets the direction",active:true},
  {id:9,name:"Sammy",fullName:"Sammy",role:"Reviewer",type:"approver",tasks:"Reviews content and gives feedback",active:true},
  {id:10,name:"Lydia",fullName:"Lydia",role:"Reviewer",type:"approver",tasks:"Reviews content and gives feedback",active:true},
  {id:11,name:"Soleil",fullName:"Soleil",role:"Reviewer",type:"approver",tasks:"Reviews content and gives feedback",active:true},
  {id:12,name:"Faith",fullName:"Faith",role:"Reviewer",type:"approver",tasks:"Reviews content and gives feedback",active:true},
];

const DEFAULT_EVENTS = [
  {id:"e1",name:"40 Days Prayer & Fasting",cat:"Prayer",start:"2026-01-01",end:"2026-02-09",custom:false},
  {id:"e2",name:"Youth Overnight",cat:"Youth",start:"2026-01-16",end:"2026-01-16",custom:false},
  {id:"e3",name:"General Committee Meeting",cat:"Leadership",start:"2026-02-14",end:"2026-02-14",custom:false},
  {id:"e4",name:"Intercessors Agape",cat:"Ministry",start:"2026-02-15",end:"2026-02-15",custom:false},
  {id:"e5",name:"Youth Overnight",cat:"Youth",start:"2026-02-20",end:"2026-02-20",custom:false},
  {id:"e6",name:"21 Days Prayer & Fasting",cat:"Prayer",start:"2026-03-15",end:"2026-04-05",custom:false},
  {id:"e7",name:"Easter Celebration",cat:"Ministry",start:"2026-04-05",end:"2026-04-05",custom:false},
  {id:"e8",name:"Home Cell Sessions (A,B,C,D)",cat:"Home Cells",start:"2026-04-13",end:"2026-05-17",custom:false},
  {id:"e9",name:"7 Days Prayer (Pentecost)",cat:"Prayer",start:"2026-05-17",end:"2026-05-24",custom:false},
  {id:"e10",name:"Youth Overnight",cat:"Youth",start:"2026-06-05",end:"2026-06-05",custom:false},
  {id:"e11",name:"Men's Week",cat:"Men",start:"2026-07-01",end:"2026-07-05",custom:false},
  {id:"e12",name:"Youth Overnight",cat:"Youth",start:"2026-07-03",end:"2026-07-03",custom:false},
  {id:"e13",name:"Women's Week",cat:"Women",start:"2026-07-08",end:"2026-07-12",custom:false},
  {id:"e14",name:"Couples' Week",cat:"Couples",start:"2026-07-15",end:"2026-07-19",custom:false},
  {id:"e15",name:"Children's Week",cat:"Sunday School",start:"2026-07-22",end:"2026-07-26",custom:false},
  {id:"e16",name:"Youth Retreat & Picnic",cat:"Youth",start:"2026-08-07",end:"2026-08-09",custom:false},
  {id:"e17",name:"Couples' Retreat",cat:"Couples",start:"2026-09-04",end:"2026-09-06",custom:false},
  {id:"e18",name:"Annual Youth Conference",cat:"Youth",start:"2026-09-12",end:"2026-09-12",custom:false},
  {id:"e19",name:"14 Days Prayer & Fasting",cat:"Prayer",start:"2026-09-13",end:"2026-09-27",custom:false},
  {id:"e20",name:"Youth Overnight",cat:"Youth",start:"2026-10-03",end:"2026-10-03",custom:false},
  {id:"e21",name:"40 Days Prayer & Fasting",cat:"Prayer",start:"2026-10-25",end:"2026-12-06",custom:false},
  {id:"e22",name:"Youth Overnight",cat:"Youth",start:"2026-11-06",end:"2026-11-06",custom:false},
  {id:"e23",name:"Christmas Celebration",cat:"Ministry",start:"2026-12-25",end:"2026-12-25",custom:false},
  {id:"e24",name:"Cross-over & Thanksgiving",cat:"Ministry",start:"2026-12-31",end:"2027-01-01",custom:false},
];

const EMPTY_DB = {
  submissions:[], events:[...DEFAULT_EVENTS], reminders:[], members:[...DEFAULT_MEMBERS],
  announcements:[], nextId:1, nextEventId:100, nextReminderId:1, nextMemberId:20, nextAnnouncementId:1
};

// ── REVISION / DESIGN HELPERS ─────────────────────────────────────────────
const getRevisions = (s) => Array.isArray(s.revisions) ? s.revisions : [];
const getCurrentDesign = (s) => { const r = getRevisions(s); return r.length > 0 ? r[r.length-1] : null; };
const getPlatforms = (s) => Array.isArray(s.platforms) && s.platforms.length > 0 ? s.platforms : [s.platform||""].filter(Boolean);

const getStage = (s) => {
  const revs = getRevisions(s);
  if (s.status === "Posted")   return 5;
  if (s.status === "Rejected") return 0;
  if (s.status === "Approved" && revs.length > 0) return 4;
  if (s.status === "Approved" && revs.length === 0) return 2;
  if (s.status === "Needs Changes") return 2;
  if (s.status === "Ready for Review" && revs.length > 0) return 3;
  if (s.status === "Ready for Review" && revs.length === 0) return 1;
  return 1;
};
const STAGE_CONFIG = [
  null,
  {id:1, label:"💡 Concept Review",  short:"Concept",   bg:"#EEF2FF", border:"#6366F1", fg:"#4338CA", desc:"Waiting for concept & caption approval"},
  {id:2, label:"🎨 In Design",       short:"Designing",  bg:"#FFF7ED", border:"#F59E0B", fg:"#92400E", desc:"Design is being created or revised"},
  {id:3, label:"👁 Design Review",   short:"Review",     bg:"#F0FDF4", border:"#22C55E", fg:"#166534", desc:"Design submitted, awaiting review"},
  {id:4, label:"✅ Ready to Post",   short:"Ready",      bg:"#DCFCE7", border:"#059669", fg:"#065F46", desc:"Approved! Needs to be published"},
  {id:5, label:"🚀 Posted",          short:"Posted",     bg:"#D1FAE5", border:"#047857", fg:"#064E3B", desc:"Live on social media"},
];

// UTILS
const tod = () => new Date().toISOString().split("T")[0];
const fmtDate = (d) => {
  if (!d) return "";
  try { const [y,m,day] = d.split("-"); return `${MONTHS_SHORT[+m-1]} ${+day}, ${y}`; } catch { return d; }
};
const daysInMonth = (y,m) => new Date(y,m+1,0).getDate();
const firstDayOfMonth = (y,m) => new Date(y,m,1).getDay();
const padDate = (y,m,d) => `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
const getAllNames = (members) => members.filter(m=>m.active).map(m=>m.name);

// ── EXCEL EXPORT (unchanged from v3) ────────────────────────────────────────
const HEX = {
  navyBg:"1A2E44", navyFg:"FFFFFF", goldBg:"D4A259", goldFg:"FFFFFF",
  greenBg:"D1FAE5", greenFg:"065F46", yellowBg:"FEF9C3", yellowFg:"92400E",
  orangeBg:"FED7AA", orangeFg:"9A3412", redBg:"FEE2E2", redFg:"991B1B",
  blueBg:"EEF2FF", blueFg:"4338CA", tealBg:"D1FAE5", tealFg:"065F46",
  greyBg:"F3F4F6", greyFg:"374151", white:"FFFFFF", black:"111827", altRow:"F9FAFB",
};
const STATUS_HEX = {
  "Draft":{bg:HEX.blueBg,fg:HEX.blueFg}, "Ready for Review":{bg:HEX.yellowBg,fg:HEX.yellowFg},
  "Approved":{bg:HEX.greenBg,fg:HEX.greenFg}, "Needs Changes":{bg:HEX.orangeBg,fg:HEX.orangeFg},
  "Posted":{bg:HEX.tealBg,fg:HEX.tealFg}, "Rejected":{bg:HEX.redBg,fg:HEX.redFg},
};
const sc = (ws,r,c,v,s={}) => { const addr=XLSX.utils.encode_cell({r,c}); ws[addr]={v,t:typeof v==="number"?"n":"s",s:{font:{name:"Calibri",sz:10,...(s.font||{})},fill:{patternType:"solid",fgColor:{rgb:s.bg||HEX.white},...(!s.bg?{patternType:"none"}:{})},alignment:{wrapText:true,vertical:"center",...(s.align||{})},border:{top:{style:"thin",color:{rgb:"D1D5DB"}},bottom:{style:"thin",color:{rgb:"D1D5DB"}},left:{style:"thin",color:{rgb:"D1D5DB"}},right:{style:"thin",color:{rgb:"D1D5DB"}}},...s}}; };
const headerCell=(ws,r,c,v)=>sc(ws,r,c,v,{font:{bold:true,color:{rgb:HEX.navyFg},sz:10},bg:HEX.navyBg,align:{horizontal:"center"}});
const titleCell=(ws,r,c,v)=>sc(ws,r,c,v,{font:{bold:true,color:{rgb:HEX.navyFg},sz:14},bg:HEX.goldBg,align:{horizontal:"left"}});
const statusCell=(ws,r,c,status)=>{const cfg=STATUS_HEX[status]||{bg:HEX.greyBg,fg:HEX.greyFg};sc(ws,r,c,status,{font:{bold:true,color:{rgb:cfg.fg},sz:10},bg:cfg.bg,align:{horizontal:"center"}});};
const buildRange=(ws,rows,cols)=>{ws["!ref"]=XLSX.utils.encode_range({s:{r:0,c:0},e:{r:rows-1,c:cols-1}});};

const buildPastorSheet=(submissions)=>{const ws={};const headers=["#","Post Title","Platforms","Content Type","Suggested Caption","Current Design Link","Design Ver.","Creator","Church Event","Status","Submitted","Due Date","# Revisions","Latest Feedback","Post Link"];const colW=[5,36,22,16,58,40,9,13,26,16,12,12,9,40,35];titleCell(ws,0,0,"ERC Media Hub — Pastor's Content Report");ws["!merges"]=[{s:{r:0,c:0},e:{r:0,c:headers.length-1}}];sc(ws,1,0,`Generated: ${fmtDate(tod())} · Total posts: ${submissions.length}`,{font:{italic:true,color:{rgb:"6B7280"},sz:9},bg:HEX.greyBg});ws["!merges"].push({s:{r:1,c:0},e:{r:1,c:headers.length-1}});headers.forEach((h,c)=>headerCell(ws,2,c,h));submissions.forEach((s,i)=>{const r=i+3;const bg=i%2===0?HEX.white:HEX.altRow;const platforms=getPlatforms(s).join(", ");const revs=getRevisions(s);const cur=getCurrentDesign(s);const designUrl=cur?.url||s.imageLink||"";const ver=revs.length>0?`v${revs.length}`:"—";const revisionCount=revs.filter(rv=>rv.isRevision).length;[s.id,s.title,platforms,s.contentType||"",s.caption||"(no caption)",designUrl,ver,s.submittedBy||"",s.event||"",s.status,s.submittedDate||"",s.dueDate||"",revisionCount,s.feedback||"",s.postLink||""].forEach((v,c)=>{if(c===9){statusCell(ws,r,c,String(v));return;}sc(ws,r,c,typeof v==="number"?v:String(v),{bg});});if(designUrl){const addr=XLSX.utils.encode_cell({r,c:5});if(ws[addr])ws[addr].l={Target:designUrl,Tooltip:"Click to view design"};}});buildRange(ws,submissions.length+3,headers.length);ws["!cols"]=colW.map(w=>({wch:w}));ws["!rows"]=[{hpt:24},{hpt:16},{hpt:20},...submissions.map(()=>({hpt:52}))];return ws;};
const buildAllPostsSheet=(submissions)=>{const ws={};const headers=["#","Title","Platforms","Content Type","Caption","Current Design Link","Design Ver.","Status","Creator","Submitted","Due Date","Reviewed By","Review Date","Feedback","Post Link"];const colW=[5,34,22,15,50,36,9,16,13,12,12,14,12,38,35];titleCell(ws,0,0,"All Content Submissions");ws["!merges"]=[{s:{r:0,c:0},e:{r:0,c:headers.length-1}}];headers.forEach((h,c)=>headerCell(ws,1,c,h));submissions.forEach((s,i)=>{const r=i+2;const bg=i%2===0?HEX.white:HEX.altRow;const revs=getRevisions(s);const cur=getCurrentDesign(s);const designUrl=cur?.url||s.imageLink||"";const ver=revs.length>0?`v${revs.length}`:"—";[s.id,s.title,getPlatforms(s).join(", "),s.contentType||"",s.caption||"",designUrl,ver,s.status,s.submittedBy||"",s.submittedDate||"",s.dueDate||"",s.reviewedBy||"",s.reviewDate||"",s.feedback||"",s.postLink||""].forEach((v,c)=>{if(c===7){statusCell(ws,r,c,String(v));return;}sc(ws,r,c,typeof v==="number"?v:String(v),{bg});});if(designUrl){const addr=XLSX.utils.encode_cell({r,c:5});if(ws[addr])ws[addr].l={Target:designUrl};}});buildRange(ws,submissions.length+2,headers.length);ws["!cols"]=colW.map(w=>({wch:w}));ws["!rows"]=[{hpt:22},{hpt:20},...submissions.map(()=>({hpt:44}))];return ws;};
const buildRevisionSheet=(submissions)=>{const ws={};const headers=["Post #","Post Title","Version","Design Link","File Type","Uploaded By","Date","Is Revision?","Change Notes","Post Status"];const colW=[7,36,9,45,14,14,12,12,44,18];titleCell(ws,0,0,"Design Revision History — Full Audit Trail");ws["!merges"]=[{s:{r:0,c:0},e:{r:0,c:headers.length-1}}];sc(ws,1,0,"Every design version ever uploaded — who uploaded it, when, and what changed",{font:{italic:true,color:{rgb:"6B7280"},sz:9},bg:HEX.greyBg});ws["!merges"].push({s:{r:1,c:0},e:{r:1,c:headers.length-1}});sc(ws,2,0,"🟠 Orange rows = revisions (design was changed after feedback)",{font:{italic:true,color:{rgb:"92400E"},sz:9},bg:"FFF7ED"});ws["!merges"].push({s:{r:2,c:0},e:{r:2,c:headers.length-1}});headers.forEach((h,c)=>headerCell(ws,3,c,h));let row=4;const heights=[{hpt:24},{hpt:16},{hpt:16},{hpt:20}];let hasAny=false;submissions.forEach(s=>{const revs=getRevisions(s);if(!revs.length)return;hasAny=true;revs.forEach((rv,idx)=>{const isRev=rv.isRevision;const bg=isRev?"FFF7ED":HEX.white;[s.id,s.title,`v${idx+1}`,rv.url||"",rv.linkType||rv.type||"",rv.uploadedBy||"",rv.uploadedDate||"",isRev?"✅ YES — Revision":"— First upload",rv.note||"",s.status].forEach((v,c)=>{if(c===9){statusCell(ws,row,c,String(v));return;}sc(ws,row,c,String(v),{bg,font:{bold:isRev&&c<3,color:{rgb:isRev?"92400E":HEX.black},sz:10}});});if(rv.url){const addr=XLSX.utils.encode_cell({r:row,c:3});if(ws[addr])ws[addr].l={Target:rv.url,Tooltip:"Open design file"};}heights.push({hpt:isRev?44:32});row++;});});if(!hasAny){sc(ws,4,0,"No design files uploaded yet.",{font:{italic:true,color:{rgb:"9CA3AF"}}});row=5;heights.push({hpt:20});}buildRange(ws,row,headers.length);ws["!cols"]=colW.map(w=>({wch:w}));ws["!rows"]=heights;return ws;};
const buildPlatformSheet=(submissions,platform)=>{const posts=submissions.filter(s=>getPlatforms(s).includes(platform));const ws={};const headers=["#","Title","Content Type","Caption","Status","Creator","Due Date","Feedback"];const colW=[5,35,16,55,16,14,13,40];titleCell(ws,0,0,`${platform} — Content Posts`);ws["!merges"]=[{s:{r:0,c:0},e:{r:0,c:headers.length-1}}];sc(ws,1,0,`${posts.length} post${posts.length!==1?"s":""} for ${platform}`,{font:{italic:true,color:{rgb:"6B7280"},sz:9},bg:HEX.greyBg});ws["!merges"].push({s:{r:1,c:0},e:{r:1,c:headers.length-1}});headers.forEach((h,c)=>headerCell(ws,2,c,h));posts.forEach((s,i)=>{const r=i+3;const bg=i%2===0?HEX.white:HEX.altRow;[s.id,s.title,s.contentType||"",s.caption||"",s.status,s.submittedBy||"",s.dueDate||"",s.feedback||""].forEach((v,c)=>{if(c===4){statusCell(ws,r,c,v);return;}sc(ws,r,c,String(v),{bg});});});buildRange(ws,posts.length+3,headers.length);ws["!cols"]=colW.map(w=>({wch:w}));ws["!rows"]=[{hpt:22},{hpt:16},{hpt:20},...posts.map(()=>({hpt:40}))];return ws;};
const buildCalendarSheet=(submissions,year,month)=>{const ws={};const monthName=MONTHS[month];const totalDays=daysInMonth(year,month);const headers=["Date","Day","Platforms","Content Type","Post Title","Caption (preview)","Creator","Status","Due?"];const colW=[14,5,22,16,38,45,13,16,6];const DAYS=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];const WEEKEND=["Sun","Sat"];titleCell(ws,0,0,`ERC Media Hub — Content Calendar: ${monthName} ${year}`);ws["!merges"]=[{s:{r:0,c:0},e:{r:0,c:headers.length-1}}];sc(ws,1,0,`Exported ${fmtDate(tod())}`,{font:{italic:true,color:{rgb:"6B7280"},sz:9},bg:HEX.greyBg});ws["!merges"].push({s:{r:1,c:0},e:{r:1,c:headers.length-1}});headers.forEach((h,c)=>headerCell(ws,2,c,h));let row=3;const rowHeights=[{hpt:22},{hpt:16},{hpt:20}];for(let d=1;d<=totalDays;d++){const dateStr=padDate(year,month,d);const dt=new Date(dateStr+"T12:00:00");const dayName=DAYS[dt.getDay()];const isWeekend=WEEKEND.includes(dayName);const dayPosts=submissions.filter(s=>{const date=s.dueDate||s.postedDate||s.submittedDate;return date===dateStr;});if(dayPosts.length===0){const bg=isWeekend?HEX.greyBg:HEX.white;[fmtDate(dateStr),dayName,"","","— No content scheduled","","","",""].forEach((v,c)=>sc(ws,row,c,v,{bg,font:{color:{rgb:isWeekend?"9CA3AF":"D1D5DB"},sz:10}}));rowHeights.push({hpt:18});row++;}else{dayPosts.forEach((s,pi)=>{const platforms=getPlatforms(s).join(", ");const bg=isWeekend?HEX.greyBg:HEX.white;[pi===0?fmtDate(dateStr):"",pi===0?dayName:"",platforms,s.contentType||"",s.title,s.caption?(s.caption.substring(0,80)+(s.caption.length>80?"...":"")):"",s.submittedBy||"",s.status,s.dueDate?"Yes":"No"].forEach((v,c)=>{if(c===7){statusCell(ws,row,c,v);return;}sc(ws,row,c,v,{bg});});rowHeights.push({hpt:40});row++;});}}buildRange(ws,row,headers.length);ws["!cols"]=colW.map(w=>({wch:w}));ws["!rows"]=rowHeights;return ws;};
const buildStatsSheet=(submissions)=>{const ws={};const headers=["Platform","Total Posts","Draft","Ready for Review","Approved","Needs Changes","Posted","Rejected"];const colW=[18,12,10,18,12,16,10,12];titleCell(ws,0,0,"Platform Statistics");ws["!merges"]=[{s:{r:0,c:0},e:{r:0,c:headers.length-1}}];headers.forEach((h,c)=>headerCell(ws,1,c,h));PLATFORMS.forEach((p,i)=>{const r=i+2;const bg=i%2===0?HEX.white:HEX.altRow;const ps=submissions.filter(s=>getPlatforms(s).includes(p));[p,ps.length,...STATUSES.map(st=>ps.filter(s=>s.status===st).length)].forEach((v,c)=>sc(ws,r,c,typeof v==="number"?v:v,{bg,font:{bold:c<2},align:{horizontal:c>0?"center":"left"}}));});const totR=PLATFORMS.length+2;sc(ws,totR,0,"TOTAL",{bg:HEX.navyBg,font:{bold:true,color:{rgb:HEX.navyFg}},align:{horizontal:"right"}});[submissions.length,...STATUSES.map(st=>submissions.filter(s=>s.status===st).length)].forEach((v,c)=>sc(ws,totR,c+1,v,{bg:HEX.navyBg,font:{bold:true,color:{rgb:HEX.navyFg}},align:{horizontal:"center"}}));buildRange(ws,totR+1,headers.length);ws["!cols"]=colW.map(w=>({wch:w}));ws["!rows"]=[{hpt:22},{hpt:20},...PLATFORMS.map(()=>({hpt:20})),{hpt:20}];return ws;};
const buildRemindersSheet=(reminders)=>{const ws={};const headers=["#","Reminder","Due Date","Assigned To","Created By","Date Created","Done"];const colW=[5,50,13,18,15,13,8];titleCell(ws,0,0,"Reminders & Deadlines");ws["!merges"]=[{s:{r:0,c:0},e:{r:0,c:headers.length-1}}];headers.forEach((h,c)=>headerCell(ws,1,c,h));reminders.forEach((r,i)=>{const row=i+2;const overdue=!r.done&&r.date<tod();const bg=r.done?HEX.greyBg:overdue?"FEE2E2":HEX.white;[r.id,r.text,r.date,r.assignedTo||"Whole team",r.createdBy,r.createdDate,r.done?"Done":"Pending"].forEach((v,c)=>sc(ws,row,c,String(v),{bg,font:{color:{rgb:r.done?"9CA3AF":overdue&&c!==6?"DC2626":HEX.black}}}));});buildRange(ws,reminders.length+2,headers.length);ws["!cols"]=colW.map(w=>({wch:w}));return ws;};
const buildEventsSheet=(events)=>{const ws={};const headers=["Event Name","Category","Start Date","End Date","Duration","Custom Added"];const colW=[40,16,13,13,12,12];titleCell(ws,0,0,"Church Events Calendar 2026");ws["!merges"]=[{s:{r:0,c:0},e:{r:0,c:headers.length-1}}];headers.forEach((h,c)=>headerCell(ws,1,c,h));events.sort((a,b)=>a.start.localeCompare(b.start)).forEach((e,i)=>{const row=i+2;const start=new Date(e.start+"T12:00:00");const end=new Date(e.end+"T12:00:00");const days=Math.round((end-start)/(1000*60*60*24))+1;[e.name,e.cat,e.start,e.end,days===1?"1 day":`${days} days`,e.custom?"Yes":"No"].forEach((v,c)=>sc(ws,row,c,typeof v==="number"?v:String(v),{bg:i%2===0?HEX.white:HEX.altRow}));});buildRange(ws,events.length+2,headers.length);ws["!cols"]=colW.map(w=>({wch:w}));return ws;};

const exportAllExcel=(db)=>{const wb=XLSX.utils.book_new();wb.Props={Title:"ERC Media Hub Export",Author:"ERC Media Team",CreatedDate:new Date()};XLSX.utils.book_append_sheet(wb,buildPastorSheet(db.submissions),"Pastor Report");XLSX.utils.book_append_sheet(wb,buildAllPostsSheet(db.submissions),"All Posts");XLSX.utils.book_append_sheet(wb,buildRevisionSheet(db.submissions),"Design Revisions");PLATFORMS.forEach(p=>{const posts=db.submissions.filter(s=>getPlatforms(s).includes(p));if(posts.length)XLSX.utils.book_append_sheet(wb,buildPlatformSheet(db.submissions,p),p.substring(0,31));});XLSX.utils.book_append_sheet(wb,buildStatsSheet(db.submissions),"Platform Stats");XLSX.utils.book_append_sheet(wb,buildRemindersSheet(db.reminders),"Reminders");XLSX.utils.book_append_sheet(wb,buildEventsSheet(db.events),"Church Events");XLSX.writeFile(wb,`ERC_MediaHub_${tod()}.xlsx`,{bookSST:false,cellStyles:true});};
const exportCalendarExcel=(db,year,month)=>{const wb=XLSX.utils.book_new();const monthName=MONTHS[month];const monthSubs=db.submissions.filter(s=>{const d=s.dueDate||s.postedDate||s.submittedDate;if(!d)return false;const[y,m]=d.split("-");return+y===year&&+m-1===month;});XLSX.utils.book_append_sheet(wb,buildCalendarSheet(db.submissions,year,month),`Calendar ${monthName}`);XLSX.utils.book_append_sheet(wb,buildStatsSheet(db.submissions),"Platform Stats");XLSX.utils.book_append_sheet(wb,buildPastorSheet(monthSubs),"Pastor Report");XLSX.utils.book_append_sheet(wb,buildRevisionSheet(monthSubs),"Design Revisions");XLSX.writeFile(wb,`ERC_Calendar_${monthName}_${year}.xlsx`,{bookSST:false,cellStyles:true});};

// SHARED UI COMPONENTS
const N = "#1a2e44", G = "#d4a259", BG = "#F8F7F5", W = "#ffffff", BR = "#E8E5DF";

const Badge = ({status}) => {
  const c = STATUS_CONFIG[status]||STATUS_CONFIG.Draft;
  return <span style={{background:c.bg,color:c.fg,padding:"4px 10px",borderRadius:20,fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>{c.icon} {status}</span>;
};
const CatBadge = ({cat}) => <span style={{background:CAT_COLORS[cat]||CAT_COLORS.Other,color:"#fff",padding:"3px 9px",borderRadius:12,fontSize:11,fontWeight:600}}>{cat}</span>;
const PlatformDot = ({platform}) => <span style={{display:"inline-block",width:10,height:10,borderRadius:"50%",background:PLATFORM_COLORS[platform]||"#999",marginRight:5,flexShrink:0}} />;
const Card = ({children,style={},hover=false}) => (
  <div className={hover?"card-h":undefined} style={{background:W,borderRadius:14,padding:"18px 20px",border:`1px solid ${BR}`,marginBottom:12,transition:"box-shadow 0.2s,border-color 0.2s",...style}}>{children}</div>
);
const PageTitle = ({title,sub}) => (
  <div style={{marginBottom:22}}>
    <h2 style={{fontFamily:"'Fraunces',serif",color:N,fontSize:22,margin:"0 0 3px",fontWeight:700}}>{title}</h2>
    {sub && <p style={{color:"#999",margin:0,fontSize:13}}>{sub}</p>}
  </div>
);
const Label = ({children}) => <label style={{display:"block",fontSize:12,fontWeight:600,color:"#666",marginBottom:5,textTransform:"uppercase",letterSpacing:.3}}>{children}</label>;
const Input = (props) => <input {...props} style={{width:"100%",padding:"10px 13px",border:`1.5px solid ${BR}`,borderRadius:9,fontSize:14,fontFamily:"inherit",boxSizing:"border-box",transition:"border-color 0.15s",...(props.style||{})}} />;
const Textarea = (props) => <textarea {...props} style={{width:"100%",padding:"10px 13px",border:`1.5px solid ${BR}`,borderRadius:9,fontSize:14,fontFamily:"inherit",boxSizing:"border-box",resize:"vertical",...(props.style||{})}} />;
const Select = ({children,...props}) => <select {...props} style={{width:"100%",padding:"10px 13px",border:`1.5px solid ${BR}`,borderRadius:9,fontSize:14,fontFamily:"inherit",boxSizing:"border-box",...(props.style||{})}}>{children}</select>;
const Btn = ({variant="primary",size="md",children,style={},...props}) => {
  const base = {border:"none",borderRadius:9,fontWeight:600,cursor:"pointer",fontFamily:"inherit",transition:"opacity 0.12s,transform 0.12s",display:"inline-flex",alignItems:"center",gap:6};
  const sz = size==="sm"?{padding:"6px 13px",fontSize:12}:size==="lg"?{padding:"13px 28px",fontSize:15}:{padding:"10px 20px",fontSize:13};
  const v = {primary:{background:N,color:W},gold:{background:G,color:W},success:{background:"#059669",color:W},danger:{background:"#DC2626",color:W},warning:{background:"#D97706",color:W},secondary:{background:BR,color:"#444"},ghost:{background:"transparent",color:N,border:`1.5px solid ${BR}`}}[variant]||{background:N,color:W};
  return <button {...props} className="btn-h" style={{...base,...sz,...v,...style}}>{children}</button>;
};
const PillSelect = ({options,value,onChange,colorMap}) => (
  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
    {options.map(o=>{const sel=value===o;const cc=colorMap?.[o];return<button key={o} onClick={()=>onChange(o)} className="btn-h" style={{padding:"8px 15px",borderRadius:9,fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"inherit",border:sel?`2px solid ${cc||N}`:"2px solid #e8e5df",background:sel?(cc?cc+"18":"#eef1f5"):"#fff",color:sel?(cc||N):"#777",transition:"all 0.15s"}}>{o}</button>;})}
  </div>
);
const MultiPillSelect = ({options,values=[],onChange,colorMap}) => (
  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
    {options.map(o=>{const sel=values.includes(o);const cc=colorMap?.[o];return<button key={o} onClick={()=>onChange(sel?values.filter(v=>v!==o):[...values,o])} className="btn-h" style={{padding:"8px 15px",borderRadius:9,fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"inherit",border:sel?`2px solid ${cc||N}`:"2px solid #e8e5df",background:sel?(cc?cc+"28":"#eef1f5"):"#fff",color:sel?(cc||N):"#777",transition:"all 0.15s",display:"flex",alignItems:"center",gap:6}}>{sel&&<span style={{fontSize:11,background:cc||N,color:"#fff",borderRadius:"50%",width:16,height:16,display:"flex",alignItems:"center",justifyContent:"center"}}>✓</span>}{o}</button>;})}
  </div>
);
const EmptyState = ({icon,text}) => (
  <div style={{textAlign:"center",padding:"48px 20px",color:"#ccc"}}>
    <div style={{fontSize:44,marginBottom:10}}>{icon}</div>
    <p style={{fontSize:14,margin:0}}>{text}</p>
  </div>
);

// ── FIREBASE AUTH FLOW ────────────────────────────────────────────────────────
// Each team member has a pre-set "display name" in DEFAULT_MEMBERS.
// We map their display name to a Firebase email: name@erc-media.internal
// First visit: they pick their name, set a password → createUserWithEmailAndPassword
// Subsequent: they pick their name, enter password → signInWithEmailAndPassword

function makeEmail(name) {
  return `${name.toLowerCase().replace(/\s+/g,".")}@erc-media.internal`;
}

function AuthScreen({ members, onSignedIn }) {
  const [step, setStep] = useState("pick"); // "pick" | "setup" | "login"
  const [selectedMember, setSelectedMember] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const active = members.filter(m => m.active);
  const filtered = search.trim()
    ? active.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.fullName.toLowerCase().includes(search.toLowerCase()))
    : active;

  const handleSelectMember = async (member) => {
    setSelectedMember(member);
    setError("");
    setPassword("");
    setConfirmPassword("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(fbAuth, makeEmail(member.name), "__probe__");
      setStep("login");
    } catch (e) {
      if (e.code === "auth/user-not-found") {
        // Definitely no account yet
        setStep("setup");
      } else if (e.code === "auth/invalid-credential") {
        // Firebase v9+ uses this for BOTH wrong-password AND user-not-found.
        // Default to login; if account truly doesn't exist, handleLogin will catch it
        // and redirect to setup automatically.
        setStep("login");
      } else {
        // wrong-password, too-many-requests, etc. — account exists
        setStep("login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async () => {
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirmPassword) { setError("Passwords don't match."); return; }
    setLoading(true); setError("");
    try {
      const cred = await createUserWithEmailAndPassword(fbAuth, makeEmail(selectedMember.name), password);
      onSignedIn(selectedMember.name, cred.user);
    } catch (e) {
      if (e.code === "auth/email-already-in-use") {
        // Account already exists — quietly switch to login screen
        setError("");
        setPassword("");
        setStep("login");
      } else {
        setError(e.message || "Setup failed. Try again.");
      }
    } finally { setLoading(false); }
  };

  const handleLogin = async () => {
    if (!password) { setError("Enter your password."); return; }
    setLoading(true); setError("");
    try {
      const cred = await signInWithEmailAndPassword(fbAuth, makeEmail(selectedMember.name), password);
      onSignedIn(selectedMember.name, cred.user);
    } catch (e) {
      if (e.code === "auth/user-not-found") {
        // Account doesn't exist yet — send them to setup
        setError("");
        setPassword("");
        setConfirmPassword("");
        setStep("setup");
      } else if (e.code === "auth/wrong-password" || e.code === "auth/invalid-credential") {
        setError("Wrong password. Try again.");
      } else if (e.code === "auth/too-many-requests") {
        setError("Too many attempts. Please wait a few minutes and try again.");
      } else {
        setError(e.message || "Sign-in failed.");
      }
    } finally { setLoading(false); }
  };

  if (step === "pick") return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:N,fontFamily:"'DM Sans',sans-serif",padding:16}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:wght@700;800&display=swap" rel="stylesheet"/>
      <div style={{background:W,borderRadius:18,padding:"32px 28px",maxWidth:420,width:"100%",boxShadow:"0 24px 64px rgba(0,0,0,0.4)"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:40,marginBottom:8}}>⛪</div>
          <h1 style={{fontFamily:"'Fraunces',serif",fontSize:22,color:N,margin:"0 0 4px"}}>ERC Media Hub</h1>
          <p style={{color:"#aaa",fontSize:12,margin:0}}>Ottawa–Gatineau Parish · 2026</p>
        </div>
        <p style={{fontSize:13,color:"#666",textAlign:"center",marginBottom:16}}>Who are you? Click your name to sign in.</p>
        <Input placeholder="Search your name..." value={search} onChange={e=>setSearch(e.target.value)} style={{marginBottom:12}} />
        <div style={{display:"flex",flexDirection:"column",gap:5,maxHeight:400,overflowY:"auto"}}>
          {filtered.map(m => {
            const tc = TYPE_CONFIG[m.type];
            return (
              <button key={m.id} onClick={()=>handleSelectMember(m)} className="btn-h"
                style={{padding:"11px 14px",border:`1.5px solid ${BR}`,borderRadius:10,background:W,fontSize:14,fontWeight:500,cursor:"pointer",textAlign:"left",fontFamily:"inherit",color:"#333",display:"flex",alignItems:"center",gap:10,transition:"all 0.15s"}}>
                <span style={{width:34,height:34,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:W,background:tc.color,flexShrink:0}}>{m.name[0]}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:14}}>{m.fullName||m.name}</div>
                  <div style={{fontSize:11,color:"#bbb"}}>{m.role}</div>
                </div>
                <span style={{fontSize:10,background:tc.color+"18",color:tc.color,padding:"2px 8px",borderRadius:8,fontWeight:600}}>{tc.label}</span>
              </button>
            );
          })}
          {filtered.length===0 && <p style={{textAlign:"center",color:"#ccc",fontSize:13,padding:"16px 0"}}>No team members found.</p>}
        </div>
        {loading && <p style={{textAlign:"center",color:"#aaa",fontSize:13,marginTop:12}}>Checking account...</p>}
      </div>
    </div>
  );

  if (step === "setup") return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:N,fontFamily:"'DM Sans',sans-serif",padding:16}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:wght@700;800&display=swap" rel="stylesheet"/>
      <div style={{background:W,borderRadius:18,padding:"32px 28px",maxWidth:400,width:"100%",boxShadow:"0 24px 64px rgba(0,0,0,0.4)"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{width:56,height:56,borderRadius:"50%",background:TYPE_CONFIG[selectedMember.type].color,color:W,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:700,margin:"0 auto 12px"}}>
            {selectedMember.name[0]}
          </div>
          <h2 style={{fontFamily:"'Fraunces',serif",fontSize:20,color:N,margin:"0 0 4px"}}>Welcome, {selectedMember.name}!</h2>
          <p style={{color:"#aaa",fontSize:12,margin:0}}>First time here — create your password to get in.</p>
        </div>

        <div style={{padding:"12px 14px",background:"#EEF2FF",borderRadius:10,border:"1px solid #C7D2FE",marginBottom:18,fontSize:12,color:"#4338CA"}}>
          🔐 Your account will be: <strong>{makeEmail(selectedMember.name)}</strong>
        </div>

        <Label>Create a password</Label>
        <Input type="password" placeholder="At least 6 characters" value={password} onChange={e=>setPassword(e.target.value)} style={{marginBottom:12}} onKeyDown={e=>e.key==="Enter"&&handleSetup()}/>
        <Label>Confirm password</Label>
        <Input type="password" placeholder="Type it again" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} style={{marginBottom:16}} onKeyDown={e=>e.key==="Enter"&&handleSetup()}/>

        {error && <div style={{padding:"8px 12px",background:"#FEE2E2",borderRadius:8,fontSize:12,color:"#DC2626",marginBottom:12}}>{error}</div>}

        <Btn variant="primary" onClick={handleSetup} disabled={loading} style={{width:"100%",justifyContent:"center",opacity:loading?.6:1}}>
          {loading?"Setting up...":"🚀 Create my account & sign in"}
        </Btn>
        <button onClick={()=>setStep("pick")} style={{background:"none",border:"none",color:"#aaa",fontSize:12,cursor:"pointer",marginTop:10,fontFamily:"inherit",display:"block",textAlign:"center",width:"100%"}}>← Back to name selection</button>
      </div>
    </div>
  );

  if (step === "login") return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:N,fontFamily:"'DM Sans',sans-serif",padding:16}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:wght@700;800&display=swap" rel="stylesheet"/>
      <div style={{background:W,borderRadius:18,padding:"32px 28px",maxWidth:400,width:"100%",boxShadow:"0 24px 64px rgba(0,0,0,0.4)"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{width:56,height:56,borderRadius:"50%",background:TYPE_CONFIG[selectedMember.type].color,color:W,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:700,margin:"0 auto 12px"}}>
            {selectedMember.name[0]}
          </div>
          <h2 style={{fontFamily:"'Fraunces',serif",fontSize:20,color:N,margin:"0 0 4px"}}>Hey {selectedMember.name}!</h2>
          <p style={{color:"#aaa",fontSize:12,margin:0}}>Enter your password to continue.</p>
        </div>

        <Label>Your password</Label>
        <Input type="password" placeholder="Enter your password" value={password} onChange={e=>setPassword(e.target.value)} style={{marginBottom:16}} onKeyDown={e=>e.key==="Enter"&&handleLogin()} autoFocus/>

        {error && <div style={{padding:"8px 12px",background:"#FEE2E2",borderRadius:8,fontSize:12,color:"#DC2626",marginBottom:12}}>{error}</div>}

        <Btn variant="primary" onClick={handleLogin} disabled={loading} style={{width:"100%",justifyContent:"center",opacity:loading?.6:1}}>
          {loading?"Signing in...":"Sign in →"}
        </Btn>
        <button onClick={()=>setStep("pick")} style={{background:"none",border:"none",color:"#aaa",fontSize:12,cursor:"pointer",marginTop:10,fontFamily:"inherit",display:"block",textAlign:"center",width:"100%"}}>← Not you? Go back</button>
      </div>
    </div>
  );

  return null;
}

// ── READY TO POST PAGE ─────────────────────────────────────────────────────
// A guided, step-by-step flow for the person assigned to post content.
// Shows only posts in stage 4 (Approved + has design). Walks through:
// 1. Review the content & design
// 2. Platform-by-platform checklist
// 3. Paste live links
// 4. Confirm posted
function ReadyToPostPage({ db, update, user, isReviewer }) {
  const [activeId, setActiveId] = useState(null);
  const [postLinks, setPostLinks] = useState({}); // platformKey -> url
  const [checklistDone, setChecklistDone] = useState({}); // platform -> bool
  const [step, setStep] = useState(1); // 1=review, 2=checklist, 3=links, 4=confirm
  const [successId, setSuccessId] = useState(null);

  // Posts at stage 4 assigned to me (or if I'm a lead/reviewer, show all stage 4)
  const readyPosts = db.submissions.filter(s => {
    const stage = getStage(s);
    if (stage !== 4) return false;
    if (isReviewer) return true;
    return s.assignedPoster === user;
  });

  const selected = readyPosts.find(s => s.id === activeId);
  const platforms = selected ? getPlatforms(selected) : [];
  const design = selected ? getCurrentDesign(selected) : null;

  const openPost = (id) => {
    setActiveId(id);
    setStep(1);
    setPostLinks({});
    setChecklistDone({});
  };

  const allPlatformsPosted = platforms.every(p => checklistDone[p]);

  const handleMarkPosted = () => {
    const primaryLink = Object.values(postLinks).find(v => v?.trim()) || "";
    update(prev => ({
      ...prev,
      submissions: prev.submissions.map(s =>
        s.id === activeId ? {
          ...s,
          status: "Posted",
          postedBy: user,
          postedDate: tod(),
          postLink: primaryLink,
          // Store per-platform links
          platformPostLinks: postLinks,
        } : s
      )
    }));
    setSuccessId(activeId);
    setActiveId(null);
  };

  if (successId) {
    const done = db.submissions.find(s => s.id === successId) || { title: "that post" };
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: 64, marginBottom: 12, animation: "bounce 0.6s ease" }}>🎉</div>
        <h2 style={{ fontFamily: "'Fraunces',serif", color: N, fontSize: 24, margin: "0 0 8px" }}>It's live!</h2>
        <p style={{ color: "#666", fontSize: 14, marginBottom: 24 }}>"{done.title}" is now posted. Amazing work!</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          <Btn variant="primary" onClick={() => { setSuccessId(null); }}>Post another</Btn>
          <Btn variant="secondary" onClick={() => setSuccessId(null)}>Back to list</Btn>
        </div>
      </div>
    );
  }

  if (selected) {
    const STEPS = ["Review content", "Platform checklist", "Add live links", "Confirm & post"];
    return (
      <div>
        {/* Back button */}
        <button onClick={() => setActiveId(null)} style={{ background: "none", border: "none", color: "#aaa", fontSize: 13, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5, marginBottom: 16, padding: 0 }}>
          ← Back to queue
        </button>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 700, color: N, marginBottom: 4 }}>{selected.title}</div>
          <div style={{ fontSize: 12, color: "#aaa" }}>Assigned to you · {selected.contentType} · by {selected.submittedBy}</div>
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", gap: 0, marginBottom: 24, borderRadius: 10, overflow: "hidden", border: `1px solid ${BR}` }}>
          {STEPS.map((s, i) => {
            const stepNum = i + 1;
            const active = step === stepNum;
            const done = step > stepNum;
            return (
              <div key={s} onClick={() => done && setStep(stepNum)} style={{ flex: 1, padding: "10px 6px", textAlign: "center", fontSize: 11, fontWeight: 600, background: active ? N : done ? "#D1FAE5" : "#f8f7f5", color: active ? W : done ? "#065F46" : "#aaa", cursor: done ? "pointer" : "default", borderRight: i < STEPS.length - 1 ? `1px solid ${BR}` : "none", transition: "all 0.2s" }}>
                <div>{done ? "✓" : stepNum}</div>
                <div style={{ fontSize: 10, fontWeight: 500, marginTop: 2, display: "none" }}>{s}</div>
              </div>
            );
          })}
        </div>

        {/* Step 1: Review */}
        {step === 1 && (
          <Card>
            <h3 style={{ margin: "0 0 16px", color: N, fontSize: 16, fontWeight: 700 }}>Step 1 — Review the content</h3>

            {/* Caption */}
            {selected.caption && (
              <div style={{ marginBottom: 16 }}>
                <Label>Caption to post</Label>
                <div style={{ padding: "14px 16px", background: "#faf9f7", borderRadius: 10, border: `1px solid ${BR}`, fontSize: 13, color: "#333", lineHeight: 1.7, whiteSpace: "pre-wrap", position: "relative" }}>
                  {selected.caption}
                  <button
                    onClick={() => navigator.clipboard?.writeText(selected.caption)}
                    style={{ position: "absolute", top: 10, right: 10, background: N, color: W, border: "none", borderRadius: 6, padding: "3px 8px", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                  >Copy</button>
                </div>
              </div>
            )}

            {/* Design file */}
            {design && (
              <div style={{ marginBottom: 16 }}>
                <Label>Design file (v{getRevisions(selected).length})</Label>
                <a href={design.url} target="_blank" rel="noreferrer"
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#EEF2FF", borderRadius: 10, border: "1px solid #C7D2FE", textDecoration: "none" }}>
                  <span style={{ fontSize: 22 }}>🎨</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#2563EB" }}>Open {design.linkType || "Design"} file →</div>
                    <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>Uploaded by {design.uploadedBy} · {fmtDate(design.uploadedDate)}</div>
                  </div>
                  <span style={{ fontSize: 18 }}>↗</span>
                </a>
              </div>
            )}

            {/* Platforms */}
            <div style={{ marginBottom: 16 }}>
              <Label>Will be posted to</Label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {platforms.map(p => (
                  <span key={p} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", background: PLATFORM_COLORS[p] + "15", border: `1.5px solid ${PLATFORM_COLORS[p]}40`, borderRadius: 9, fontSize: 12, fontWeight: 600, color: PLATFORM_COLORS[p] }}>
                    {PLATFORM_ICONS[p]} {p}
                  </span>
                ))}
              </div>
            </div>

            {/* Event & due date */}
            {(selected.event || selected.dueDate) && (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
                {selected.event && <div style={{ padding: "6px 12px", background: "#f0edea", borderRadius: 8, fontSize: 12, color: "#555" }}>📅 {selected.event}</div>}
                {selected.dueDate && <div style={{ padding: "6px 12px", background: selected.dueDate < tod() ? "#FEE2E2" : "#FEF9C3", borderRadius: 8, fontSize: 12, fontWeight: 600, color: selected.dueDate < tod() ? "#DC2626" : "#92400E" }}>⏰ Due: {fmtDate(selected.dueDate)}</div>}
              </div>
            )}

            {/* Reviewer notes */}
            {selected.reviewedBy && (
              <div style={{ padding: "10px 14px", background: "#D1FAE5", borderRadius: 9, border: "1px solid #86EFAC", fontSize: 12, color: "#065F46", marginBottom: 16 }}>
                ✅ Approved by <strong>{selected.reviewedBy}</strong> on {fmtDate(selected.reviewDate)}
              </div>
            )}

            <Btn variant="primary" onClick={() => setStep(2)} style={{ marginTop: 4 }}>Looks good → Next step</Btn>
          </Card>
        )}

        {/* Step 2: Checklist */}
        {step === 2 && (
          <Card>
            <h3 style={{ margin: "0 0 6px", color: N, fontSize: 16, fontWeight: 700 }}>Step 2 — Platform checklist</h3>
            <p style={{ color: "#aaa", fontSize: 13, margin: "0 0 20px" }}>Go through each platform. Check it off once you've posted there.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {platforms.map(p => {
                const done = checklistDone[p];
                return (
                  <div key={p} onClick={() => setChecklistDone(prev => ({ ...prev, [p]: !done }))}
                    style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 12, border: `2px solid ${done ? PLATFORM_COLORS[p] : BR}`, background: done ? PLATFORM_COLORS[p] + "10" : W, cursor: "pointer", transition: "all 0.2s" }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", border: `2px solid ${done ? PLATFORM_COLORS[p] : "#ddd"}`, background: done ? PLATFORM_COLORS[p] : W, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, transition: "all 0.2s", flexShrink: 0 }}>
                      {done ? "✓" : ""}
                    </div>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{PLATFORM_ICONS[p]}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: done ? PLATFORM_COLORS[p] : "#333" }}>{p}</div>
                      <div style={{ fontSize: 11, color: "#aaa" }}>{done ? "✅ Posted!" : "Tap to mark as posted on this platform"}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Btn variant="secondary" size="sm" onClick={() => setStep(1)}>← Back</Btn>
              <Btn variant="primary" onClick={() => setStep(3)} disabled={!allPlatformsPosted} style={{ opacity: allPlatformsPosted ? 1 : .4, cursor: allPlatformsPosted ? "pointer" : "not-allowed" }}>
                Next step →
              </Btn>
              {!allPlatformsPosted && <span style={{ fontSize: 11, color: "#aaa", alignSelf: "center" }}>Check off all platforms first</span>}
            </div>
          </Card>
        )}

        {/* Step 3: Live links */}
        {step === 3 && (
          <Card>
            <h3 style={{ margin: "0 0 6px", color: N, fontSize: 16, fontWeight: 700 }}>Step 3 — Add live links</h3>
            <p style={{ color: "#aaa", fontSize: 13, margin: "0 0 20px" }}>Paste the URL of each live post. You can skip platforms that don't have direct links (e.g. WhatsApp).</p>

            {platforms.map(p => (
              <div key={p} style={{ marginBottom: 14 }}>
                <Label>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    {PLATFORM_ICONS[p]} {p} link <span style={{ fontWeight: 400, color: "#bbb", textTransform: "none" }}>(optional)</span>
                  </span>
                </Label>
                <Input
                  placeholder={p === "Instagram" ? "https://www.instagram.com/p/..." : p === "Facebook" ? "https://www.facebook.com/..." : p === "YouTube" ? "https://www.youtube.com/watch?v=..." : p === "TikTok" ? "https://www.tiktok.com/@erc..." : "https://..."}
                  value={postLinks[p] || ""}
                  onChange={e => setPostLinks(prev => ({ ...prev, [p]: e.target.value }))}
                />
              </div>
            ))}

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
              <Btn variant="secondary" size="sm" onClick={() => setStep(2)}>← Back</Btn>
              <Btn variant="primary" onClick={() => setStep(4)}>Next step →</Btn>
            </div>
          </Card>
        )}

        {/* Step 4: Confirm */}
        {step === 4 && (
          <Card style={{ borderLeft: "4px solid #059669" }}>
            <h3 style={{ margin: "0 0 6px", color: "#065F46", fontSize: 16, fontWeight: 700 }}>Step 4 — Final confirmation</h3>
            <p style={{ color: "#aaa", fontSize: 13, margin: "0 0 20px" }}>Review everything before marking this as posted.</p>

            <div style={{ padding: "14px 16px", background: "#F0FDF4", borderRadius: 10, border: "1px solid #86EFAC", marginBottom: 16 }}>
              <div style={{ fontWeight: 700, color: "#065F46", marginBottom: 10 }}>✅ Summary</div>
              <div style={{ fontSize: 13, color: "#166534", lineHeight: 1.8 }}>
                <div>📝 <strong>{selected.title}</strong></div>
                <div>👤 Posted by: <strong>{user}</strong></div>
                <div>📅 Date: <strong>{fmtDate(tod())}</strong></div>
                <div>📱 Platforms: <strong>{platforms.join(", ")}</strong></div>
              </div>
            </div>

            {Object.entries(postLinks).filter(([,v]) => v?.trim()).length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <Label>Live post links</Label>
                {Object.entries(postLinks).filter(([,v]) => v?.trim()).map(([p, url]) => (
                  <div key={p} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
                    <span style={{ fontSize: 14 }}>{PLATFORM_ICONS[p]}</span>
                    <a href={url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#2563EB" }}>{url}</a>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Btn variant="secondary" size="sm" onClick={() => setStep(3)}>← Back</Btn>
              <Btn variant="success" onClick={handleMarkPosted} style={{ fontSize: 14, padding: "12px 24px" }}>
                🚀 Mark as posted!
              </Btn>
            </div>
          </Card>
        )}
      </div>
    );
  }

  // Queue view
  return (
    <div>
      <PageTitle title="🚀 Ready to Post" sub={readyPosts.length > 0 ? `${readyPosts.length} post${readyPosts.length !== 1 ? "s" : ""} approved and waiting to go live` : "Nothing in the queue right now"} />

      {readyPosts.length === 0 ? (
        <EmptyState icon="✨" text="No posts are ready to go live right now. Check back after designs are approved." />
      ) : (
        <div>
          {/* Priority tip */}
          {readyPosts.some(s => s.dueDate && s.dueDate <= tod()) && (
            <div style={{ padding: "12px 16px", background: "#FEE2E2", borderRadius: 10, border: "1px solid #FECACA", marginBottom: 16, fontSize: 13, color: "#DC2626", fontWeight: 600 }}>
              ⚠️ Some posts are overdue — post those first!
            </div>
          )}

          {readyPosts
            .sort((a, b) => {
              // Overdue first, then by due date
              const aOver = a.dueDate && a.dueDate < tod();
              const bOver = b.dueDate && b.dueDate < tod();
              if (aOver && !bOver) return -1;
              if (!aOver && bOver) return 1;
              return (a.dueDate || a.submittedDate || "").localeCompare(b.dueDate || b.submittedDate || "");
            })
            .map(s => {
              const design = getCurrentDesign(s);
              const plats = getPlatforms(s);
              const isOverdue = s.dueDate && s.dueDate < tod();
              const isAssignedToMe = s.assignedPoster === user;
              return (
                <Card key={s.id} hover style={{ borderLeft: isOverdue ? "4px solid #EF4444" : "4px solid #059669" }}>
                  <div style={{ display: "flex", alignItems: "start", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {isOverdue && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: "#EF4444", padding: "2px 8px", borderRadius: 6, display: "inline-block", marginBottom: 6 }}>OVERDUE</span>
                      )}
                      {isAssignedToMe && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#065F46", background: "#D1FAE5", padding: "2px 8px", borderRadius: 6, display: "inline-block", marginBottom: 6, marginLeft: isOverdue ? 6 : 0 }}>ASSIGNED TO YOU</span>
                      )}
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#222", marginBottom: 4 }}>{s.title}</div>
                      <div style={{ fontSize: 12, color: "#aaa", marginBottom: 8 }}>
                        {s.contentType} · by {s.submittedBy}
                        {s.dueDate && <span style={{ color: isOverdue ? "#EF4444" : "#F59E0B", fontWeight: 600, marginLeft: 8 }}>· Due {fmtDate(s.dueDate)}</span>}
                        {s.assignedPoster && <span style={{ marginLeft: 8 }}>· Poster: <strong>{s.assignedPoster}</strong></span>}
                      </div>

                      {/* Platforms */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
                        {plats.map(p => (
                          <span key={p} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", background: PLATFORM_COLORS[p] + "15", border: `1.5px solid ${PLATFORM_COLORS[p]}40`, borderRadius: 8, fontSize: 11, fontWeight: 600, color: PLATFORM_COLORS[p] }}>
                            {PLATFORM_ICONS[p]} {p}
                          </span>
                        ))}
                      </div>

                      {/* Caption preview */}
                      {s.caption && (
                        <div style={{ fontSize: 12, color: "#666", fontStyle: "italic", padding: "6px 10px", background: "#faf9f7", borderRadius: 7, border: `1px solid ${BR}`, lineHeight: 1.5 }}>
                          "{s.caption.substring(0, 100)}{s.caption.length > 100 ? "..." : ""}"
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
                      {design && (
                        <a href={design.url} target="_blank" rel="noreferrer"
                          style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", background: "#EEF2FF", border: "1px solid #C7D2FE", borderRadius: 8, fontSize: 11, fontWeight: 600, color: "#2563EB", textDecoration: "none" }}>
                          🎨 Design →
                        </a>
                      )}
                      <Btn variant="success" size="sm" onClick={() => openPost(s.id)}>
                        🚀 Post this
                      </Btn>
                    </div>
                  </div>
                </Card>
              );
            })}
        </div>
      )}
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [authUser, setAuthUser] = useState(undefined); // undefined = loading, null = not logged in, {uid, displayName} = logged in
  const [user, setUser] = useState(null); // display name string
  const [db, setDb] = useState(null);
  const [page, setPage] = useState("home");
  const [mobileNav, setMobileNav] = useState(false);
  const [saveStatus, setSaveStatus] = useState("saved");
  const initialized = useRef(false);
  const saveTimer = useRef(null);

  // Cached members for auth screen
  const cachedMembers = useMemo(() => {
    try {
      const c = localStorage.getItem(CACHE_KEY);
      if (c) return JSON.parse(c).members || DEFAULT_MEMBERS;
    } catch {}
    return DEFAULT_MEMBERS;
  }, []);

  // Firebase Auth state listener
  useEffect(() => {
    const unsub = onAuthStateChanged(fbAuth, (firebaseUser) => {
      if (firebaseUser) {
        // Derive display name from email
        const emailName = firebaseUser.email?.split("@")[0]?.replace(/\./g, " ");
        // Match against members list (case-insensitive)
        const allMembers = (() => {
          try { const c = localStorage.getItem(CACHE_KEY); if (c) return JSON.parse(c).members || DEFAULT_MEMBERS; } catch {}
          return DEFAULT_MEMBERS;
        })();
        const matched = allMembers.find(m => makeEmail(m.name) === firebaseUser.email);
        setAuthUser(firebaseUser);
        setUser(matched ? matched.name : emailName);
      } else {
        setAuthUser(null);
        setUser(null);
      }
    });
    return () => unsub();
  }, []);

  // Load DB once user is known
  useEffect(() => {
    if (!user) return;
    initialized.current = false;
    let cached = null;
    try { const raw = localStorage.getItem(CACHE_KEY); if (raw) cached = JSON.parse(raw); } catch {}
    setDb(cached ? { ...EMPTY_DB, ...cached } : { ...EMPTY_DB });

    loadFromFirebase()
      .then(fresh => {
        setDb(fresh);
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(fresh)); } catch {}
      })
      .catch(e => console.warn("Firebase sync failed, using local cache:", e))
      .finally(() => { initialized.current = true; });
  }, [user]);

  // Debounced save
  useEffect(() => {
    if (!db || !initialized.current) return;
    setSaveStatus("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(db)); } catch {}
      saveDB(db)
        .then(() => setSaveStatus("saved"))
        .catch(err => { console.error("Firebase save error:", err); setSaveStatus("error"); });
    }, 800);
  }, [db]);

  const update = useCallback((fn) => {
    setDb(prev => {
      const next = fn({ ...prev });
      initialized.current = true;
      return next;
    });
  }, []);

  const handleSignOut = async () => {
    await signOut(fbAuth);
    setDb(null);
    setPage("home");
    setUser(null);
    setAuthUser(null);
  };

  // Auth loading
  if (authUser === undefined) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: N, fontFamily: "'DM Sans',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:wght@700;800&display=swap" rel="stylesheet" />
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 38, marginBottom: 8 }}>⛪</div>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>Loading...</p>
      </div>
    </div>
  );

  // Not logged in → show Auth screen
  if (!authUser || !user) return (
    <AuthScreen
      members={cachedMembers}
      onSignedIn={(name) => { setUser(name); }}
    />
  );

  // DB still loading
  if (!db) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: N, fontFamily: "'DM Sans',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:wght@700;800&display=swap" rel="stylesheet" />
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 38, marginBottom: 8 }}>⛪</div>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>Loading data...</p>
      </div>
    </div>
  );

  const activeMembers = db.members || DEFAULT_MEMBERS;
  const currentMember = activeMembers.find(m => m.name === user) || { type: "creator" };
  const isReviewer = currentMember.type === "approver" || currentMember.type === "lead";

  const pendingCount = db.submissions.filter(s => s.status === "Ready for Review").length;
  const dueReminders = db.reminders.filter(r => r.date <= tod() && !r.done).length;
  const unreadAnnouncements = (db.announcements || []).filter(a => !a.readBy?.includes(user)).length;
  const readyToPostCount = db.submissions.filter(s => {
    const stage = getStage(s);
    if (stage !== 4) return false;
    if (isReviewer) return true;
    return s.assignedPoster === user;
  }).length;

  const navItems = [
    { id: "board", label: "Board", icon: "📊", badge: 0 },
    { id: "home", label: "Home", icon: "🏠", badge: 0 },
    { id: "submit", label: "New Post Idea", icon: "💡", badge: 0 },
    { id: "review", label: isReviewer ? "Review Queue" : "My Submissions", icon: "👁", badge: isReviewer ? pendingCount : 0 },
    { id: "upload", label: "Upload Design", icon: "🎨", badge: 0 },
    { id: "ready-to-post", label: "Ready to Post", icon: "🚀", badge: readyToPostCount },
    { id: "social-calendar", label: "Content Calendar", icon: "🗓", badge: 0 },
    { id: "calendar", label: "Church Events", icon: "📅", badge: 0 },
    { id: "reminders", label: "Reminders", icon: "🔔", badge: dueReminders },
    { id: "announcements", label: "Announcements", icon: "📢", badge: unreadAnnouncements },
    { id: "team", label: "Team", icon: "👥", badge: 0 },
    { id: "export", label: "Export", icon: "📤", badge: 0 },
  ];

  const mobileBottomNav = [
    { id: "board", icon: "📊" }, { id: "home", icon: "🏠" }, { id: "submit", icon: "💡" },
    { id: "review", icon: "👁", badge: pendingCount }, { id: "ready-to-post", icon: "🚀", badge: readyToPostCount },
  ];

  const pages = {
    board: <BoardPage db={db} update={update} user={user} isReviewer={isReviewer} setPage={setPage} />,
    home: <HomePage db={db} user={user} setPage={setPage} isReviewer={isReviewer} />,
    submit: <SubmitPage db={db} update={update} user={user} setPage={setPage} />,
    review: <ReviewPage db={db} update={update} user={user} isReviewer={isReviewer} setPage={setPage} />,
    upload: <UploadPage db={db} update={update} user={user} setPage={setPage} />,
    "ready-to-post": <ReadyToPostPage db={db} update={update} user={user} isReviewer={isReviewer} />,
    "social-calendar": <SocialCalendarPage db={db} update={update} user={user} />,
    calendar: <CalendarPage db={db} update={update} />,
    reminders: <RemindersPage db={db} update={update} user={user} />,
    announcements: <AnnouncementsPage db={db} update={update} user={user} />,
    team: <TeamPage db={db} update={update} user={user} isReviewer={isReviewer} />,
    export: <ExportPage db={db} user={user} />,
  };

  const NavButton = ({ n }) => {
    const active = page === n.id;
    return (
      <button key={n.id} onClick={() => { setPage(n.id); setMobileNav(false); }}
        style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 10px", border: "none", background: active ? "rgba(212,162,89,0.18)" : "transparent", color: active ? "#d4a259" : "rgba(255,255,255,0.65)", fontWeight: active ? 600 : 400, fontSize: 13, cursor: "pointer", borderRadius: 8, fontFamily: "inherit", textAlign: "left", transition: "all 0.15s", position: "relative", marginBottom: 2 }}>
        <span style={{ fontSize: 16, width: 22, textAlign: "center", flexShrink: 0 }}>{n.icon}</span>
        <span style={{ flex: 1 }}>{n.label}</span>
        {n.badge > 0 && <span style={{ background: "#EF4444", color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 9, minWidth: 18, textAlign: "center" }}>{n.badge}</span>}
        {active && <span style={{ position: "absolute", left: 0, top: "20%", bottom: "20%", width: 3, background: "#d4a259", borderRadius: "0 2px 2px 0" }} />}
      </button>
    );
  };

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", minHeight: "100vh", background: BG, display: "flex", flexDirection: "column" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700&family=Fraunces:wght@700;800&display=swap" rel="stylesheet" />

      {/* Header */}
      <header style={{ background: N, color: W, padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, borderBottom: `3px solid ${G}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setMobileNav(!mobileNav)} className="btn-h" style={{ background: "none", border: "none", color: W, fontSize: 20, cursor: "pointer", padding: "4px 6px", borderRadius: 6 }}>☰</button>
          <div>
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 800, letterSpacing: "-0.3px" }}>ERC Media Hub</div>
            <div style={{ fontSize: 10, opacity: .55, letterSpacing: .3 }}>OTTAWA–GATINEAU PARISH</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 11, opacity: .6, display: "flex", alignItems: "center", gap: 4 }}>
            {saveStatus === "saving" && <><span style={{ width: 7, height: 7, borderRadius: "50%", background: G, display: "inline-block", animation: "pulse 1s infinite" }} />Saving</>}
            {saveStatus === "saved" && <><span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />Saved</>}
            {saveStatus === "error" && <><span style={{ width: 7, height: 7, borderRadius: "50%", background: "#f87171", display: "inline-block" }} />Error</>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: G, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: N }}>{user[0]}</div>
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{user}</div>
              <button onClick={handleSignOut} style={{ background: "none", border: "none", color: G, fontSize: 11, cursor: "pointer", padding: 0, fontFamily: "inherit" }}>sign out</button>
            </div>
          </div>
        </div>
      </header>

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {mobileNav && <div onClick={() => setMobileNav(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 50 }} />}

        {/* Sidebar */}
        <nav className="sidebar" style={{ width: 220, background: "#1a2e44", borderRight: "none", padding: "16px 0 24px", overflowY: "auto", position: mobileNav ? "fixed" : undefined, left: 0, top: mobileNav ? 58 : undefined, bottom: 0, zIndex: mobileNav ? 60 : 1, boxShadow: mobileNav ? "4px 0 24px rgba(0,0,0,0.3)" : "none", flexShrink: 0 }}>
          <div style={{ padding: "0 12px", marginBottom: 4 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: 1.2, textTransform: "uppercase", padding: "0 6px", marginBottom: 6 }}>Navigation</div>
            {navItems.slice(0, 6).map(n => <NavButton key={n.id} n={n} />)}
          </div>
          <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "10px 18px" }} />
          <div style={{ padding: "0 12px", marginBottom: 4 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: 1.2, textTransform: "uppercase", padding: "0 6px", marginBottom: 6 }}>Manage</div>
            {navItems.slice(6).map(n => <NavButton key={n.id} n={n} />)}
          </div>
        </nav>

        {/* Main */}
        <main style={{ flex: 1, padding: "22px 24px", maxWidth: 940, overflowY: "auto", paddingBottom: 70 }}>
          {pages[page] || pages.home}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <div className="mobile-nav" style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: W, borderTop: `1px solid ${BR}`, display: "flex", zIndex: 90, boxShadow: "0 -2px 16px rgba(0,0,0,0.08)" }}>
        {mobileBottomNav.map(n => (
          <button key={n.id} onClick={() => setPage(n.id)}
            style={{ flex: 1, padding: "10px 4px", border: "none", background: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, color: page === n.id ? N : "#bbb", fontFamily: "inherit", position: "relative", transition: "color 0.15s" }}>
            <span style={{ fontSize: 20 }}>{n.icon}</span>
            {n.badge > 0 && <span style={{ position: "absolute", top: 6, right: "20%", background: "#EF4444", color: W, fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 8 }}>{n.badge}</span>}
          </button>
        ))}
      </div>

      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        .btn-h:hover{opacity:.85;transform:translateY(-1px)}
        .btn-h:active{opacity:.75;transform:translateY(0)}
        .card-h:hover{border-color:${G}!important;box-shadow:0 4px 20px rgba(0,0,0,.07)!important;transform:translateY(-1px)}
        .board-card:hover{box-shadow:0 6px 24px rgba(0,0,0,.10)!important;transform:translateY(-2px)}
        input:focus,textarea:focus,select:focus{border-color:${N}!important;outline:none;box-shadow:0 0 0 3px rgba(26,46,68,.08)}
        @media(min-width:720px){.sidebar{display:block!important;position:relative!important}.mobile-nav{display:none!important}}
        @media(max-width:719px){.sidebar{display:${mobileNav ? "block" : "none"}}}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-thumb{background:#ddd;border-radius:3px}
      `}</style>
    </div>
  );
}

// ── ALL ORIGINAL PAGES (unchanged) ────────────────────────────────────────────

function HomePage({db,user,setPage,isReviewer}) {
  const mine = db.submissions.filter(s=>s.submittedBy===user);
  const needsChanges = db.submissions.filter(s=>s.status==="Needs Changes"&&s.submittedBy===user);
  const pendingReview = db.submissions.filter(s=>s.status==="Ready for Review");
  const myReadyToPost = db.submissions.filter(s=>getStage(s)===4&&(s.assignedPoster===user||isReviewer));
  const unreadAnn = (db.announcements||[]).filter(a=>!a.readBy?.includes(user));
  const dueReminders = db.reminders.filter(r=>r.date<=tod()&&!r.done&&(!r.assignedTo||r.assignedTo===user||r.assignedTo==="Whole team"));
  const upcoming = db.events.filter(e=>e.start>=tod()).sort((a,b)=>a.start.localeCompare(b.start)).slice(0,3);
  const myActions = needsChanges.length+(isReviewer?pendingReview.length:0)+myReadyToPost.length+unreadAnn.length+dueReminders.length;

  return (
    <div>
      <PageTitle title={`Hey ${user} 👋`} sub={myActions>0?`You have ${myActions} thing${myActions>1?"s":""} that need your attention`:"You're all caught up — nice work!"}/>
      {unreadAnn.length>0&&(<Card style={{borderLeft:"4px solid #2563EB",background:"#EEF2FF",cursor:"pointer",marginBottom:10}} onClick={()=>setPage("announcements")}><div style={{fontWeight:600,color:"#1D4ED8",fontSize:13,marginBottom:4}}>📢 {unreadAnn.length} unread announcement{unreadAnn.length>1?"s":""}</div><div style={{fontSize:12,color:"#3B82F6"}}>{unreadAnn[0].text.substring(0,100)}{unreadAnn[0].text.length>100?"...":""}</div></Card>)}
      {myReadyToPost.length>0&&(<Card style={{borderLeft:"4px solid #059669",background:"#F0FDF4",marginBottom:10}}><div style={{fontWeight:700,color:"#065F46",fontSize:13,marginBottom:8}}>🚀 {myReadyToPost.length} post{myReadyToPost.length>1?"s":""} ready to go live</div>{myReadyToPost.map(s=>(<div key={s.id} style={{padding:"6px 0",borderBottom:"1px solid #D1FAE5",fontSize:12,color:"#065F46"}}><strong>{s.title}</strong><span style={{color:"#aaa",marginLeft:6}}>{getPlatforms(s).join(", ")}</span>{getCurrentDesign(s)?.url&&<a href={getCurrentDesign(s).url} target="_blank" rel="noreferrer" style={{marginLeft:8,color:"#2563EB",fontSize:11}}>🎨 View design →</a>}</div>))}<Btn variant="success" size="sm" style={{marginTop:10}} onClick={()=>setPage("ready-to-post")}>Post it now →</Btn></Card>)}
      {needsChanges.length>0&&(<Card style={{borderLeft:"4px solid #F59E0B",background:"#FFFBEB",marginBottom:10}}><div style={{fontWeight:700,color:"#92400E",fontSize:13,marginBottom:8}}>🔄 {needsChanges.length} post{needsChanges.length>1?"s":""} need your changes</div>{needsChanges.map(s=>(<div key={s.id} style={{fontSize:12,color:"#78350F",padding:"4px 0",borderBottom:"1px solid #FDE68A"}}><strong>{s.title}</strong>{s.feedback&&<div style={{marginTop:2,padding:"4px 8px",background:"#FEF3C7",borderRadius:6,fontSize:11}}>"{s.feedback}"</div>}</div>))}<Btn variant="warning" size="sm" style={{marginTop:10}} onClick={()=>setPage("review")}>Upload revision →</Btn></Card>)}
      {isReviewer&&pendingReview.length>0&&(<Card style={{borderLeft:"4px solid #6366F1",background:"#EEF2FF",marginBottom:10}}><div style={{fontWeight:700,color:"#4338CA",fontSize:13,marginBottom:6}}>👁 {pendingReview.length} submission{pendingReview.length>1?"s":""} waiting for your review</div>{pendingReview.slice(0,3).map(s=>(<div key={s.id} style={{fontSize:12,color:"#4338CA",padding:"2px 0"}}>· <strong>{s.title}</strong> by {s.submittedBy} {getRevisions(s).length>0?"(design uploaded)":"(concept only)"}</div>))}{pendingReview.length>3&&<div style={{fontSize:11,color:"#818CF8",marginTop:2}}>+{pendingReview.length-3} more</div>}<Btn variant="primary" size="sm" style={{marginTop:10}} onClick={()=>setPage("review")}>Open review queue →</Btn></Card>)}
      {dueReminders.length>0&&(<Card style={{borderLeft:"4px solid #EF4444",background:"#FEF2F2",marginBottom:10}}><div style={{fontWeight:700,color:"#991B1B",fontSize:13,marginBottom:5}}>🔔 {dueReminders.length} overdue reminder{dueReminders.length>1?"s":""}</div>{dueReminders.slice(0,2).map(r=><div key={r.id} style={{fontSize:12,color:"#7F1D1D",padding:"2px 0"}}>• {r.text}</div>)}<Btn size="sm" style={{marginTop:8}} onClick={()=>setPage("reminders")}>View reminders →</Btn></Card>)}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",gap:10,marginBottom:20}}>
        {[{l:"Total posts",v:db.submissions.length,c:N,b:"#EEF2FF",page:"board"},{l:"Published",v:db.submissions.filter(s=>s.status==="Posted").length,c:"#065F46",b:"#D1FAE5",page:"board"},{l:"In progress",v:db.submissions.filter(s=>!["Posted","Rejected"].includes(s.status)).length,c:"#92400E",b:"#FEF9C3",page:"board"},{l:"My posts",v:mine.length,c:"#7C3AED",b:"#F3E8FF",page:"review"}].map(s=>(<div key={s.l} onClick={()=>setPage(s.page)} style={{background:s.b,borderRadius:12,padding:"14px 16px",cursor:"pointer"}} className="card-h"><div style={{fontSize:26,fontWeight:700,color:s.c,lineHeight:1}}>{s.v}</div><div style={{fontSize:11,color:s.c,opacity:.8,fontWeight:500,marginTop:3}}>{s.l}</div></div>))}
      </div>
      <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
        <Btn variant="primary" onClick={()=>setPage("submit")}>💡 New post idea</Btn>
        <Btn variant="gold" onClick={()=>setPage("upload")}>🎨 Upload design</Btn>
        <Btn variant="secondary" onClick={()=>setPage("board")}>📊 See full board</Btn>
      </div>
      {upcoming.length>0&&(<Card><div style={{fontWeight:700,color:N,fontSize:13,marginBottom:10}}>📅 Coming up</div>{upcoming.map((e,i)=>(<div key={e.id} style={{display:"flex",alignItems:"center",gap:12,padding:"6px 0",borderBottom:i<upcoming.length-1?`1px solid ${BR}`:"none"}}><div style={{width:36,height:36,borderRadius:8,background:CAT_COLORS[e.cat]||CAT_COLORS.Other,color:W,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,flexShrink:0,textAlign:"center",lineHeight:1.2}}>{MONTHS_SHORT[+e.start.split("-")[1]-1]}<br/>{e.start.split("-")[2]}</div><div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:500,color:"#333",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{e.name}</div><div style={{fontSize:11,color:"#aaa"}}>{fmtDate(e.start)}</div></div><CatBadge cat={e.cat}/></div>))}</Card>)}
    </div>
  );
}

function BoardPage({db,update,user,isReviewer,setPage}) {
  const [expandedId,setExpandedId] = useState(null);
  const [postLink,setPostLink] = useState("");
  const [markingId,setMarkingId] = useState(null);
  const [search,setSearch] = useState("");
  const [creatorFilter,setCreatorFilter] = useState("All");
  const [platformFilter,setPlatformFilter] = useState("All");
  const creators = [...new Set(db.submissions.map(s=>s.submittedBy))].filter(Boolean);
  const filtered = useMemo(()=>{let subs=db.submissions;if(search.trim())subs=subs.filter(s=>s.title.toLowerCase().includes(search.toLowerCase())||s.submittedBy.toLowerCase().includes(search.toLowerCase()));if(creatorFilter!=="All")subs=subs.filter(s=>s.submittedBy===creatorFilter);if(platformFilter!=="All")subs=subs.filter(s=>getPlatforms(s).includes(platformFilter));return subs;},[db.submissions,search,creatorFilter,platformFilter]);
  const markPosted=(id)=>{update(prev=>({...prev,submissions:prev.submissions.map(s=>s.id===id?{...s,status:"Posted",postedBy:user,postedDate:tod(),postLink:postLink.trim()}:s)}));setMarkingId(null);setPostLink("");};
  const canPost=(s)=>isReviewer||s.assignedPoster===user;

  const PostCard=({s})=>{
    const revs=getRevisions(s);const cur=getCurrentDesign(s);const stage=getStage(s);const isExpanded=expandedId===s.id;const platforms=getPlatforms(s);const isOverdue=s.dueDate&&s.dueDate<tod()&&s.status!=="Posted";const isAssignedToMe=s.assignedPoster===user;
    return(<div onClick={()=>setExpandedId(isExpanded?null:s.id)} className="board-card" style={{background:"#fff",borderRadius:10,border:"1px solid #e8e4de",marginBottom:8,cursor:"pointer",overflow:"hidden",transition:"all 0.2s",boxShadow:isExpanded?"0 8px 30px rgba(0,0,0,0.10)":"0 1px 3px rgba(0,0,0,0.04)"}}>
      <div style={{height:3,background:stage===5?"#059669":stage===4?"#10B981":stage===3?"#6366F1":stage===2?"#F59E0B":"#94A3B8",borderRadius:"10px 10px 0 0",marginTop:-1}}/>
      <div style={{padding:"10px 12px 10px"}}>
        <div style={{fontSize:12.5,fontWeight:600,color:"#1a1a2e",marginBottom:6,lineHeight:1.35}}>{s.title}</div>
        <div style={{display:"flex",alignItems:"center",gap:4,flexWrap:"wrap"}}>
          <div style={{display:"flex",gap:2,flexShrink:0}}>{platforms.slice(0,3).map(p=><PlatformDot key={p} platform={p}/>)}{platforms.length>3&&<span style={{fontSize:9,color:"#94A3B8",fontWeight:600}}>+{platforms.length-3}</span>}</div>
          <span style={{fontSize:10,color:"#94A3B8",flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.submittedBy}</span>
          {revs.length>0&&<span style={{fontSize:9,fontWeight:700,color:"#7C3AED",background:"#F3E8FF",padding:"2px 6px",borderRadius:6,flexShrink:0}}>v{revs.length}</span>}
          {isOverdue&&<span style={{fontSize:9,fontWeight:700,color:"#fff",background:"#EF4444",padding:"2px 6px",borderRadius:6,flexShrink:0}}>OVERDUE</span>}
          {isAssignedToMe&&stage===4&&<span style={{fontSize:9,fontWeight:700,color:"#065F46",background:"#D1FAE5",padding:"2px 6px",borderRadius:6,flexShrink:0}}>YOU POST</span>}
        </div>
      </div>
      {isExpanded&&(<div style={{borderTop:"1px solid #f0ede8",padding:"12px 14px",background:"#faf9f7"}} onClick={e=>e.stopPropagation()}>
        {s.caption&&<div style={{fontSize:11.5,color:"#555",fontStyle:"italic",marginBottom:10,lineHeight:1.6,padding:"7px 10px",background:"#fff",borderRadius:8,border:"1px solid #e8e4de"}}>"{s.caption.substring(0,160)}{s.caption.length>160?"...":""}"</div>}
        {cur&&<a href={cur.url} target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:6,fontSize:11.5,color:"#2563EB",background:"#EEF2FF",padding:"5px 12px",borderRadius:8,fontWeight:600,marginBottom:10,textDecoration:"none",border:"1px solid #C7D2FE"}}>🎨 Open design (v{revs.length}) →</a>}
        {s.feedback&&<div style={{fontSize:11.5,color:"#92400E",background:"#FEF9C3",padding:"7px 10px",borderRadius:8,marginBottom:10,border:"1px solid #FCD34D"}}>💬 <strong>Feedback:</strong> {s.feedback}</div>}
        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>{platforms.map(p=>(<span key={p} style={{display:"inline-flex",alignItems:"center",gap:3,fontSize:10,background:"#f0edea",padding:"3px 8px",borderRadius:8,color:"#555",fontWeight:500}}><PlatformDot platform={p}/>{p}</span>))}</div>
        <div style={{fontSize:10,color:"#aaa",marginBottom:12,lineHeight:1.7}}><span>{s.contentType}</span> · <span>by {s.submittedBy}</span> · <span>submitted {fmtDate(s.submittedDate)}</span>{s.reviewedBy&&<span> · reviewed by {s.reviewedBy} {fmtDate(s.reviewDate)}</span>}{s.dueDate&&<span style={{color:isOverdue?"#EF4444":"inherit"}}> · due {fmtDate(s.dueDate)}</span>}</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {stage===4&&canPost(s)&&(markingId===s.id?<div style={{width:"100%"}}><Label>Live post link <span style={{fontWeight:400,color:"#bbb"}}>(optional)</span></Label><div style={{display:"flex",gap:6,flexWrap:"wrap"}}><Input placeholder="https://instagram.com/p/..." value={postLink} onChange={e=>setPostLink(e.target.value)} style={{flex:1,minWidth:150}}/><Btn variant="success" size="sm" onClick={()=>markPosted(s.id)}>🚀 Mark posted</Btn><Btn variant="secondary" size="sm" onClick={()=>{setMarkingId(null);setPostLink("");}}>Cancel</Btn></div></div>:<Btn variant="success" size="sm" onClick={()=>setMarkingId(s.id)}>🚀 Mark as posted</Btn>)}
          {stage===4&&canPost(s)&&<Btn variant="gold" size="sm" onClick={()=>setPage("ready-to-post")}>📋 Guided flow →</Btn>}
          {stage===3&&isReviewer&&<Btn variant="primary" size="sm" onClick={()=>setPage("review")}>👁 Review this →</Btn>}
          {stage===2&&s.submittedBy===user&&<Btn variant="gold" size="sm" onClick={()=>setPage("upload")}>🎨 Upload design →</Btn>}
          {stage===1&&isReviewer&&<Btn variant="primary" size="sm" onClick={()=>setPage("review")}>👁 Review concept →</Btn>}
          {stage===5&&s.postLink&&<a href={s.postLink} target="_blank" rel="noreferrer" style={{fontSize:11,color:"#059669",fontWeight:600,padding:"4px 0",textDecoration:"none"}}>🔗 View live post →</a>}
        </div>
      </div>)}
    </div>);
  };

  const rejected=filtered.filter(s=>s.status==="Rejected");
  const totalActive=filtered.filter(s=>s.status!=="Rejected").length;
  return(
    <div>
      <div style={{marginBottom:18}}><h1 style={{fontFamily:"'Fraunces',serif",fontSize:22,fontWeight:800,color:N,margin:"0 0 2px",letterSpacing:"-0.3px"}}>Content Pipeline</h1><p style={{fontSize:13,color:"#94A3B8",margin:0}}>{totalActive} active post{totalActive!==1?"s":""} across {[1,2,3,4,5].filter(st=>filtered.some(s=>getStage(s)===st)).length} stages</p></div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:18,alignItems:"center"}}>
        <div style={{position:"relative",flex:"1 1 200px",minWidth:160}}><span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"#bbb",fontSize:14,pointerEvents:"none"}}>🔍</span><input placeholder="Search by title or creator..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:"100%",paddingLeft:32,paddingRight:12,height:38,border:`1.5px solid ${BR}`,borderRadius:9,fontSize:13,fontFamily:"inherit",background:W,boxSizing:"border-box",color:"#333",outline:"none"}}/></div>
        <select value={creatorFilter} onChange={e=>setCreatorFilter(e.target.value)} style={{height:38,border:`1.5px solid ${BR}`,borderRadius:9,fontSize:12,fontFamily:"inherit",background:W,padding:"0 10px",color:"#555",cursor:"pointer",minWidth:120}}><option value="All">All creators</option>{creators.map(c=><option key={c} value={c}>{c}</option>)}</select>
        <select value={platformFilter} onChange={e=>setPlatformFilter(e.target.value)} style={{height:38,border:`1.5px solid ${BR}`,borderRadius:9,fontSize:12,fontFamily:"inherit",background:W,padding:"0 10px",color:"#555",cursor:"pointer",minWidth:130}}><option value="All">All platforms</option>{PLATFORMS.map(p=><option key={p} value={p}>{p}</option>)}</select>
      </div>
      <div style={{overflowX:"auto",paddingBottom:16,marginLeft:-4,marginRight:-4}}>
        <div style={{display:"flex",gap:12,padding:"4px 4px 4px",minWidth:900}}>
          {[1,2,3,4,5].map(stageNum=>{const cfg=STAGE_CONFIG[stageNum];const posts=filtered.filter(s=>getStage(s)===stageNum);const hasUrgent=posts.some(s=>s.dueDate&&s.dueDate<tod());return(<div key={stageNum} style={{flex:"1 1 0",minWidth:200,maxWidth:280}}><div style={{borderRadius:10,padding:"11px 13px 10px",marginBottom:8,background:cfg.bg,border:`1.5px solid ${cfg.border}20`,boxShadow:`0 1px 0 ${cfg.border}30`}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:2}}><div style={{fontWeight:700,fontSize:12.5,color:cfg.fg}}>{cfg.label}</div><div style={{fontSize:11,fontWeight:700,color:posts.length>0?cfg.fg:"#CBD5E1",background:posts.length>0?cfg.border+"25":"transparent",padding:"2px 8px",borderRadius:20,minWidth:24,textAlign:"center"}}>{posts.length}</div></div><div style={{fontSize:10,color:cfg.fg,opacity:.6,lineHeight:1.3}}>{cfg.desc}</div>{hasUrgent&&<div style={{fontSize:9,fontWeight:700,color:"#EF4444",marginTop:4}}>⚠ Overdue items</div>}</div><div style={{minHeight:100}}>{posts.length===0?<div style={{textAlign:"center",padding:"24px 8px",color:"#CBD5E1",fontSize:11,border:"1.5px dashed #E2E8F0",borderRadius:10}}>Nothing here</div>:posts.sort((a,b)=>(a.dueDate||a.submittedDate).localeCompare(b.dueDate||b.submittedDate)).map(s=><PostCard key={s.id} s={s}/>)}</div></div>);})}
        </div>
      </div>
      {rejected.length>0&&(<details style={{marginTop:8}}><summary style={{cursor:"pointer",fontSize:12,color:"#94A3B8",fontWeight:600,padding:"8px 0",userSelect:"none",listStyle:"none"}}><span>✕ Rejected posts ({rejected.length}) — click to expand</span></summary><div style={{marginTop:8,display:"flex",flexDirection:"column",gap:6}}>{rejected.map(s=>(<div key={s.id} style={{background:W,border:`1px solid ${BR}`,borderRadius:9,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,opacity:.55,flexWrap:"wrap"}}><div><div style={{fontSize:13,fontWeight:600,color:"#555"}}>{s.title}</div><div style={{fontSize:11,color:"#aaa",marginTop:2}}>by {s.submittedBy} · {fmtDate(s.submittedDate)}{s.feedback&&` · "${s.feedback}"`}</div></div><Badge status="Rejected"/></div>))}</div></details>)}
    </div>
  );
}

function SubmitPage({db,update,user,setPage}) {
  const [step,setStep] = useState(1);
  const [f,setF] = useState({title:"",description:"",caption:"",platforms:[],contentType:"",event:"",dueDate:""});
  const [done,setDone] = useState(false);
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  const EMPTY_F={title:"",description:"",caption:"",platforms:[],contentType:"",event:"",dueDate:""};
  const canNext=step===1?f.title.trim().length>0:step===2?f.platforms.length>0&&!!f.contentType:true;
  const submit=()=>{const sub={id:db.nextId,title:f.title.trim(),description:f.description.trim(),caption:f.caption.trim(),platforms:f.platforms,platform:f.platforms[0]||"",contentType:f.contentType,event:f.event,dueDate:f.dueDate,submittedBy:user,submittedDate:tod(),status:"Ready for Review",reviewedBy:"",reviewDate:"",feedback:"",postedBy:"",postedDate:"",postLink:"",revisions:[],fileLinks:[]};update(prev=>({...prev,submissions:[...prev.submissions,sub],nextId:prev.nextId+1}));setDone(true);};
  if(done)return(<div style={{textAlign:"center",padding:"48px 20px"}}><div style={{fontSize:52,marginBottom:10}}>🎉</div><PageTitle title="Idea submitted!" sub={`"${f.title}" is now in the review queue.`}/><div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}><Btn variant="primary" onClick={()=>{setStep(1);setF(EMPTY_F);setDone(false);}}>Submit another idea</Btn><Btn variant="gold" onClick={()=>setPage("upload")}>🎨 Upload design now</Btn><Btn variant="secondary" onClick={()=>setPage("home")}>Go home</Btn></div></div>);
  const stepLabels=["Concept & caption","Platforms & type","Event & deadline"];
  return(<div><PageTitle title="💡 Submit a new post idea" sub={`Step ${step} of 3 — ${stepLabels[step-1]}`}/><div style={{display:"flex",gap:5,marginBottom:18}}>{[1,2,3].map(s=><div key={s} style={{flex:1,height:4,borderRadius:2,background:s<=step?G:BR,transition:"all 0.3s"}}/>)}</div><Card>{step===1&&(<div><h3 style={{margin:"0 0 3px",color:N,fontSize:16,fontWeight:600}}>What's the concept?</h3><p style={{color:"#aaa",fontSize:13,margin:"0 0 18px"}}>Describe the post clearly.</p><Label>Post title *</Label><Input placeholder='e.g. "Easter Sunday Invitation Flyer"' value={f.title} onChange={e=>set("title",e.target.value)} style={{marginBottom:14}}/><Label>Description</Label><Textarea placeholder="What is this post about?" value={f.description} onChange={e=>set("description",e.target.value)} style={{minHeight:65,marginBottom:14}}/><Label>Suggested caption</Label><Textarea placeholder="Write the full caption here, including hashtags..." value={f.caption} onChange={e=>set("caption",e.target.value)} style={{minHeight:100}}/></div>)}{step===2&&(<div><h3 style={{margin:"0 0 3px",color:N,fontSize:16,fontWeight:600}}>Where is this going?</h3><p style={{color:"#aaa",fontSize:13,margin:"0 0 14px"}}>Select all platforms this post will appear on.</p><Label>Platforms * ({f.platforms.length} selected)</Label><div style={{marginBottom:14}}><MultiPillSelect options={PLATFORMS} values={f.platforms} onChange={v=>set("platforms",v)} colorMap={PLATFORM_COLORS}/></div><Label>Content type *</Label><PillSelect options={CONTENT_TYPES} value={f.contentType} onChange={v=>set("contentType",v)}/></div>)}{step===3&&(<div><h3 style={{margin:"0 0 3px",color:N,fontSize:16,fontWeight:600}}>Final details</h3><Label>Church event</Label><Select value={f.event} onChange={e=>set("event",e.target.value)} style={{marginBottom:14}}><option value="">— Not linked to an event —</option>{db.events.sort((a,b)=>a.start.localeCompare(b.start)).map(e=><option key={e.id} value={e.name}>{e.name} ({fmtDate(e.start)})</option>)}</Select><Label>Posting deadline</Label><Input type="date" value={f.dueDate} onChange={e=>set("dueDate",e.target.value)}/></div>)}<div style={{display:"flex",justifyContent:"space-between",marginTop:22}}>{step>1?<Btn variant="secondary" onClick={()=>setStep(s=>s-1)}>← Back</Btn>:<div/>}{step<3?<Btn variant="primary" disabled={!canNext} onClick={()=>setStep(s=>s+1)} style={{opacity:canNext?1:.4}}>Next →</Btn>:<Btn variant="success" onClick={submit}>✅ Submit for review</Btn>}</div></Card></div>);
}

function ReviewPage({db,update,user,isReviewer,setPage}) {
  const [feedback,setFeedback] = useState({});
  const [assignedPoster,setAssignedPoster] = useState({});
  const [revising,setRevising] = useState({});
  const pending=db.submissions.filter(s=>s.status==="Ready for Review");
  const mySubmissions=db.submissions.filter(s=>s.submittedBy===user).slice().reverse();
  const posterCandidates=(db.members||[]).filter(m=>m.active&&(m.type==="lead"||m.type==="approver")).map(m=>m.name);
  const act=(id,status)=>{const sub=db.submissions.find(s=>s.id===id);const revs=getRevisions(sub);const isDesignApproval=status==="Approved"&&revs.length>0;update(prev=>({...prev,submissions:prev.submissions.map(s=>s.id===id?{...s,status,reviewedBy:user,reviewDate:tod(),feedback:feedback[id]||s.feedback||"",...(isDesignApproval?{assignedPoster:assignedPoster[id]||user}:{})}:s)}));setFeedback(p=>{const n={...p};delete n[id];return n;});setAssignedPoster(p=>{const n={...p};delete n[id];return n;});};
  const submitRevision=(id)=>{const rev=revising[id];if(!rev?.url?.trim())return;const revEntry={version:(getRevisions(db.submissions.find(s=>s.id===id)).length)+1,url:rev.url.trim(),linkType:rev.linkType||"Link",note:rev.note?.trim()||"",uploadedBy:user,uploadedDate:tod(),isRevision:true};update(prev=>({...prev,submissions:prev.submissions.map(s=>s.id===id?{...s,status:"Ready for Review",revisions:[...(s.revisions||[]),revEntry],reviewedBy:"",reviewDate:""}:s)}));setRevising(p=>{const n={...p};delete n[id];return n;});};

  if(!isReviewer)return(<div><PageTitle title="My submissions" sub="Track everything you've submitted"/>{mySubmissions.length===0?<EmptyState icon="📭" text="Nothing submitted yet."/>:mySubmissions.map(s=>{const revs=getRevisions(s);const cur=getCurrentDesign(s);const isNC=s.status==="Needs Changes";const isApproved=s.status==="Approved";const rev=revising[s.id]||{};return(<Card key={s.id} hover style={{borderLeft:isNC?"4px solid #F59E0B":s.status==="Posted"?"4px solid #059669":"none"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"start",gap:10,flexWrap:"wrap",marginBottom:10}}><div style={{flex:1,minWidth:0}}><div style={{fontSize:15,fontWeight:700,color:"#222"}}>{s.title}</div><div style={{fontSize:12,color:"#aaa",marginTop:3}}>{getPlatforms(s).join(", ")} · {s.contentType} · {fmtDate(s.submittedDate)}</div>{s.caption&&<div style={{marginTop:6,padding:"6px 10px",background:"#f8f7f5",borderRadius:7,border:`1px solid ${BR}`,fontSize:12,color:"#555",fontStyle:"italic"}}>"{s.caption.substring(0,140)}{s.caption.length>140?"...":""}"</div>}</div><Badge status={s.status}/></div>{revs.length>0&&<div style={{margin:"8px 0",padding:"8px 12px",background:"#F3E8FF",borderRadius:9,border:"1px solid #E9D5FF"}}><div style={{fontSize:11,fontWeight:700,color:"#7C3AED",marginBottom:6}}>🎨 Design versions</div>{revs.map((rv,idx)=>(<div key={idx} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 0",borderBottom:idx<revs.length-1?"1px solid #EDE9FE":"none",flexWrap:"wrap"}}><span style={{fontSize:11,fontWeight:700,color:"#7C3AED"}}>v{idx+1}</span>{rv.isRevision&&<span style={{fontSize:10,background:"#FED7AA",color:"#92400E",padding:"1px 6px",borderRadius:8,fontWeight:600}}>REVISED</span>}<a href={rv.url} target="_blank" rel="noreferrer" style={{fontSize:12,color:"#2563EB",flex:1}}>{rv.url.length>40?rv.url.substring(0,40)+"...":rv.url}</a><span style={{fontSize:11,color:"#aaa"}}>{fmtDate(rv.uploadedDate)}</span></div>))}</div>}{isNC&&s.feedback&&<div style={{margin:"8px 0",padding:"12px 14px",background:"#FEF9C3",borderRadius:9,borderLeft:"4px solid #F59E0B"}}><div style={{fontSize:11,fontWeight:700,color:"#92400E",marginBottom:4}}>🔄 Feedback from {s.reviewedBy||"reviewer"}</div><div style={{fontSize:13,color:"#78350F",lineHeight:1.6}}>{s.feedback}</div></div>}{(isNC||(isApproved&&revs.length===0))&&<div style={{marginTop:12,padding:"14px 16px",background:isNC?"#FFFBEB":"#F0FDF4",borderRadius:10,border:`2px dashed ${isNC?"#FCD34D":"#86EFAC"}`}}><div style={{fontWeight:700,color:isNC?"#92400E":"#166534",fontSize:13,marginBottom:10}}>{isNC?`🔄 Upload revised design (v${revs.length+1})`:"🎨 Upload your design"}</div><Label>File location</Label><div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>{["Google Drive","Canva","YouTube","Dropbox","WeTransfer","Other"].map(t=>(<button key={t} onClick={()=>setRevising(p=>({...p,[s.id]:{...rev,linkType:t}}))} style={{padding:"5px 11px",borderRadius:8,fontSize:12,cursor:"pointer",fontFamily:"inherit",border:rev.linkType===t?`2px solid ${N}`:"2px solid #e8e5df",background:rev.linkType===t?"#eef1f5":"#fff",color:rev.linkType===t?N:"#777",fontWeight:rev.linkType===t?600:400}}>{t}</button>))}</div><Label>{rev.linkType||"Design"} link *</Label><Input placeholder="https://..." value={rev.url||""} onChange={e=>setRevising(p=>({...p,[s.id]:{...rev,url:e.target.value}}))} style={{marginBottom:10}}/>{isNC&&<><Label>What changed?</Label><Textarea placeholder="Describe what you changed..." value={rev.note||""} onChange={e=>setRevising(p=>({...p,[s.id]:{...rev,note:e.target.value}}))} style={{minHeight:60,marginBottom:10}}/></>}<Btn variant={isNC?"warning":"success"} disabled={!rev.url?.trim()} onClick={()=>submitRevision(s.id)} style={{opacity:rev.url?.trim()?1:.4}}>{isNC?`🔄 Submit revision v${revs.length+1}`:"📎 Submit design for review"}</Btn></div>}</Card>);})}</div>);

  return(<div><PageTitle title="👁 Review queue" sub={`${pending.length} item${pending.length!==1?"s":""} waiting`}/>{pending.length===0?<EmptyState icon="✨" text="Nothing to review right now!"/>:pending.map(s=>{const revs=getRevisions(s);const cur=getCurrentDesign(s);const isRevision=revs.some(r=>r.isRevision);return(<Card key={s.id} hover style={{borderLeft:isRevision?"4px solid #F59E0B":"none"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"start",flexWrap:"wrap",gap:8,marginBottom:12}}><div style={{flex:1,minWidth:0}}>{isRevision&&<div style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:11,fontWeight:700,color:"#92400E",background:"#FEF9C3",padding:"3px 10px",borderRadius:9,marginBottom:8}}>🔄 Revision v{revs.length}</div>}<div style={{fontSize:16,fontWeight:700,color:"#222"}}>{s.title}</div><div style={{fontSize:12,color:"#aaa",marginTop:3}}>By <strong style={{color:"#666"}}>{s.submittedBy}</strong> · {getPlatforms(s).join(", ")} · {s.contentType}</div>{s.caption&&<div style={{marginTop:8,padding:"8px 12px",background:"#faf9f7",borderRadius:8,border:`1px solid ${BR}`}}><div style={{fontSize:10,fontWeight:700,color:"#999",textTransform:"uppercase",letterSpacing:.3,marginBottom:3}}>📝 Caption</div><div style={{fontSize:13,color:"#444",lineHeight:1.6,whiteSpace:"pre-wrap"}}>{s.caption}</div></div>}{revs.length>0&&<div style={{marginTop:8,padding:"10px 12px",background:"#F0FDF4",borderRadius:9,border:"1px solid #86EFAC"}}><div style={{fontSize:11,fontWeight:700,color:"#166534",marginBottom:6}}>🎨 Design files ({revs.length} version{revs.length!==1?"s":""})</div>{revs.map((rv,idx)=>(<div key={idx} style={{display:"flex",alignItems:"start",gap:8,padding:"5px 0",borderBottom:idx<revs.length-1?"1px solid #D1FAE5":"none",flexWrap:"wrap"}}><span style={{fontSize:11,fontWeight:700,color:rv.isRevision?"#F59E0B":"#059669",flexShrink:0,marginTop:1}}>v{idx+1}</span>{rv.isRevision&&<span style={{fontSize:10,background:"#FEF9C3",color:"#92400E",padding:"1px 6px",borderRadius:8,fontWeight:600}}>REVISED</span>}<div style={{flex:1,minWidth:0}}><a href={rv.url} target="_blank" rel="noreferrer" style={{fontSize:13,color:"#2563EB",fontWeight:600,display:"block"}}>🔗 View {rv.linkType||"Design"} (v{idx+1}) →</a>{rv.note&&<div style={{fontSize:12,color:"#555",marginTop:3,fontStyle:"italic"}}>"{rv.note}"</div>}<div style={{fontSize:11,color:"#aaa",marginTop:2}}>by {rv.uploadedBy} · {fmtDate(rv.uploadedDate)}</div></div></div>))}</div>}{revs.length===0&&<div style={{marginTop:8,padding:"8px 12px",background:"#FEF9C3",borderRadius:8,fontSize:12,color:"#92400E"}}>⚠️ No design uploaded yet — reviewing concept only.</div>}</div><Badge status={s.status}/></div><div style={{marginBottom:10}}><Label>Feedback for {s.submittedBy}</Label><Textarea placeholder="Be specific — what exactly needs to change?" value={feedback[s.id]||""} onChange={e=>setFeedback(p=>({...p,[s.id]:e.target.value}))} style={{minHeight:60}}/></div>{revs.length>0&&<div style={{marginBottom:12,padding:"10px 14px",background:"#F0FDF4",borderRadius:9,border:"1px solid #86EFAC"}}><div style={{fontSize:12,fontWeight:700,color:"#166534",marginBottom:6}}>📣 Who will post this?</div><Select value={assignedPoster[s.id]||""} onChange={e=>setAssignedPoster(p=>({...p,[s.id]:e.target.value}))}><option value="">— Assign poster (default: you) —</option>{posterCandidates.map(n=><option key={n} value={n}>{n}</option>)}</Select></div>}<div style={{display:"flex",gap:8,flexWrap:"wrap"}}><Btn variant="success" onClick={()=>act(s.id,"Approved")}>✅ Approve</Btn><Btn variant="warning" onClick={()=>act(s.id,"Needs Changes")}>🔄 Needs changes</Btn><Btn variant="danger" onClick={()=>act(s.id,"Rejected")}>✕ Reject</Btn></div></Card>);})}</div>);
}

function UploadPage({db,update,user,setPage,preselectedId}) {
  const [selectedId,setSelectedId] = useState(preselectedId||"");
  const [linkType,setLinkType] = useState("");
  const [link,setLink] = useState("");
  const [note,setNote] = useState("");
  const [done,setDone] = useState(false);
  const uploadable=db.submissions.filter(s=>s.submittedBy===user&&["Approved","Needs Changes","Ready for Review"].includes(s.status));
  const selected=uploadable.find(s=>s.id===+selectedId);
  const existingRevs=selected?getRevisions(selected):[];
  const isRevision=existingRevs.length>0;
  const newVersion=existingRevs.length+1;
  const handleUpload=()=>{if(!selectedId||!link.trim())return;const revEntry={version:newVersion,url:link.trim(),linkType:linkType||"Link",note:note.trim(),uploadedBy:user,uploadedDate:tod(),isRevision};const newStatus=selected?.status==="Needs Changes"?"Ready for Review":selected?.status;update(prev=>({...prev,submissions:prev.submissions.map(s=>s.id===+selectedId?{...s,revisions:[...(s.revisions||[]),revEntry],status:newStatus,...(selected?.status==="Needs Changes"?{reviewedBy:"",reviewDate:""}:{})}:s)}));setDone(true);};
  const reset=()=>{setSelectedId("");setLinkType("");setLink("");setNote("");setDone(false);};
  if(done)return(<div style={{textAlign:"center",padding:"48px 20px"}}><div style={{fontSize:52,marginBottom:10}}>{isRevision?"🔄":"🎨"}</div><PageTitle title={isRevision?"Revision submitted!":"Design uploaded!"} sub={isRevision?`Version ${newVersion} submitted. Back in review queue.`:`Design attached to "${selected?.title||"the post"}".`}/><div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}><Btn variant="primary" onClick={reset}>Upload another</Btn><Btn variant="secondary" onClick={()=>setPage("review")}>View my submissions</Btn><Btn variant="secondary" onClick={()=>setPage("home")}>Go home</Btn></div></div>);
  return(<div><PageTitle title="🎨 Upload design" sub="Attach your design file link to a post"/><Card style={{marginBottom:12}}><h3 style={{margin:"0 0 12px",color:N,fontSize:15,fontWeight:600}}>Which post is this for?</h3>{uploadable.length===0?<div style={{color:"#999",fontSize:13,padding:"10px",background:"#f9f8f6",borderRadius:8}}>No posts need a design right now.</div>:<Select value={selectedId} onChange={e=>setSelectedId(e.target.value)}><option value="">— Select a post —</option>{uploadable.map(s=>{const revs=getRevisions(s);return<option key={s.id} value={s.id}>{s.title} ({s.status}){revs.length>0?` · ${revs.length} design${revs.length>1?"s":""} uploaded`:" · no design yet"}</option>;})}</Select>}</Card>{selected&&(<><Card style={{borderLeft:`4px solid ${isRevision?"#F59E0B":"#059669"}`,marginBottom:12}}><div style={{fontWeight:700,color:"#222",marginBottom:4}}>{selected.title}</div>{selected.feedback&&selected.status==="Needs Changes"&&<div style={{padding:"8px 12px",background:"#FEE2E2",borderRadius:8,fontSize:12,color:"#991B1B"}}><strong>Reviewer feedback:</strong> {selected.feedback}</div>}</Card><Card><h3 style={{margin:"0 0 12px",color:N,fontSize:15,fontWeight:600}}>{isRevision?`Upload revised design (v${newVersion})`:"Upload your design"}</h3><Label>File location</Label><div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>{["Google Drive","Canva","YouTube","Dropbox","WeTransfer","Other"].map(t=>(<button key={t} onClick={()=>setLinkType(t)} style={{padding:"7px 13px",borderRadius:9,fontSize:12,cursor:"pointer",fontFamily:"inherit",border:linkType===t?`2px solid ${N}`:"2px solid #e8e5df",background:linkType===t?"#eef1f5":"#fff",color:linkType===t?N:"#777",fontWeight:linkType===t?600:400}}>{t}</button>))}</div><Label>{linkType||"Design"} link *</Label><Input placeholder="Paste the direct link here" value={link} onChange={e=>setLink(e.target.value)} style={{marginBottom:12}}/>{isRevision&&<><Label>What did you change?</Label><Textarea placeholder="Describe the changes..." value={note} onChange={e=>setNote(e.target.value)} style={{minHeight:70,marginBottom:12}}/></>}<Btn variant={isRevision?"warning":"success"} disabled={!link.trim()} onClick={handleUpload} style={{opacity:link.trim()?1:.4}}>{isRevision?`🔄 Submit revision v${newVersion}`:"📎 Upload design for review"}</Btn></Card></>)}</div>);
}

function SocialCalendarPage({db, update, user}) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState(null);
  const [platformFilter, setPlatformFilter] = useState("All");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPost, setNewPost] = useState({title:"", platform:"", contentType:"", dueDate:""});

  const totalDays = daysInMonth(year, month);
  const firstDay = firstDayOfMonth(year, month);
  const today = tod();

  const postsForDay = (d) => {
    const dateStr = padDate(year, month, d);
    return db.submissions.filter(s => {
      const date = s.dueDate || s.postedDate;
      if (!date) return false;
      const match = date === dateStr;
      if (platformFilter !== "All") return match && s.platform === platformFilter;
      return match;
    });
  };

  const addQuickPost = () => {
    if (!newPost.title.trim() || !newPost.platform) return;
    const sub = {
      id: db.nextId, title: newPost.title, description: "", platform: newPost.platform,
      contentType: newPost.contentType || "Image/Graphic", event: "",
      dueDate: newPost.dueDate || padDate(year, month, selectedDay),
      submittedBy: user, submittedDate: today, status: "Draft",
      reviewedBy: "", reviewDate: "", feedback: "",
      postedBy: "", postedDate: "", postLink: "", fileLinks: []
    };
    update(prev => ({...prev, submissions: [...prev.submissions, sub], nextId: prev.nextId + 1}));
    setNewPost({title:"", platform:"", contentType:"", dueDate:""});
    setShowAddForm(false);
  };

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
    setSelectedDay(null);
  };

  const selectedPosts = selectedDay ? postsForDay(selectedDay) : [];
  const selectedDateStr = selectedDay ? padDate(year, month, selectedDay) : "";
  const totalThisMonth = db.submissions.filter(s => {
    const d = s.dueDate || s.postedDate;
    if (!d) return false;
    const [y, m] = d.split("-");
    return +y === year && +m - 1 === month;
  });

  const calendarDayCells = Array.from({length: totalDays}, (_, i) => {
    const d = i + 1;
    const dateStr = padDate(year, month, d);
    const dayPosts = postsForDay(d);
    const isToday = dateStr === today;
    const isSel = selectedDay === d;
    const hasEvents = db.events.some(e => e.start <= dateStr && e.end >= dateStr);
    return (
      <div key={d}
        onClick={() => setSelectedDay(isSel ? null : d)}
        className="cell-h"
        style={{minHeight:72, padding:"6px 5px", borderRight:`1px solid ${BR}`, borderBottom:`1px solid ${BR}`, cursor:"pointer", background:isSel?"#EEF2FF":W, transition:"background 0.15s", position:"relative"}}
      >
        <div style={{fontSize:12, fontWeight:isToday?700:400, color:isToday?W:"#555", width:22, height:22, borderRadius:"50%", background:isToday?N:"transparent", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:3}}>
          {d}
        </div>
        {hasEvents && <div style={{width:4, height:4, borderRadius:"50%", background:G, marginBottom:2}} />}
        <div style={{display:"flex", flexWrap:"wrap", gap:2}}>
          {dayPosts.slice(0, 3).map((p, idx) => (
            <div key={idx} title={p.title} style={{width:"100%", padding:"1px 4px", borderRadius:3, background:(PLATFORM_COLORS[p.platform]||"#999")+"22", borderLeft:`2px solid ${PLATFORM_COLORS[p.platform]||"#999"}`, fontSize:9, color:"#333", overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis"}}>
              {p.title}
            </div>
          ))}
          {dayPosts.length > 3 && <div style={{fontSize:9, color:"#aaa", fontWeight:600}}>+{dayPosts.length - 3}</div>}
        </div>
      </div>
    );
  });

  return (
    <div>
      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, flexWrap:"wrap", gap:10}}>
        <PageTitle title="🗓 Content Calendar" sub={`${MONTHS[month]} ${year} · ${totalThisMonth.length} post${totalThisMonth.length!==1?"s":""} planned`} />
        <Btn variant="gold" size="sm" onClick={() => exportCalendarExcel(db, year, month)}>⬇ Export month</Btn>
      </div>

      <div style={{display:"flex", gap:5, marginBottom:14, flexWrap:"wrap"}}>
        {["All", ...PLATFORMS].map(p => (
          <button key={p} onClick={() => setPlatformFilter(p)} className="btn-h"
            style={{padding:"4px 11px", borderRadius:7, fontSize:11, fontWeight:500, cursor:"pointer", fontFamily:"inherit",
              border: platformFilter===p ? `2px solid ${PLATFORM_COLORS[p]||N}` : `1.5px solid ${BR}`,
              background: platformFilter===p ? (PLATFORM_COLORS[p]||N)+"18" : W,
              color: platformFilter===p ? (PLATFORM_COLORS[p]||N) : "#aaa", transition:"all 0.15s"}}>
            {p !== "All" && <PlatformDot platform={p} />}{p}
          </button>
        ))}
      </div>

      <div style={{display:"flex", alignItems:"center", gap:12, marginBottom:12}}>
        <Btn variant="secondary" size="sm" onClick={prevMonth}>←</Btn>
        <span style={{fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:700, color:N, minWidth:160, textAlign:"center"}}>{MONTHS[month]} {year}</span>
        <Btn variant="secondary" size="sm" onClick={nextMonth}>→</Btn>
      </div>

      <div style={{background:W, borderRadius:14, border:`1px solid ${BR}`, overflow:"hidden", marginBottom:16}}>
        <div style={{display:"grid", gridTemplateColumns:"repeat(7,1fr)", background:"#f8f7f5", borderBottom:`1px solid ${BR}`}}>
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
            <div key={d} style={{padding:"8px 4px", textAlign:"center", fontSize:11, fontWeight:700, color:"#999", textTransform:"uppercase", letterSpacing:.5}}>{d}</div>
          ))}
        </div>
        <div style={{display:"grid", gridTemplateColumns:"repeat(7,1fr)"}}>
          {Array.from({length: firstDay}, (_, i) => (
            <div key={`e${i}`} style={{minHeight:72, borderRight:`1px solid ${BR}`, borderBottom:`1px solid ${BR}`, background:"#fafaf9"}} />
          ))}
          {calendarDayCells}
        </div>
      </div>

      {selectedDay && (
        <Card style={{borderLeft:`4px solid ${N}`}}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}>
            <div style={{fontWeight:700, color:N, fontSize:15}}>{fmtDate(selectedDateStr)}</div>
            <Btn variant="gold" size="sm" onClick={() => setShowAddForm(!showAddForm)}>{showAddForm ? "Cancel" : "＋ Add post"}</Btn>
          </div>
          {showAddForm && (
            <div style={{padding:"14px", background:"#f8f7f5", borderRadius:10, marginBottom:14, border:`1px solid ${BR}`}}>
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10}}>
                <div style={{gridColumn:"1/-1"}}>
                  <Label>Post title</Label>
                  <Input placeholder="What are you creating?" value={newPost.title} onChange={e => setNewPost(p => ({...p, title:e.target.value}))} />
                </div>
                <div>
                  <Label>Platform</Label>
                  <Select value={newPost.platform} onChange={e => setNewPost(p => ({...p, platform:e.target.value}))}>
                    <option value="">Select...</option>
                    {PLATFORMS.map(pl => <option key={pl} value={pl}>{pl}</option>)}
                  </Select>
                </div>
                <div>
                  <Label>Content type</Label>
                  <Select value={newPost.contentType} onChange={e => setNewPost(p => ({...p, contentType:e.target.value}))}>
                    <option value="">Select...</option>
                    {CONTENT_TYPES.map(ct => <option key={ct} value={ct}>{ct}</option>)}
                  </Select>
                </div>
              </div>
              <Btn variant="success" size="sm" onClick={addQuickPost}
                disabled={!newPost.title.trim() || !newPost.platform}
                style={{opacity: newPost.title.trim() && newPost.platform ? 1 : .4}}>
                Add to calendar
              </Btn>
            </div>
          )}
          {selectedPosts.length === 0
            ? <p style={{color:"#ccc", fontSize:13, margin:0, textAlign:"center", padding:"12px 0"}}>No posts scheduled for this day.</p>
            : selectedPosts.map(s => (
              <div key={s.id} style={{display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:`1px solid ${BR}`}}>
                <PlatformDot platform={s.platform} />
                <div style={{flex:1}}>
                  <div style={{fontSize:13, fontWeight:500, color:"#333"}}>{s.title}</div>
                  <div style={{fontSize:11, color:"#aaa"}}>{s.platform} · {s.contentType} · by {s.submittedBy}</div>
                </div>
                <Badge status={s.status} />
              </div>
            ))
          }
        </Card>
      )}

      <Card style={{background:"#faf9f7"}}>
        <div style={{fontSize:12, fontWeight:600, color:"#999", marginBottom:8, textTransform:"uppercase", letterSpacing:.3}}>Platform legend</div>
        <div style={{display:"flex", flexWrap:"wrap", gap:10}}>
          {PLATFORMS.map(p => (
            <div key={p} style={{display:"flex", alignItems:"center", gap:5, fontSize:12, color:"#666"}}>
              <PlatformDot platform={p} />{p}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function CalendarPage({db,update}) {
  const [sel,setSel]=useState(new Date().getMonth());
  const [adding,setAdding]=useState(false);
  const [nf,setNf]=useState({name:"",cat:"Other",start:"",end:""});
  const events=db.events.filter(e=>{const m1=+e.start.split("-")[1]-1,m2=+e.end.split("-")[1]-1;return m1<=sel&&m2>=sel;}).sort((a,b)=>a.start.localeCompare(b.start));
  const addEvent=()=>{if(!nf.name.trim()||!nf.start)return;update(prev=>({...prev,events:[...prev.events,{id:`c_${prev.nextEventId}`,name:nf.name.trim(),cat:nf.cat,start:nf.start,end:nf.end||nf.start,custom:true}],nextEventId:prev.nextEventId+1}));setNf({name:"",cat:"Other",start:"",end:""});setAdding(false);};
  return(<div><PageTitle title="📅 Church events 2026" sub="Your year at a glance"/><div style={{display:"flex",gap:5,marginBottom:16,flexWrap:"wrap"}}>{MONTHS_SHORT.map((m,i)=><button key={m} onClick={()=>setSel(i)} className="btn-h" style={{padding:"6px 10px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",border:"none",background:sel===i?N:BR,color:sel===i?W:"#777",transition:"all 0.15s"}}>{m}</button>)}</div><Btn variant="gold" size="sm" onClick={()=>setAdding(!adding)} style={{marginBottom:14}}>{adding?"Cancel":"＋ Add event"}</Btn>{adding&&(<Card style={{borderLeft:`4px solid ${G}`}}><h3 style={{margin:"0 0 12px",color:N,fontSize:15,fontWeight:600}}>Add new event</h3><Label>Event name</Label><Input placeholder="e.g. Special Guest Speaker" value={nf.name} onChange={e=>setNf(p=>({...p,name:e.target.value}))} style={{marginBottom:12}}/><Label>Category</Label><div style={{marginBottom:12}}><PillSelect options={Object.keys(CAT_COLORS)} value={nf.cat} onChange={v=>setNf(p=>({...p,cat:v}))}/></div><div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:14}}><div style={{flex:1,minWidth:140}}><Label>Start</Label><Input type="date" value={nf.start} onChange={e=>setNf(p=>({...p,start:e.target.value}))}/></div><div style={{flex:1,minWidth:140}}><Label>End</Label><Input type="date" value={nf.end} onChange={e=>setNf(p=>({...p,end:e.target.value}))}/></div></div><Btn variant="primary" disabled={!nf.name.trim()||!nf.start} onClick={addEvent} style={{opacity:nf.name.trim()&&nf.start?1:.4}}>Add event</Btn></Card>)}{events.length===0?<EmptyState icon="📅" text={`Nothing scheduled in ${MONTHS_SHORT[sel]}`}/>:events.map(e=>(<Card key={e.id} hover style={{display:"flex",alignItems:"center",gap:12}}><div style={{width:4,height:44,borderRadius:2,background:CAT_COLORS[e.cat]||CAT_COLORS.Other,flexShrink:0}}/><div style={{flex:1,minWidth:0}}><div style={{fontWeight:600,fontSize:14,color:"#333"}}>{e.name}{e.custom?" ✦":""}</div><div style={{fontSize:11,color:"#aaa"}}>{fmtDate(e.start)}{e.end!==e.start?` — ${fmtDate(e.end)}`:""}</div></div><CatBadge cat={e.cat}/>{e.custom&&<button onClick={()=>update(p=>({...p,events:p.events.filter(x=>x.id!==e.id)}))} className="btn-h" style={{background:"none",border:"none",color:"#ccc",fontSize:18,cursor:"pointer",padding:"2px 6px",borderRadius:6}}>×</button>}</Card>))}</div>);
}

function RemindersPage({db,update,user}) {
  const [adding,setAdding]=useState(false);
  const [nf,setNf]=useState({text:"",date:"",assignedTo:""});
  const allNames=getAllNames(db.members||DEFAULT_MEMBERS);
  const add=()=>{if(!nf.text.trim()||!nf.date)return;update(prev=>({...prev,reminders:[...prev.reminders,{id:prev.nextReminderId,text:nf.text.trim(),date:nf.date,assignedTo:nf.assignedTo,createdBy:user,createdDate:tod(),done:false}],nextReminderId:prev.nextReminderId+1}));setNf({text:"",date:"",assignedTo:""});setAdding(false);};
  const active=db.reminders.filter(r=>!r.done).sort((a,b)=>a.date.localeCompare(b.date));
  const completed=db.reminders.filter(r=>r.done);
  const isOverdue=d=>d<tod();
  return(<div><PageTitle title="🔔 Reminders" sub="Deadlines and nudges"/><Btn variant="gold" size="sm" onClick={()=>setAdding(!adding)} style={{marginBottom:14}}>{adding?"Cancel":"＋ New reminder"}</Btn>{adding&&(<Card style={{borderLeft:`4px solid ${G}`}}><Label>What needs to happen?</Label><Input placeholder='e.g. "Post Easter countdown"' value={nf.text} onChange={e=>setNf(p=>({...p,text:e.target.value}))} style={{marginBottom:12}}/><Label>When</Label><Input type="date" value={nf.date} onChange={e=>setNf(p=>({...p,date:e.target.value}))} style={{marginBottom:12}}/><Label>Who's responsible?</Label><Select value={nf.assignedTo} onChange={e=>setNf(p=>({...p,assignedTo:e.target.value}))} style={{marginBottom:14}}><option value="">— Whole team —</option>{allNames.map(n=><option key={n} value={n}>{n}</option>)}</Select><Btn variant="primary" disabled={!nf.text.trim()||!nf.date} onClick={add} style={{opacity:nf.text.trim()&&nf.date?1:.4}}>Set reminder</Btn></Card>)}{active.length===0&&completed.length===0?<EmptyState icon="🔔" text="No reminders yet."/>:<>{active.map(r=>(<Card key={r.id} hover style={{display:"flex",alignItems:"center",gap:12,borderLeft:isOverdue(r.date)?"4px solid #EF4444":`4px solid ${G}`}}><button onClick={()=>update(p=>({...p,reminders:p.reminders.map(x=>x.id===r.id?{...x,done:true}:x)}))} className="btn-h" style={{width:24,height:24,borderRadius:"50%",border:"2px solid #ccc",background:W,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}/><div style={{flex:1}}><div style={{fontSize:13,fontWeight:500,color:isOverdue(r.date)?"#DC2626":"#333"}}>{r.text}{isOverdue(r.date)&&<span style={{fontSize:10,color:"#DC2626",marginLeft:8,fontWeight:700,background:"#FEE2E2",padding:"2px 6px",borderRadius:4}}>OVERDUE</span>}</div><div style={{fontSize:11,color:"#aaa",marginTop:2}}>{fmtDate(r.date)} · {r.assignedTo||"Whole team"}</div></div><button onClick={()=>update(p=>({...p,reminders:p.reminders.filter(x=>x.id!==r.id)}))} className="btn-h" style={{background:"none",border:"none",color:"#ccc",fontSize:18,cursor:"pointer",borderRadius:6}}>×</button></Card>))}{completed.length>0&&<div style={{marginTop:20}}><div style={{fontSize:12,fontWeight:700,color:"#ccc",marginBottom:8,textTransform:"uppercase",letterSpacing:.5}}>Completed ({completed.length})</div>{completed.map(r=>(<Card key={r.id} style={{opacity:.5,display:"flex",alignItems:"center",gap:12}}><button onClick={()=>update(p=>({...p,reminders:p.reminders.map(x=>x.id===r.id?{...x,done:false}:x)}))} className="btn-h" style={{width:24,height:24,borderRadius:"50%",border:"2px solid #059669",background:"#D1FAE5",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#059669"}}>✓</button><div style={{flex:1,textDecoration:"line-through",fontSize:13,color:"#999"}}>{r.text}</div><button onClick={()=>update(p=>({...p,reminders:p.reminders.filter(x=>x.id!==r.id)}))} className="btn-h" style={{background:"none",border:"none",color:"#ddd",fontSize:16,cursor:"pointer",borderRadius:6}}>×</button></Card>))}</div>}</> }</div>);
}

function AnnouncementsPage({db,update,user}) {
  const [adding,setAdding]=useState(false);
  const [text,setText]=useState("");
  const announcements=(db.announcements||[]).slice().reverse();
  const isLead=(db.members||DEFAULT_MEMBERS).find(m=>m.name===user)?.type==="lead";
  const add=()=>{if(!text.trim())return;update(prev=>({...prev,announcements:[...(prev.announcements||[]),{id:prev.nextAnnouncementId||1,text:text.trim(),createdBy:user,createdDate:tod(),readBy:[user]}],nextAnnouncementId:(prev.nextAnnouncementId||1)+1}));setText("");setAdding(false);};
  const markRead=(id)=>{update(prev=>({...prev,announcements:(prev.announcements||[]).map(a=>a.id===id&&!a.readBy?.includes(user)?{...a,readBy:[...(a.readBy||[]),user]}:a)}));};
  return(<div><PageTitle title="📢 Announcements" sub="Team notices and updates"/>{isLead&&<Btn variant="gold" size="sm" onClick={()=>setAdding(!adding)} style={{marginBottom:14}}>{adding?"Cancel":"＋ Post announcement"}</Btn>}{adding&&(<Card style={{borderLeft:"4px solid #2563EB",background:"#EEF2FF"}}><Label>Announcement</Label><Textarea placeholder="What does the team need to know?" value={text} onChange={e=>setText(e.target.value)} style={{minHeight:80,marginBottom:12}}/><Btn variant="primary" disabled={!text.trim()} onClick={add} style={{opacity:text.trim()?1:.4}}>Post to team</Btn></Card>)}{announcements.length===0?<EmptyState icon="📢" text="No announcements yet."/>:announcements.map(a=>{const unread=!a.readBy?.includes(user);return(<Card key={a.id} hover style={{borderLeft:unread?"4px solid #2563EB":`4px solid ${BR}`,background:unread?"#EEF2FF":W}} onClick={()=>markRead(a.id)}><div style={{display:"flex",justifyContent:"space-between",alignItems:"start",gap:10}}><div style={{flex:1}}>{unread&&<span style={{fontSize:10,fontWeight:700,color:"#2563EB",background:"#DBEAFE",padding:"1px 6px",borderRadius:4,display:"inline-block",marginBottom:4}}>NEW</span>}<p style={{margin:0,fontSize:13,color:"#333",lineHeight:1.6}}>{a.text}</p><div style={{fontSize:11,color:"#aaa",marginTop:6}}>By {a.createdBy} · {fmtDate(a.createdDate)}</div></div></div></Card>);})}</div>);
}

function TeamPage({db,update,user,isReviewer}) {
  const [editing,setEditing]=useState(null);
  const [adding,setAdding]=useState(false);
  const [nf,setNf]=useState({name:"",fullName:"",role:"",type:"creator",tasks:""});
  const members=db.members||DEFAULT_MEMBERS;
  const leads=members.filter(m=>m.active&&m.type==="lead");
  const creators=members.filter(m=>m.active&&m.type==="creator");
  const approvers=members.filter(m=>m.active&&m.type==="approver");
  const inactive=members.filter(m=>!m.active);
  const saveEdit=()=>{if(!editing)return;update(prev=>({...prev,members:(prev.members||DEFAULT_MEMBERS).map(m=>m.id===editing.id?editing:m)}));setEditing(null);};
  const addMember=()=>{if(!nf.name.trim()||!nf.fullName.trim())return;const nm={id:db.nextMemberId||20,name:nf.name.trim(),fullName:nf.fullName.trim(),role:nf.role||"Team Member",type:nf.type,tasks:nf.tasks,active:true};update(prev=>({...prev,members:[...(prev.members||DEFAULT_MEMBERS),nm],nextMemberId:(prev.nextMemberId||20)+1}));setNf({name:"",fullName:"",role:"",type:"creator",tasks:""});setAdding(false);};
  const toggleActive=(id)=>{update(prev=>({...prev,members:(prev.members||DEFAULT_MEMBERS).map(m=>m.id===id?{...m,active:!m.active}:m)}));};
  const MemberCard=({m})=>(<Card hover style={{position:"relative"}}>{editing?.id===m.id?(<div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}><div><Label>Display name</Label><Input value={editing.name} onChange={e=>setEditing(p=>({...p,name:e.target.value}))}/></div><div><Label>Full name</Label><Input value={editing.fullName} onChange={e=>setEditing(p=>({...p,fullName:e.target.value}))}/></div><div><Label>Role</Label><Input value={editing.role} onChange={e=>setEditing(p=>({...p,role:e.target.value}))}/></div><div><Label>Type</Label><Select value={editing.type} onChange={e=>setEditing(p=>({...p,type:e.target.value}))}>{MEMBER_TYPES.map(t=><option key={t} value={t}>{TYPE_CONFIG[t].label}</option>)}</Select></div><div style={{gridColumn:"1/-1"}}><Label>Responsibilities</Label><Textarea value={editing.tasks} onChange={e=>setEditing(p=>({...p,tasks:e.target.value}))} style={{minHeight:55}}/></div></div><div style={{display:"flex",gap:8}}><Btn variant="success" size="sm" onClick={saveEdit}>Save</Btn><Btn variant="secondary" size="sm" onClick={()=>setEditing(null)}>Cancel</Btn></div></div>):(<div style={{display:"flex",alignItems:"start",gap:12}}><div style={{width:40,height:40,borderRadius:"50%",background:TYPE_CONFIG[m.type].color,color:W,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:700,flexShrink:0}}>{m.name[0]}</div><div style={{flex:1,minWidth:0}}><div style={{fontWeight:600,fontSize:14,color:"#333"}}>{m.fullName||m.name}</div><div style={{fontSize:12,color:"#aaa"}}>{m.role}</div><span style={{fontSize:10,background:TYPE_CONFIG[m.type].color+"18",color:TYPE_CONFIG[m.type].color,padding:"2px 8px",borderRadius:6,fontWeight:600,display:"inline-block",marginTop:4}}>{TYPE_CONFIG[m.type].label}</span>{m.tasks&&<p style={{fontSize:12,color:"#888",margin:"6px 0 0",lineHeight:1.5}}>{m.tasks}</p>}</div>{isReviewer&&(<div style={{display:"flex",gap:5,flexShrink:0}}><Btn variant="ghost" size="sm" onClick={()=>setEditing({...m})}>Edit</Btn><button onClick={()=>toggleActive(m.id)} className="btn-h" style={{padding:"5px 10px",borderRadius:7,fontSize:11,fontWeight:600,cursor:"pointer",border:`1.5px solid ${BR}`,background:W,color:"#aaa",transition:"all 0.15s"}}>Remove</button></div>)}</div>)}</Card>);
  const Section=({title,items})=>items.length===0?null:(<div style={{marginBottom:20}}><div style={{fontSize:11,fontWeight:700,color:"#aaa",textTransform:"uppercase",letterSpacing:.5,marginBottom:8}}>{title}</div>{items.map(m=><MemberCard key={m.id} m={m}/>)}</div>);
  return(<div><PageTitle title="👥 The team" sub={`${members.filter(m=>m.active).length} active members`}/>{isReviewer&&(<div style={{marginBottom:14}}><Btn variant="gold" size="sm" onClick={()=>setAdding(!adding)}>{adding?"Cancel":"＋ Add team member"}</Btn></div>)}{adding&&(<Card style={{borderLeft:`4px solid ${G}`,marginBottom:20}}><h3 style={{margin:"0 0 12px",color:N,fontSize:15,fontWeight:600}}>New team member</h3><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}><div><Label>Display name</Label><Input placeholder="e.g. Jean" value={nf.name} onChange={e=>setNf(p=>({...p,name:e.target.value}))}/></div><div><Label>Full name</Label><Input placeholder="e.g. Jean Dupont" value={nf.fullName} onChange={e=>setNf(p=>({...p,fullName:e.target.value}))}/></div><div><Label>Role</Label><Input placeholder="e.g. Designer" value={nf.role} onChange={e=>setNf(p=>({...p,role:e.target.value}))}/></div><div><Label>Type</Label><Select value={nf.type} onChange={e=>setNf(p=>({...p,type:e.target.value}))}>{MEMBER_TYPES.map(t=><option key={t} value={t}>{TYPE_CONFIG[t].label}</option>)}</Select></div><div style={{gridColumn:"1/-1"}}><Label>Responsibilities</Label><Textarea placeholder="What will they be doing?" value={nf.tasks} onChange={e=>setNf(p=>({...p,tasks:e.target.value}))} style={{minHeight:55}}/></div></div><Btn variant="success" size="sm" disabled={!nf.name.trim()||!nf.fullName.trim()} onClick={addMember} style={{opacity:nf.name.trim()&&nf.fullName.trim()?1:.4}}>Add member</Btn></Card>)}<Section title="Team Leads" items={leads}/><Section title="Creators & Designers" items={creators}/><Section title="Reviewers & Approvers" items={approvers}/>{inactive.length>0&&(<div><div style={{fontSize:11,fontWeight:700,color:"#ddd",textTransform:"uppercase",letterSpacing:.5,marginBottom:8}}>Inactive ({inactive.length})</div>{inactive.map(m=>(<Card key={m.id} style={{opacity:.5,display:"flex",alignItems:"center",gap:12}}><div style={{width:36,height:36,borderRadius:"50%",background:"#ddd",color:W,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700}}>{m.name[0]}</div><div style={{flex:1}}><div style={{fontSize:13,color:"#999",textDecoration:"line-through"}}>{m.fullName||m.name}</div><div style={{fontSize:11,color:"#ccc"}}>{m.role}</div></div>{isReviewer&&<Btn variant="ghost" size="sm" onClick={()=>toggleActive(m.id)}>Restore</Btn>}</Card>))}</div>)}</div>);
}

function ExportPage({db,user}) {
  const now=new Date();
  const [calYear,setCalYear]=useState(now.getFullYear());
  const [calMonth,setCalMonth]=useState(now.getMonth());
  const stats={total:db.submissions.length,posted:db.submissions.filter(s=>s.status==="Posted").length,pending:db.submissions.filter(s=>s.status==="Ready for Review").length,withFiles:db.submissions.filter(s=>getRevisions(s).length>0).length};
  return(<div><PageTitle title="📤 Export data" sub="Download everything as formatted Excel spreadsheets"/><Card style={{background:"#faf9f7",marginBottom:20}}><div style={{fontSize:12,fontWeight:700,color:"#999",textTransform:"uppercase",letterSpacing:.3,marginBottom:10}}>Current stats</div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))",gap:8}}>{[{l:"Total posts",v:stats.total,c:N},{l:"Published",v:stats.posted,c:"#059669"},{l:"Pending review",v:stats.pending,c:"#D97706"},{l:"With designs",v:stats.withFiles,c:"#7C3AED"}].map(s=><div key={s.l} style={{textAlign:"center"}}><div style={{fontSize:22,fontWeight:700,color:s.c}}>{s.v}</div><div style={{fontSize:11,color:"#aaa"}}>{s.l}</div></div>)}</div></Card><Card hover><div style={{display:"flex",alignItems:"start",gap:14}}><div style={{fontSize:30}}>📋</div><div style={{flex:1}}><div style={{fontWeight:700,fontSize:15,color:N}}>Full media hub export</div><p style={{fontSize:13,color:"#888",margin:"4px 0 12px",lineHeight:1.6}}>Everything in one workbook — perfect for leadership meetings with Pastor Timothy.</p><Btn variant="primary" onClick={()=>exportAllExcel(db)}>⬇ Download full export (.xlsx)</Btn></div></div></Card><Card hover><div style={{display:"flex",alignItems:"start",gap:14}}><div style={{fontSize:30}}>🗓</div><div style={{flex:1}}><div style={{fontWeight:700,fontSize:15,color:N}}>Monthly content calendar</div><p style={{fontSize:13,color:"#888",margin:"4px 0 12px",lineHeight:1.6}}>A clean calendar view of all content due or posted in a specific month.</p><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,flexWrap:"wrap"}}><Select value={calMonth} onChange={e=>setCalMonth(+e.target.value)} style={{width:"auto",minWidth:120}}>{MONTHS.map((m,i)=><option key={m} value={i}>{m}</option>)}</Select><Select value={calYear} onChange={e=>setCalYear(+e.target.value)} style={{width:"auto",minWidth:90}}>{[2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}</Select></div><Btn variant="gold" onClick={()=>exportCalendarExcel(db,calYear,calMonth)}>⬇ Download calendar — {MONTHS_SHORT[calMonth]} {calYear}</Btn></div></div></Card></div>);
}
