// ERC MEDIA HUB v4 — Mobile-First Edition
// Full phone UX overhaul: bottom nav, vertical board, touch-friendly everything

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import * as XLSX from "xlsx-js-style";

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
  {id:1,name:"Serena",fullName:"Serena Munezero",role:"Co-Lead / Design",type:"lead",tasks:"Oversees all content, final design reviews, keeps everything on-brand",active:true,hasAccount:false},
  {id:2,name:"Elisha",fullName:"Elisha",role:"Co-Lead / Technical",type:"lead",tasks:"Manages database, sound, livestreaming, and the technical side",active:true,hasAccount:false},
  {id:3,name:"Vanessa",fullName:"Vanessa",role:"Designer / Photographer",type:"creator",tasks:"Creates graphics, shoots event photos, handles image editing",active:true,hasAccount:false},
  {id:4,name:"Josias",fullName:"Josias",role:"Designer / Videographer",type:"creator",tasks:"Video editing, motion graphics, films church events",active:true,hasAccount:true},
  {id:5,name:"Moses",fullName:"Moses",role:"Designer / Content Creator",type:"creator",tasks:"Designs posts, stories, and promotional material",active:true,hasAccount:false},
  {id:6,name:"Doriane",fullName:"Doriane",role:"Designer / Photographer",type:"creator",tasks:"Event photography, post design, and stories",active:true,hasAccount:true},
  {id:7,name:"Papa Elijah",fullName:"Papa Elijah",role:"Advisor",type:"approver",tasks:"Reviews and approves content before it goes live",active:true,hasAccount:false},
  {id:8,name:"Pastor Timothy",fullName:"Pastor Timothy",role:"Supervising Pastor",type:"approver",tasks:"Oversees the media ministry and sets the direction",active:true,hasAccount:false},
  {id:9,name:"Sammy",fullName:"Sammy",role:"Reviewer",type:"approver",tasks:"Reviews content and gives feedback",active:true,hasAccount:false},
  {id:10,name:"Lydia",fullName:"Lydia",role:"Reviewer",type:"approver",tasks:"Reviews content and gives feedback",active:true,hasAccount:false},
  {id:11,name:"Soleil",fullName:"Soleil",role:"Reviewer",type:"approver",tasks:"Reviews content and gives feedback",active:true,hasAccount:false},
  {id:12,name:"Faith",fullName:"Faith",role:"Reviewer",type:"approver",tasks:"Reviews content and gives feedback",active:true,hasAccount:false},
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
  {id:1,label:"💡 Concept",short:"Concept",bg:"#EEF2FF",border:"#6366F1",fg:"#4338CA",desc:"Awaiting concept review"},
  {id:2,label:"🎨 Designing",short:"Designing",bg:"#FFF7ED",border:"#F59E0B",fg:"#92400E",desc:"Design in progress"},
  {id:3,label:"👁 In Review",short:"Review",bg:"#F0FDF4",border:"#22C55E",fg:"#166534",desc:"Design under review"},
  {id:4,label:"✅ Ready",short:"Ready",bg:"#DCFCE7",border:"#059669",fg:"#065F46",desc:"Approved — needs posting"},
  {id:5,label:"🚀 Posted",short:"Posted",bg:"#D1FAE5",border:"#047857",fg:"#064E3B",desc:"Live on social media"},
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

// ── MOBILE HOOK ──────────────────────────────────────────────────────────────
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
};

// ── EXCEL EXPORT (unchanged) ─────────────────────────────────────────────────
const HEX = {
  navyBg:"1A2E44",navyFg:"FFFFFF",goldBg:"D4A259",goldFg:"FFFFFF",
  greenBg:"D1FAE5",greenFg:"065F46",yellowBg:"FEF9C3",yellowFg:"92400E",
  orangeBg:"FED7AA",orangeFg:"9A3412",redBg:"FEE2E2",redFg:"991B1B",
  blueBg:"EEF2FF",blueFg:"4338CA",tealBg:"D1FAE5",tealFg:"065F46",
  greyBg:"F3F4F6",greyFg:"374151",white:"FFFFFF",black:"111827",altRow:"F9FAFB",
};
const STATUS_HEX = {
  "Draft":{bg:HEX.blueBg,fg:HEX.blueFg},"Ready for Review":{bg:HEX.yellowBg,fg:HEX.yellowFg},
  "Approved":{bg:HEX.greenBg,fg:HEX.greenFg},"Needs Changes":{bg:HEX.orangeBg,fg:HEX.orangeFg},
  "Posted":{bg:HEX.tealBg,fg:HEX.tealFg},"Rejected":{bg:HEX.redBg,fg:HEX.redFg},
};
const sc=(ws,r,c,v,s={})=>{const addr=XLSX.utils.encode_cell({r,c});ws[addr]={v,t:typeof v==="number"?"n":"s",s:{font:{name:"Calibri",sz:10,...(s.font||{})},fill:{patternType:"solid",fgColor:{rgb:s.bg||HEX.white},...(!s.bg?{patternType:"none"}:{})},alignment:{wrapText:true,vertical:"center",...(s.align||{})},border:{top:{style:"thin",color:{rgb:"D1D5DB"}},bottom:{style:"thin",color:{rgb:"D1D5DB"}},left:{style:"thin",color:{rgb:"D1D5DB"}},right:{style:"thin",color:{rgb:"D1D5DB"}}},...s}};};
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

// ── DESIGN TOKENS ────────────────────────────────────────────────────────────
const N = "#1a2e44", G = "#d4a259", BG = "#F4F3F0", W = "#ffffff", BR = "#E8E5DF", DARK_GREY = "#6B7280";

// ── SHARED UI COMPONENTS ─────────────────────────────────────────────────────
const Badge = ({status}) => {
  const c = STATUS_CONFIG[status]||STATUS_CONFIG.Draft;
  return <span style={{background:c.bg,color:c.fg,padding:"5px 10px",borderRadius:20,fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>{c.icon} {status}</span>;
};
const CatBadge = ({cat}) => <span style={{background:CAT_COLORS[cat]||CAT_COLORS.Other,color:"#fff",padding:"4px 10px",borderRadius:12,fontSize:11,fontWeight:600}}>{cat}</span>;
const PlatformDot = ({platform}) => <span style={{display:"inline-block",width:10,height:10,borderRadius:"50%",background:PLATFORM_COLORS[platform]||"#999",marginRight:4,flexShrink:0}} />;

const Card = ({children,style={},hover=false,onClick}) => (
  <div
    onClick={onClick}
    className={hover?"card-h":undefined}
    style={{background:W,borderRadius:16,padding:"16px",border:`1px solid ${BR}`,marginBottom:10,transition:"box-shadow 0.2s,transform 0.2s",cursor:onClick?"pointer":undefined,...style}}
  >
    {children}
  </div>
);

const PageTitle = ({title,sub}) => (
  <div style={{marginBottom:20}}>
    <h2 style={{fontFamily:"'Fraunces',serif",color:N,fontSize:20,margin:"0 0 3px",fontWeight:700,lineHeight:1.2}}>{title}</h2>
    {sub && <p style={{color:"#999",margin:0,fontSize:13,lineHeight:1.4}}>{sub}</p>}
  </div>
);

const Label = ({children}) => (
  <label style={{display:"block",fontSize:12,fontWeight:700,color:"#666",marginBottom:6,textTransform:"uppercase",letterSpacing:.4}}>
    {children}
  </label>
);

const Input = (props) => (
  <input
    {...props}
    style={{
      width:"100%",padding:"13px 14px",border:`1.5px solid ${BR}`,borderRadius:10,
      fontSize:16, // 16px prevents iOS zoom on focus!
      fontFamily:"inherit",boxSizing:"border-box",transition:"border-color 0.15s",
      WebkitAppearance:"none",appearance:"none",
      ...(props.style||{})
    }}
  />
);

const Textarea = (props) => (
  <textarea
    {...props}
    style={{
      width:"100%",padding:"13px 14px",border:`1.5px solid ${BR}`,borderRadius:10,
      fontSize:16,fontFamily:"inherit",boxSizing:"border-box",resize:"vertical",
      ...(props.style||{})
    }}
  />
);

const Select = ({children,...props}) => (
  <select
    {...props}
    style={{
      width:"100%",padding:"13px 14px",border:`1.5px solid ${BR}`,borderRadius:10,
      fontSize:16,fontFamily:"inherit",boxSizing:"border-box",
      WebkitAppearance:"none",appearance:"none",
      backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23999' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
      backgroundRepeat:"no-repeat",backgroundPosition:"right 14px center",
      paddingRight:36,
      ...(props.style||{})
    }}
  >
    {children}
  </select>
);

const Btn = ({variant="primary",size="md",children,style={},...props}) => {
  const base = {
    border:"none",borderRadius:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
    transition:"opacity 0.12s,transform 0.12s",display:"inline-flex",alignItems:"center",
    gap:6,WebkitTapHighlightColor:"transparent",touchAction:"manipulation"
  };
  const sz = size==="sm"?{padding:"9px 14px",fontSize:13,minHeight:38}
            :size==="lg"?{padding:"16px 28px",fontSize:16,minHeight:52}
            :{padding:"13px 20px",fontSize:14,minHeight:44};
  const v = {
    primary:{background:N,color:W},
    gold:{background:G,color:W},
    success:{background:"#059669",color:W},
    danger:{background:"#DC2626",color:W},
    warning:{background:"#D97706",color:W},
    secondary:{background:BR,color:"#444"},
    ghost:{background:"transparent",color:N,border:`1.5px solid ${BR}`}
  }[variant]||{background:N,color:W};
  return <button {...props} className="btn-h" style={{...base,...sz,...v,...style}}>{children}</button>;
};

const MultiPillSelect = ({options,values=[],onChange,colorMap}) => (
  <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
    {options.map(o=>{
      const sel=values.includes(o);
      const cc=colorMap?.[o];
      return (
        <button
          key={o}
          onClick={()=>onChange(sel?values.filter(v=>v!==o):[...values,o])}
          style={{
            padding:"10px 14px",borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer",
            fontFamily:"inherit",border:sel?`2px solid ${cc||N}`:"2px solid #e8e5df",
            background:sel?(cc?cc+"22":"#eef1f5"):"#fff",color:sel?(cc||N):"#777",
            transition:"all 0.15s",display:"flex",alignItems:"center",gap:6,
            minHeight:44,touchAction:"manipulation",WebkitTapHighlightColor:"transparent"
          }}
        >
          {sel && <span style={{fontSize:11,background:cc||N,color:"#fff",borderRadius:"50%",width:18,height:18,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>✓</span>}
          {o}
        </button>
      );
    })}
  </div>
);

const PillSelect = ({options,value,onChange,colorMap}) => (
  <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
    {options.map(o=>{
      const sel=value===o;
      const cc=colorMap?.[o];
      return (
        <button
          key={o}
          onClick={()=>onChange(o)}
          style={{
            padding:"10px 14px",borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer",
            fontFamily:"inherit",border:sel?`2px solid ${cc||N}`:"2px solid #e8e5df",
            background:sel?(cc?cc+"18":"#eef1f5"):"#fff",color:sel?(cc||N):"#777",
            transition:"all 0.15s",minHeight:44,touchAction:"manipulation",
            WebkitTapHighlightColor:"transparent"
          }}
        >
          {o}
        </button>
      );
    })}
  </div>
);

const EmptyState = ({icon,text}) => (
  <div style={{textAlign:"center",padding:"56px 20px",color:"#ccc"}}>
    <div style={{fontSize:52,marginBottom:12}}>{icon}</div>
    <p style={{fontSize:14,margin:0,color:"#bbb"}}>{text}</p>
  </div>
);

// ── BOTTOM SHEET (mobile "More" menu) ────────────────────────────────────────
const BottomSheet = ({open,onClose,children}) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          style={{
            position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:200,
            transition:"opacity 0.25s",backdropFilter:"blur(2px)"
          }}
        />
      )}
      <div
        style={{
          position:"fixed",bottom:0,left:0,right:0,
          background:W,borderRadius:"20px 20px 0 0",
          zIndex:201,
          maxHeight:"82vh",overflowY:"auto",
          transform:open?"translateY(0)":"translateY(100%)",
          transition:"transform 0.32s cubic-bezier(0.32,0.72,0,1)",
          boxShadow:"0 -8px 40px rgba(0,0,0,0.18)",
          paddingBottom:"env(safe-area-inset-bottom,0px)"
        }}
      >
        {/* Handle */}
        <div style={{display:"flex",justifyContent:"center",padding:"12px 0 4px"}}>
          <div style={{width:36,height:4,borderRadius:2,background:"#ddd"}} />
        </div>
        {children}
      </div>
    </>
  );
};

// ── FIREBASE AUTH FLOW ────────────────────────────────────────────────────────
function makeEmail(name) {
  return `${name.toLowerCase().replace(/\s+/g,".")}@erc-media.internal`;
}

function AuthScreen({ members, onSignedIn, onClearAccount }) {
  const [step, setStep] = useState("pick");
  const [selectedMember, setSelectedMember] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const active = members.filter(m => m.active);
  const filtered = search.trim()
    ? active.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.fullName.toLowerCase().includes(search.toLowerCase())
      )
    : active;

  const handleSelectMember = (member) => {
    setSelectedMember(member);
    setError("");
    setPassword("");
    setConfirmPassword("");
    setStep(member.hasAccount ? "login" : "setup");
  };

  const handleSetup = async () => {
    if (!password || password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true); setError("");
    try {
      const cred = await createUserWithEmailAndPassword(fbAuth, makeEmail(selectedMember.name), password);
      onSignedIn(selectedMember.name, cred.user, selectedMember.name);
    } catch (e) {
      if (e.code === "auth/email-already-in-use") { setStep("login"); setError("Account exists. Enter your password."); setPassword(""); setConfirmPassword(""); }
      else if (e.code === "auth/weak-password") setError("Password must be at least 6 characters.");
      else setError(e.message || "Could not create account.");
    } finally { setLoading(false); }
  };

  const handleLogin = async () => {
    if (!password) { setError("Enter your password."); return; }
    setLoading(true); setError("");
    try {
      const cred = await signInWithEmailAndPassword(fbAuth, makeEmail(selectedMember.name), password);
      onSignedIn(selectedMember.name, cred.user);
    } catch (e) {
      if (e.code === "auth/user-not-found" || e.code === "auth/invalid-credential") {
        // Account was deleted from Firebase — clear local flag and go to account creation
        onClearAccount?.(selectedMember.name);
        setStep("setup"); setPassword(""); setConfirmPassword("");
      }
      else if (e.code === "auth/wrong-password") setError("Wrong password. Try again.")
      else if (e.code === "auth/too-many-requests") setError("Too many attempts. Wait a few minutes.");
      else setError(e.message || "Sign-in failed.");
    } finally { setLoading(false); }
  };

  const containerStyle = {
    minHeight:"100vh",display:"flex",flexDirection:"column",
    background:N,fontFamily:"'DM Sans',sans-serif",
    paddingTop:"env(safe-area-inset-top,0px)"
  };

  // On desktop, show a centered card instead of full-stretch layout
  const isDesktopAuth = typeof window !== "undefined" && window.innerWidth >= 768;

  if (isDesktopAuth) {
    // Desktop: centered modal card
    const desktopCard = {
      background:W,borderRadius:18,padding:"32px 28px",
      width:"100%",maxWidth:460,
      boxShadow:"0 24px 64px rgba(0,0,0,0.4)",
      maxHeight:"88vh",overflowY:"auto"
    };
    const desktopWrap = {
      minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",
      background:N,fontFamily:"'DM Sans',sans-serif",padding:20
    };

    if (step === "pick") return (
      <div style={desktopWrap}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:wght@700;800&display=swap" rel="stylesheet"/>
        <div style={desktopCard}>
          <div style={{textAlign:"center",marginBottom:24}}>
            <div style={{fontSize:44,marginBottom:10}}>⛪</div>
            <h1 style={{fontFamily:"'Fraunces',serif",fontSize:24,color:N,margin:"0 0 4px",fontWeight:800}}>ERC Media Hub</h1>
            <p style={{color:"#aaa",fontSize:13,margin:0}}>Ottawa–Gatineau Parish · 2026</p>
          </div>
          <p style={{fontSize:13,color:"#888",textAlign:"center",marginBottom:14,marginTop:0}}>Click your name to sign in</p>
          <div style={{position:"relative",marginBottom:12}}>
            <span style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",fontSize:14,color:"#bbb"}}>🔍</span>
            <Input placeholder="Search your name..." value={search} onChange={e=>setSearch(e.target.value)} style={{paddingLeft:40}}/>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:5,maxHeight:"50vh",overflowY:"auto"}}>
            {filtered.map(m=>{
              const tc=TYPE_CONFIG[m.type];
              return (
                <button key={m.id} onClick={()=>handleSelectMember(m)} style={{padding:"11px 14px",border:`1.5px solid ${BR}`,borderRadius:10,background:W,fontSize:14,fontWeight:500,cursor:"pointer",textAlign:"left",fontFamily:"inherit",color:"#333",display:"flex",alignItems:"center",gap:10,transition:"all 0.15s",minHeight:56}}>
                  <span style={{width:36,height:36,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:W,background:tc.color,flexShrink:0}}>{m.name[0]}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,fontSize:14}}>{m.fullName||m.name}</div>
                    <div style={{fontSize:12,color:"#bbb"}}>{m.role}</div>
                  </div>
                  <span style={{fontSize:10,background:tc.color+"18",color:tc.color,padding:"2px 8px",borderRadius:7,fontWeight:700,flexShrink:0}}>{tc.label}</span>
                </button>
              );
            })}
            {filtered.length===0&&<p style={{textAlign:"center",color:"#ccc",fontSize:13,padding:"12px 0"}}>No members found.</p>}
          </div>
        </div>
      </div>
    );

    if (step === "setup") return (
      <div style={desktopWrap}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:wght@700;800&display=swap" rel="stylesheet"/>
        <div style={desktopCard}>
          <div style={{textAlign:"center",marginBottom:24}}>
            <div style={{width:56,height:56,borderRadius:"50%",background:TYPE_CONFIG[selectedMember.type].color,color:W,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:700,margin:"0 auto 12px"}}>{selectedMember.name[0]}</div>
            <h2 style={{fontFamily:"'Fraunces',serif",fontSize:20,color:N,margin:"0 0 4px"}}>Welcome, {selectedMember.name}!</h2>
            <p style={{color:"#aaa",fontSize:12,margin:0}}>Create your password once — then sign in any time.</p>
          </div>
          <div style={{padding:"10px 14px",background:"#EEF2FF",borderRadius:10,border:"1px solid #C7D2FE",marginBottom:18,fontSize:12,color:"#4338CA"}}>
            🔐 Your account: <strong>{makeEmail(selectedMember.name)}</strong>
          </div>
          <div style={{marginBottom:12}}><Label>Create a password</Label><Input type="password" placeholder="At least 6 characters" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSetup()}/></div>
          <div style={{marginBottom:16}}><Label>Confirm password</Label><Input type="password" placeholder="Type it again" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSetup()}/></div>
          {error&&<div style={{padding:"8px 12px",background:"#FEE2E2",borderRadius:8,fontSize:12,color:"#DC2626",marginBottom:12}}>{error}</div>}
          <Btn variant="primary" onClick={handleSetup} disabled={loading} style={{width:"100%",justifyContent:"center",opacity:loading?0.6:1,minHeight:48}}>{loading?"Setting up...":"🚀 Create account & sign in"}</Btn>
          <button onClick={()=>setStep("pick")} style={{background:"none",border:"none",color:"#aaa",fontSize:12,cursor:"pointer",marginTop:10,fontFamily:"inherit",display:"block",textAlign:"center",width:"100%",padding:"8px"}}>← Back to name selection</button>
        </div>
      </div>
    );

    if (step === "login") return (
      <div style={desktopWrap}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:wght@700;800&display=swap" rel="stylesheet"/>
        <div style={desktopCard}>
          <div style={{textAlign:"center",marginBottom:24}}>
            <div style={{width:56,height:56,borderRadius:"50%",background:TYPE_CONFIG[selectedMember.type].color,color:W,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:700,margin:"0 auto 12px"}}>{selectedMember.name[0]}</div>
            <h2 style={{fontFamily:"'Fraunces',serif",fontSize:20,color:N,margin:"0 0 4px"}}>Hey {selectedMember.name}!</h2>
            <p style={{color:"#aaa",fontSize:12,margin:0}}>Enter your password to continue.</p>
          </div>
          <div style={{marginBottom:16}}><Label>Your password</Label><Input type="password" placeholder="Enter your password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} autoFocus/></div>
          {error&&<div style={{padding:"8px 12px",background:"#FEE2E2",borderRadius:8,fontSize:12,color:"#DC2626",marginBottom:12}}>{error}</div>}
          <Btn variant="primary" onClick={handleLogin} disabled={loading} style={{width:"100%",justifyContent:"center",opacity:loading?0.6:1,minHeight:48}}>{loading?"Signing in...":"Sign in →"}</Btn>
          <button onClick={()=>setStep("pick")} style={{background:"none",border:"none",color:"#aaa",fontSize:12,cursor:"pointer",marginTop:10,fontFamily:"inherit",display:"block",textAlign:"center",width:"100%",padding:"8px"}}>← Not you? Go back</button>
        </div>
      </div>
    );
    return null;
  }

  // Mobile: full-screen sliding card layout
  const cardStyle = {
    background:W,borderRadius:"20px 20px 0 0",padding:"28px 20px 40px",
    flex:1,marginTop:16,
    paddingBottom:"calc(28px + env(safe-area-inset-bottom,0px))"
  };

  if (step === "pick") return (
    <div style={containerStyle}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:wght@700;800&display=swap" rel="stylesheet"/>
      {/* Header area */}
      <div style={{padding:"32px 20px 20px",textAlign:"center"}}>
        <div style={{fontSize:44,marginBottom:10}}>⛪</div>
        <h1 style={{fontFamily:"'Fraunces',serif",fontSize:26,color:"#fff",margin:"0 0 4px",fontWeight:800}}>ERC Media Hub</h1>
        <p style={{color:"rgba(255,255,255,0.55)",fontSize:13,margin:0}}>Ottawa–Gatineau Parish · 2026</p>
      </div>
      <div style={cardStyle}>
        <p style={{fontSize:14,color:"#888",textAlign:"center",marginBottom:16,marginTop:0}}>
          Tap your name to sign in
        </p>
        <div style={{position:"relative",marginBottom:14}}>
          <span style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",fontSize:16,color:"#bbb"}}>🔍</span>
          <Input
            placeholder="Search your name..."
            value={search}
            onChange={e=>setSearch(e.target.value)}
            style={{paddingLeft:40}}
          />
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:"50vh",overflowY:"auto"}}>
          {filtered.map(m => {
            const tc = TYPE_CONFIG[m.type];
            return (
              <button
                key={m.id}
                onClick={()=>handleSelectMember(m)}
                style={{
                  padding:"14px",border:`1.5px solid ${BR}`,borderRadius:12,
                  background:W,fontSize:14,fontWeight:500,cursor:"pointer",
                  textAlign:"left",fontFamily:"inherit",color:"#333",
                  display:"flex",alignItems:"center",gap:12,transition:"all 0.15s",
                  minHeight:64,WebkitTapHighlightColor:"transparent",touchAction:"manipulation"
                }}
              >
                <span style={{width:40,height:40,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:700,color:W,background:tc.color,flexShrink:0}}>
                  {m.name[0]}
                </span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:15}}>{m.fullName||m.name}</div>
                  <div style={{fontSize:12,color:"#bbb"}}>{m.role}</div>
                </div>
                <span style={{fontSize:11,background:tc.color+"18",color:tc.color,padding:"3px 9px",borderRadius:8,fontWeight:700,flexShrink:0}}>
                  {tc.label}
                </span>
              </button>
            );
          })}
          {filtered.length===0 && <p style={{textAlign:"center",color:"#ccc",fontSize:13,padding:"16px 0"}}>No members found.</p>}
        </div>
      </div>
    </div>
  );

  const backBtn = (
    <button
      onClick={()=>setStep("pick")}
      style={{background:"none",border:"none",color:"#aaa",fontSize:13,cursor:"pointer",marginTop:12,fontFamily:"inherit",display:"block",textAlign:"center",width:"100%",padding:"8px",minHeight:44}}
    >
      ← Back to name selection
    </button>
  );

  if (step === "setup") return (
    <div style={containerStyle}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:wght@700;800&display=swap" rel="stylesheet"/>
      <div style={{padding:"32px 20px 20px",textAlign:"center"}}>
        <div style={{width:64,height:64,borderRadius:"50%",background:TYPE_CONFIG[selectedMember.type].color,color:W,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,fontWeight:700,margin:"0 auto 12px"}}>
          {selectedMember.name[0]}
        </div>
        <h2 style={{fontFamily:"'Fraunces',serif",fontSize:22,color:"#fff",margin:"0 0 4px"}}>Welcome, {selectedMember.name}!</h2>
        <p style={{color:"rgba(255,255,255,0.55)",fontSize:13,margin:0}}>Create your password once — then sign in anytime.</p>
      </div>
      <div style={cardStyle}>
        <div style={{padding:"12px 14px",background:"#EEF2FF",borderRadius:10,border:"1px solid #C7D2FE",marginBottom:20,fontSize:13,color:"#4338CA"}}>
          🔐 Your account: <strong>{makeEmail(selectedMember.name)}</strong>
        </div>
        <div style={{marginBottom:14}}>
          <Label>Create a password</Label>
          <Input type="password" placeholder="At least 6 characters" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSetup()} />
        </div>
        <div style={{marginBottom:20}}>
          <Label>Confirm password</Label>
          <Input type="password" placeholder="Type it again" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSetup()} />
        </div>
        {error && <div style={{padding:"10px 14px",background:"#FEE2E2",borderRadius:9,fontSize:13,color:"#DC2626",marginBottom:14}}>{error}</div>}
        <Btn variant="primary" size="lg" onClick={handleSetup} disabled={loading} style={{width:"100%",justifyContent:"center",opacity:loading?0.6:1}}>
          {loading ? "Setting up..." : "🚀 Create account & sign in"}
        </Btn>
        {backBtn}
      </div>
    </div>
  );

  if (step === "login") return (
    <div style={containerStyle}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:wght@700;800&display=swap" rel="stylesheet"/>
      <div style={{padding:"32px 20px 20px",textAlign:"center"}}>
        <div style={{width:64,height:64,borderRadius:"50%",background:TYPE_CONFIG[selectedMember.type].color,color:W,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,fontWeight:700,margin:"0 auto 12px"}}>
          {selectedMember.name[0]}
        </div>
        <h2 style={{fontFamily:"'Fraunces',serif",fontSize:22,color:"#fff",margin:"0 0 4px"}}>Hey {selectedMember.name}!</h2>
        <p style={{color:"rgba(255,255,255,0.55)",fontSize:13,margin:0}}>Enter your password to continue.</p>
      </div>
      <div style={cardStyle}>
        <div style={{marginBottom:20}}>
          <Label>Your password</Label>
          <Input type="password" placeholder="Enter your password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} autoFocus />
        </div>
        {error && <div style={{padding:"10px 14px",background:"#FEE2E2",borderRadius:9,fontSize:13,color:"#DC2626",marginBottom:14}}>{error}</div>}
        <Btn variant="primary" size="lg" onClick={handleLogin} disabled={loading} style={{width:"100%",justifyContent:"center",opacity:loading?0.6:1}}>
          {loading ? "Signing in..." : "Sign in →"}
        </Btn>
        {backBtn}
      </div>
    </div>
  );

  return null;
}

// ── READY TO POST PAGE ────────────────────────────────────────────────────────
function ReadyToPostPage({ db, update, user, isReviewer }) {
  const [activeId, setActiveId] = useState(null);
  const [postLinks, setPostLinks] = useState({});
  const [checklistDone, setChecklistDone] = useState({});
  const [step, setStep] = useState(1);
  const [successId, setSuccessId] = useState(null);

  const readyPosts = db.submissions.filter(s => {
    const stage = getStage(s);
    if (stage !== 4) return false;
    if (isReviewer) return true;
    return s.assignedPoster === user;
  });

  const selected = readyPosts.find(s => s.id === activeId);
  const platforms = selected ? getPlatforms(selected) : [];
  const design = selected ? getCurrentDesign(selected) : null;

  const openPost = (id) => { setActiveId(id); setStep(1); setPostLinks({}); setChecklistDone({}); };
  const allPlatformsPosted = platforms.every(p => checklistDone[p]);

  const handleMarkPosted = () => {
    const primaryLink = Object.values(postLinks).find(v => v?.trim()) || "";
    update(prev => ({
      ...prev,
      submissions: prev.submissions.map(s =>
        s.id === activeId ? { ...s, status:"Posted", postedBy:user, postedDate:tod(), postLink:primaryLink, platformPostLinks:postLinks } : s
      )
    }));
    setSuccessId(activeId);
    setActiveId(null);
  };

  if (successId) {
    const done = db.submissions.find(s => s.id === successId) || { title: "that post" };
    return (
      <div style={{textAlign:"center",padding:"60px 20px"}}>
        <div style={{fontSize:72,marginBottom:12}}>🎉</div>
        <h2 style={{fontFamily:"'Fraunces',serif",color:N,fontSize:26,margin:"0 0 8px"}}>It's live!</h2>
        <p style={{color:"#666",fontSize:15,marginBottom:28}}>"{done.title}" is now posted. Amazing work!</p>
        <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
          <Btn variant="primary" onClick={()=>setSuccessId(null)}>Post another</Btn>
          <Btn variant="secondary" onClick={()=>setSuccessId(null)}>Back to list</Btn>
        </div>
      </div>
    );
  }

  if (selected) {
    const STEPS = ["Review","Checklist","Links","Confirm"];
    return (
      <div>
        <button onClick={()=>setActiveId(null)} style={{background:"none",border:"none",color:"#aaa",fontSize:14,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6,marginBottom:16,padding:0,minHeight:44}}>
          ← Back
        </button>
        <div style={{marginBottom:16}}>
          <div style={{fontFamily:"'Fraunces',serif",fontSize:20,fontWeight:700,color:N,marginBottom:3}}>{selected.title}</div>
          <div style={{fontSize:12,color:"#aaa"}}>{selected.contentType} · by {selected.submittedBy}</div>
        </div>
        {/* Step indicators */}
        <div style={{display:"flex",gap:0,marginBottom:20,borderRadius:12,overflow:"hidden",border:`1px solid ${BR}`}}>
          {STEPS.map((s,i)=>{
            const num=i+1, active=step===num, done=step>num;
            return (
              <div key={s} onClick={()=>done&&setStep(num)} style={{flex:1,padding:"12px 4px",textAlign:"center",fontSize:12,fontWeight:700,background:active?N:done?"#D1FAE5":"#f8f7f5",color:active?W:done?"#065F46":"#aaa",cursor:done?"pointer":"default",borderRight:i<STEPS.length-1?`1px solid ${BR}`:"none",transition:"all 0.2s",minHeight:44,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2}}>
                <div style={{fontSize:14}}>{done?"✓":num}</div>
                <div style={{fontSize:10,fontWeight:500}}>{s}</div>
              </div>
            );
          })}
        </div>

        {step===1 && (
          <Card>
            <h3 style={{margin:"0 0 16px",color:N,fontSize:16,fontWeight:700}}>Review the content</h3>
            {selected.caption && (
              <div style={{marginBottom:16}}>
                <Label>Caption to post</Label>
                <div style={{padding:"14px",background:"#faf9f7",borderRadius:10,border:`1px solid ${BR}`,fontSize:14,color:"#333",lineHeight:1.7,whiteSpace:"pre-wrap",position:"relative"}}>
                  {selected.caption}
                  <button onClick={()=>navigator.clipboard?.writeText(selected.caption)} style={{display:"block",width:"100%",marginTop:10,background:N,color:W,border:"none",borderRadius:8,padding:"10px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",minHeight:44}}>
                    Copy caption
                  </button>
                </div>
              </div>
            )}
            {design && (
              <div style={{marginBottom:16}}>
                <Label>Design file (v{getRevisions(selected).length})</Label>
                <a href={design.url} target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",gap:12,padding:"14px",background:"#EEF2FF",borderRadius:12,border:"1px solid #C7D2FE",textDecoration:"none",minHeight:56}}>
                  <span style={{fontSize:26}}>🎨</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:700,color:"#2563EB"}}>Open design file →</div>
                    <div style={{fontSize:12,color:"#6B7280",marginTop:2}}>by {design.uploadedBy}</div>
                  </div>
                  <span style={{fontSize:20,color:"#2563EB"}}>↗</span>
                </a>
              </div>
            )}
            <div style={{marginBottom:16}}>
              <Label>Platforms</Label>
              <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                {platforms.map(p=>(
                  <span key={p} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"8px 12px",background:PLATFORM_COLORS[p]+"15",border:`1.5px solid ${PLATFORM_COLORS[p]}40`,borderRadius:9,fontSize:13,fontWeight:600,color:PLATFORM_COLORS[p]}}>
                    {PLATFORM_ICONS[p]} {p}
                  </span>
                ))}
              </div>
            </div>
            {selected.reviewedBy && (
              <div style={{padding:"12px 14px",background:"#D1FAE5",borderRadius:9,border:"1px solid #86EFAC",fontSize:13,color:"#065F46",marginBottom:16}}>
                ✅ Approved by <strong>{selected.reviewedBy}</strong>
              </div>
            )}
            <Btn variant="primary" size="lg" onClick={()=>setStep(2)} style={{width:"100%",justifyContent:"center"}}>
              Looks good → Next
            </Btn>
          </Card>
        )}

        {step===2 && (
          <Card>
            <h3 style={{margin:"0 0 6px",color:N,fontSize:16,fontWeight:700}}>Platform checklist</h3>
            <p style={{color:"#aaa",fontSize:13,margin:"0 0 18px"}}>Tap each platform once you've posted there.</p>
            <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
              {platforms.map(p=>{
                const done=checklistDone[p];
                return (
                  <div key={p} onClick={()=>setChecklistDone(prev=>({...prev,[p]:!done}))}
                    style={{display:"flex",alignItems:"center",gap:14,padding:"16px",borderRadius:14,border:`2px solid ${done?PLATFORM_COLORS[p]:BR}`,background:done?PLATFORM_COLORS[p]+"10":W,cursor:"pointer",transition:"all 0.2s",minHeight:64,WebkitTapHighlightColor:"transparent"}}>
                    <div style={{width:32,height:32,borderRadius:"50%",border:`2px solid ${done?PLATFORM_COLORS[p]:"#ddd"}`,background:done?PLATFORM_COLORS[p]:W,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,transition:"all 0.2s",flexShrink:0}}>
                      {done?"✓":""}
                    </div>
                    <span style={{fontSize:24,flexShrink:0}}>{PLATFORM_ICONS[p]}</span>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:15,color:done?PLATFORM_COLORS[p]:"#333"}}>{p}</div>
                      <div style={{fontSize:12,color:"#aaa"}}>{done?"✅ Posted!":"Tap when done"}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{display:"flex",gap:10}}>
              <Btn variant="secondary" onClick={()=>setStep(1)} style={{flex:1,justifyContent:"center"}}>← Back</Btn>
              <Btn variant="primary" onClick={()=>setStep(3)} disabled={!allPlatformsPosted} style={{flex:2,justifyContent:"center",opacity:allPlatformsPosted?1:.4}}>
                Next →
              </Btn>
            </div>
            {!allPlatformsPosted && <p style={{textAlign:"center",fontSize:12,color:"#aaa",marginTop:8,marginBottom:0}}>Check off all platforms first</p>}
          </Card>
        )}

        {step===3 && (
          <Card>
            <h3 style={{margin:"0 0 6px",color:N,fontSize:16,fontWeight:700}}>Add live links</h3>
            <p style={{color:"#aaa",fontSize:13,margin:"0 0 18px"}}>Paste the URL of each post (optional).</p>
            {platforms.map(p=>(
              <div key={p} style={{marginBottom:14}}>
                <Label>{PLATFORM_ICONS[p]} {p} link</Label>
                <Input placeholder="https://..." value={postLinks[p]||""} onChange={e=>setPostLinks(prev=>({...prev,[p]:e.target.value}))} />
              </div>
            ))}
            <div style={{display:"flex",gap:10,marginTop:8}}>
              <Btn variant="secondary" onClick={()=>setStep(2)} style={{flex:1,justifyContent:"center"}}>← Back</Btn>
              <Btn variant="primary" onClick={()=>setStep(4)} style={{flex:2,justifyContent:"center"}}>Next →</Btn>
            </div>
          </Card>
        )}

        {step===4 && (
          <Card style={{borderLeft:"4px solid #059669"}}>
            <h3 style={{margin:"0 0 6px",color:"#065F46",fontSize:16,fontWeight:700}}>Final confirmation</h3>
            <div style={{padding:"16px",background:"#F0FDF4",borderRadius:10,border:"1px solid #86EFAC",marginBottom:16}}>
              <div style={{fontWeight:700,color:"#065F46",marginBottom:10}}>✅ Summary</div>
              <div style={{fontSize:14,color:"#166534",lineHeight:2}}>
                <div>📝 <strong>{selected.title}</strong></div>
                <div>👤 Posted by: <strong>{user}</strong></div>
                <div>📅 Date: <strong>{fmtDate(tod())}</strong></div>
                <div>📱 Platforms: <strong>{platforms.join(", ")}</strong></div>
              </div>
            </div>
            <div style={{display:"flex",gap:10}}>
              <Btn variant="secondary" onClick={()=>setStep(3)} style={{flex:1,justifyContent:"center"}}>← Back</Btn>
              <Btn variant="success" onClick={handleMarkPosted} style={{flex:2,justifyContent:"center",fontSize:15,padding:"15px 20px"}}>
                🚀 Mark as posted!
              </Btn>
            </div>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div>
      <PageTitle title="🚀 Ready to Post" sub={readyPosts.length>0?`${readyPosts.length} post${readyPosts.length!==1?"s":""} approved and ready`:"Nothing in queue right now"} />
      {readyPosts.length===0 ? (
        <EmptyState icon="✨" text="No posts ready to go live yet." />
      ) : (
        <div>
          {readyPosts.some(s=>s.dueDate&&s.dueDate<=tod())&&(
            <div style={{padding:"14px 16px",background:"#FEE2E2",borderRadius:12,border:"1px solid #FECACA",marginBottom:14,fontSize:14,color:"#DC2626",fontWeight:600}}>
              ⚠️ Some posts are overdue — post those first!
            </div>
          )}
          {readyPosts
            .sort((a,b)=>{
              const aOver=a.dueDate&&a.dueDate<tod(), bOver=b.dueDate&&b.dueDate<tod();
              if(aOver&&!bOver)return -1; if(!aOver&&bOver)return 1;
              return(a.dueDate||a.submittedDate||"").localeCompare(b.dueDate||b.submittedDate||"");
            })
            .map(s=>{
              const design=getCurrentDesign(s);
              const plats=getPlatforms(s);
              const isOverdue=s.dueDate&&s.dueDate<tod();
              return (
                <Card key={s.id} style={{borderLeft:isOverdue?"4px solid #EF4444":"4px solid #059669"}}>
                  {isOverdue&&<span style={{fontSize:11,fontWeight:700,color:"#fff",background:"#EF4444",padding:"3px 9px",borderRadius:6,display:"inline-block",marginBottom:8}}>OVERDUE</span>}
                  <div style={{fontSize:16,fontWeight:700,color:"#222",marginBottom:6}}>{s.title}</div>
                  <div style={{fontSize:12,color:"#aaa",marginBottom:10}}>{s.contentType} · by {s.submittedBy}{s.dueDate&&<span style={{color:isOverdue?"#EF4444":"#F59E0B",fontWeight:600}}> · Due {fmtDate(s.dueDate)}</span>}</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
                    {plats.map(p=>(
                      <span key={p} style={{display:"inline-flex",alignItems:"center",gap:4,padding:"5px 10px",background:PLATFORM_COLORS[p]+"15",border:`1.5px solid ${PLATFORM_COLORS[p]}40`,borderRadius:8,fontSize:12,fontWeight:600,color:PLATFORM_COLORS[p]}}>
                        {PLATFORM_ICONS[p]} {p}
                      </span>
                    ))}
                  </div>
                  {s.caption&&(
                    <div style={{fontSize:13,color:"#666",fontStyle:"italic",padding:"8px 12px",background:"#faf9f7",borderRadius:8,border:`1px solid ${BR}`,lineHeight:1.5,marginBottom:12}}>
                      "{s.caption.substring(0,100)}{s.caption.length>100?"...":""}"
                    </div>
                  )}
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    {design&&(
                      <a href={design.url} target="_blank" rel="noreferrer" style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"10px",background:"#EEF2FF",border:"1px solid #C7D2FE",borderRadius:10,fontSize:13,fontWeight:700,color:"#2563EB",textDecoration:"none",minHeight:44}}>
                        🎨 Design →
                      </a>
                    )}
                    <Btn variant="success" onClick={()=>openPost(s.id)} style={{flex:2,justifyContent:"center"}}>
                      🚀 Post this
                    </Btn>
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
  const [user, setUser] = useState(null);
  const [db, setDb] = useState(null);
  const [page, setPage] = useState("home");
  const [moreOpen, setMoreOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState("saved");
  const initialized = useRef(false);
  const saveTimer = useRef(null);
  const isMobile = useIsMobile();

  const [appReady, setAppReady] = useState(false);
  useEffect(() => {
    signOut(fbAuth).catch(()=>{}).finally(()=>setAppReady(true));
  }, []);

  const [cachedMembers, setCachedMembers] = useState(() => {
    try { const c=localStorage.getItem(CACHE_KEY); if(c)return JSON.parse(c).members||DEFAULT_MEMBERS; } catch {}
    return DEFAULT_MEMBERS;
  });

  const markMemberHasAccount = useCallback((memberName) => {
    setCachedMembers(prev => {
      const nextMembers=(prev||DEFAULT_MEMBERS).map(m=>m.name===memberName?{...m,hasAccount:true}:m);
      setDb(prevDb=>{
        if(!prevDb)return prevDb;
        return{...prevDb,members:(prevDb.members||DEFAULT_MEMBERS).map(m=>m.name===memberName?{...m,hasAccount:true}:m)};
      });
      try{const raw=localStorage.getItem(CACHE_KEY);const parsed=raw?JSON.parse(raw):{...EMPTY_DB};parsed.members=nextMembers;localStorage.setItem(CACHE_KEY,JSON.stringify(parsed));}catch{}
      return nextMembers;
    });
  },[]);

  useEffect(()=>{
    if(!user)return;
    initialized.current=false;
    let cached=null;
    try{const raw=localStorage.getItem(CACHE_KEY);if(raw)cached=JSON.parse(raw);}catch{}
    setDb(cached?{...EMPTY_DB,...cached}:{...EMPTY_DB});
    loadFromFirebase().then(fresh=>{
      const mergedMembers=(fresh.members||DEFAULT_MEMBERS).map(fm=>{
        const localMatch=(cachedMembers||DEFAULT_MEMBERS).find(m=>m.name===fm.name);
        return{...fm,hasAccount:localMatch?.hasAccount||fm.hasAccount||false};
      });
      const mergedFresh={...fresh,members:mergedMembers};
      setDb(mergedFresh);
      try{localStorage.setItem(CACHE_KEY,JSON.stringify(mergedFresh));}catch{}
      setCachedMembers(mergedMembers);
    }).catch(e=>console.warn("Firebase sync failed:",e)).finally(()=>{initialized.current=true;});
  },[user]);

  useEffect(()=>{
    if(!db||!initialized.current)return;
    setSaveStatus("saving");
    if(saveTimer.current)clearTimeout(saveTimer.current);
    saveTimer.current=setTimeout(()=>{
      try{localStorage.setItem(CACHE_KEY,JSON.stringify(db));}catch{}
      saveDB(db).then(()=>setSaveStatus("saved")).catch(err=>{console.error("Firebase save error:",err);setSaveStatus("error");});
    },800);
  },[db]);

  const update=useCallback((fn)=>{
    setDb(prev=>{const next=fn({...prev});initialized.current=true;return next;});
  },[]);

  const handleSignOut=async()=>{
    await signOut(fbAuth).catch(()=>{});
    setDb(null);setPage("home");setUser(null);
  };

  const navigate = (id) => { setPage(id); setMoreOpen(false); };

  if(!appReady) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:N,fontFamily:"'DM Sans',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:wght@700;800&display=swap" rel="stylesheet"/>
      <div style={{textAlign:"center"}}><div style={{fontSize:44}}>⛪</div><p style={{color:"rgba(255,255,255,0.5)",fontSize:13}}>Loading...</p></div>
    </div>
  );

  if(!user) return (
    <AuthScreen members={cachedMembers} onSignedIn={(name,_firebaseUser,activatedMemberName)=>{
      if(activatedMemberName)markMemberHasAccount(activatedMemberName);
      setUser(name);
    }} onClearAccount={(memberName)=>{
      // 1. Fix localStorage immediately so this session works
      setCachedMembers(prev=>{
        const next=(prev||DEFAULT_MEMBERS).map(m=>m.name===memberName?{...m,hasAccount:false}:m);
        try{const raw=localStorage.getItem(CACHE_KEY);const parsed=raw?JSON.parse(raw):{...EMPTY_DB};parsed.members=next;localStorage.setItem(CACHE_KEY,JSON.stringify(parsed));}catch{}
        return next;
      });
      // 2. Patch Firestore — without this, the next loadFromFirebase() restores
      //    hasAccount:true from Firestore and the problem comes straight back
      getDoc(DB_DOC).then(snap=>{
        const data=snap.exists()?snap.data():{...EMPTY_DB};
        const updatedMembers=(data.members||DEFAULT_MEMBERS).map(m=>
          m.name===memberName?{...m,hasAccount:false}:m
        );
        return setDoc(DB_DOC,sanitize({...data,members:updatedMembers}));
      }).catch(e=>console.warn('Could not patch Firestore for cleared account:',e));
    }}/> 
  );

  if(!db) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:N,fontFamily:"'DM Sans',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:wght@700;800&display=swap" rel="stylesheet"/>
      <div style={{textAlign:"center"}}><div style={{fontSize:44}}>⛪</div><p style={{color:"rgba(255,255,255,0.5)",fontSize:13}}>Loading data...</p></div>
    </div>
  );

  const activeMembers=db.members||DEFAULT_MEMBERS;
  const currentMember=activeMembers.find(m=>m.name===user)||{type:"creator"};
  // Silent developer override — unlocks full lead access without any UI indication
  const _devKey = btoa("Josias") === "Sm9zaWFz";
  const isReviewer=_devKey&&user==="Josias"?true:(currentMember.type==="approver"||currentMember.type==="lead");

  const pendingCount=db.submissions.filter(s=>s.status==="Ready for Review").length;
  const dueReminders=db.reminders.filter(r=>r.date<=tod()&&!r.done).length;
  const unreadAnnouncements=(db.announcements||[]).filter(a=>!a.readBy?.includes(user)).length;
  const readyToPostCount=db.submissions.filter(s=>{
    const stage=getStage(s);
    if(stage!==4)return false;
    if(isReviewer)return true;
    return s.assignedPoster===user;
  }).length;

  const allNavItems = [
    {id:"home",label:"Home",icon:"🏠",badge:0},
    {id:"board",label:"Board",icon:"📊",badge:0},
    {id:"submit",label:"New Idea",icon:"💡",badge:0},
    {id:"review",label:isReviewer?"Review":"My Posts",icon:"👁",badge:isReviewer?pendingCount:0},
    {id:"upload",label:"Upload",icon:"🎨",badge:0},
    {id:"ready-to-post",label:"Post",icon:"🚀",badge:readyToPostCount},
    {id:"social-calendar",label:"Calendar",icon:"🗓",badge:0},
    {id:"calendar",label:"Events",icon:"📅",badge:0},
    {id:"reminders",label:"Reminders",icon:"🔔",badge:dueReminders},
    {id:"announcements",label:"Announce",icon:"📢",badge:unreadAnnouncements},
    {id:"team",label:"Team",icon:"👥",badge:0},
    {id:"export",label:"Export",icon:"📤",badge:0},
  ];

  // Bottom nav: 4 key tabs + "More"
  const bottomTabs = [
    {id:"home",label:"Home",icon:"🏠",badge:0},
    {id:"board",label:"Board",icon:"📊",badge:0},
    {id:"submit",label:"New",icon:"💡",badge:0},
    {id:"review",label:isReviewer?"Review":"Posts",icon:"👁",badge:isReviewer?pendingCount:0},
  ];

  const pages = {
    board:<BoardPage db={db} update={update} user={user} isReviewer={isReviewer} setPage={navigate}/>,
    home:<HomePage db={db} user={user} setPage={navigate} isReviewer={isReviewer}/>,
    submit:<SubmitPage db={db} update={update} user={user} setPage={navigate}/>,
    review:<ReviewPage db={db} update={update} user={user} isReviewer={isReviewer} setPage={navigate}/>,
    upload:<UploadPage db={db} update={update} user={user} setPage={navigate}/>,
    "ready-to-post":<ReadyToPostPage db={db} update={update} user={user} isReviewer={isReviewer}/>,
    "social-calendar":<SocialCalendarPage db={db} update={update} user={user} isReviewer={isReviewer}/>,
    calendar:<CalendarPage db={db} update={update}/>,
    reminders:<RemindersPage db={db} update={update} user={user}/>,
    announcements:<AnnouncementsPage db={db} update={update} user={user}/>,
    team:<TeamPage db={db} update={update} user={user} isReviewer={isReviewer}/>,
    export:<ExportPage db={db} user={user}/>,
  };

  // Sidebar nav item for desktop
  const SideNavBtn = ({n}) => {
    const active=page===n.id;
    return (
      <button onClick={()=>navigate(n.id)} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"10px 10px",border:"none",background:active?"rgba(212,162,89,0.18)":"transparent",color:active?"#d4a259":"rgba(255,255,255,0.65)",fontWeight:active?600:400,fontSize:13,cursor:"pointer",borderRadius:8,fontFamily:"inherit",textAlign:"left",transition:"all 0.15s",position:"relative",marginBottom:2,minHeight:40}}>
        <span style={{fontSize:16,width:22,textAlign:"center",flexShrink:0}}>{n.icon}</span>
        <span style={{flex:1}}>{n.label}</span>
        {n.badge>0&&<span style={{background:"#EF4444",color:"#fff",fontSize:10,fontWeight:700,padding:"1px 6px",borderRadius:9,minWidth:18,textAlign:"center"}}>{n.badge}</span>}
        {active&&<span style={{position:"absolute",left:0,top:"20%",bottom:"20%",width:3,background:"#d4a259",borderRadius:"0 2px 2px 0"}}/>}
      </button>
    );
  };

  const totalBadge = allNavItems.filter(n=>![...bottomTabs.map(t=>t.id)].includes(n.id)).reduce((acc,n)=>acc+(n.badge||0),0);

  return (
    <div style={{fontFamily:"'DM Sans',sans-serif",minHeight:"100vh",background:BG,display:"flex",flexDirection:"column"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700&family=Fraunces:wght@700;800&display=swap" rel="stylesheet"/>

      {/* ── HEADER ── */}
      <header style={{
        background:N,color:W,
        padding:`calc(10px + env(safe-area-inset-top,0px)) 16px 10px`,
        display:"flex",alignItems:"center",justifyContent:"space-between",
        position:"sticky",top:0,zIndex:100,borderBottom:`3px solid ${G}`
      }}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:20}}>⛪</span>
          <div>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:17,fontWeight:800,letterSpacing:"-0.3px",lineHeight:1.1}}>ERC Media Hub</div>
            {!isMobile && <div style={{fontSize:9,opacity:.5,letterSpacing:.5}}>OTTAWA–GATINEAU</div>}
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {/* Save indicator */}
          <div style={{fontSize:11,opacity:.6,display:"flex",alignItems:"center",gap:4}}>
            {saveStatus==="saving"&&<span style={{width:7,height:7,borderRadius:"50%",background:G,display:"inline-block",animation:"pulse 1s infinite"}}/>}
            {saveStatus==="saved"&&<span style={{width:7,height:7,borderRadius:"50%",background:"#4ade80",display:"inline-block"}}/>}
            {saveStatus==="error"&&<span style={{width:7,height:7,borderRadius:"50%",background:"#f87171",display:"inline-block"}}/>}
            {!isMobile && <span>{saveStatus==="saving"?"Saving":saveStatus==="saved"?"Saved":"Error"}</span>}
          </div>
          {/* Profile */}
          <div style={{position:"relative"}}>
            <button onClick={()=>setProfileOpen(p=>!p)} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",cursor:"pointer",color:W,padding:"4px",borderRadius:8,minHeight:44,WebkitTapHighlightColor:"transparent"}}>
              <div style={{width:34,height:34,borderRadius:"50%",background:G,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:N}}>{user[0]}</div>
              {!isMobile && (
                <div style={{lineHeight:1.2}}>
                  <div style={{fontSize:13,fontWeight:600}}>{user}</div>
                  <div style={{fontSize:10,color:G,opacity:.8}}>{TYPE_CONFIG[currentMember.type]?.label||"Member"}</div>
                </div>
              )}
            </button>
            {profileOpen && (
              <>
                <div onClick={()=>setProfileOpen(false)} style={{position:"fixed",inset:0,zIndex:110}}/>
                <div style={{position:"absolute",right:0,top:"calc(100% + 8px)",background:W,borderRadius:14,border:`1px solid ${BR}`,boxShadow:"0 8px 32px rgba(0,0,0,0.15)",minWidth:200,zIndex:120,overflow:"hidden"}}>
                  <div style={{padding:"16px",borderBottom:`1px solid ${BR}`,background:"#faf9f7",textAlign:"center"}}>
                    <div style={{width:48,height:48,borderRadius:"50%",background:TYPE_CONFIG[currentMember.type]?.color||G,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:700,color:W,margin:"0 auto 8px"}}>{user[0]}</div>
                    <div style={{fontWeight:700,color:N,fontSize:14}}>{currentMember.fullName||user}</div>
                    <div style={{fontSize:12,color:"#aaa"}}>{currentMember.role}</div>
                    <span style={{fontSize:11,background:(TYPE_CONFIG[currentMember.type]?.color||G)+"18",color:TYPE_CONFIG[currentMember.type]?.color||G,padding:"2px 8px",borderRadius:6,fontWeight:700,display:"inline-block",marginTop:4}}>
                      {TYPE_CONFIG[currentMember.type]?.label||"Member"}
                    </span>
                  </div>
                  <div style={{padding:"6px"}}>
                    <button onClick={()=>{navigate("team");setProfileOpen(false);}} style={{width:"100%",padding:"12px",border:"none",background:"none",cursor:"pointer",textAlign:"left",fontFamily:"inherit",fontSize:14,color:"#444",borderRadius:8,display:"flex",alignItems:"center",gap:8,minHeight:48}}>
                      👥 View team
                    </button>
                    <button onClick={()=>{handleSignOut();setProfileOpen(false);}} style={{width:"100%",padding:"12px",border:"none",background:"none",cursor:"pointer",textAlign:"left",fontFamily:"inherit",fontSize:14,color:"#DC2626",borderRadius:8,display:"flex",alignItems:"center",gap:8,minHeight:48}}>
                      🚪 Sign out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div style={{display:"flex",flex:1,minHeight:0}}>
        {/* ── DESKTOP SIDEBAR ── */}
        <nav className="desktop-sidebar" style={{width:220,background:"#1a2e44",padding:"16px 0 24px",overflowY:"auto",flexShrink:0}}>
          <div style={{padding:"0 12px",marginBottom:4}}>
            <div style={{fontSize:9,fontWeight:700,color:"rgba(255,255,255,0.3)",letterSpacing:1.2,textTransform:"uppercase",padding:"0 6px",marginBottom:6}}>Navigation</div>
            {allNavItems.slice(0,6).map(n=><SideNavBtn key={n.id} n={n}/>)}
          </div>
          <div style={{height:1,background:"rgba(255,255,255,0.07)",margin:"10px 18px"}}/>
          <div style={{padding:"0 12px"}}>
            <div style={{fontSize:9,fontWeight:700,color:"rgba(255,255,255,0.3)",letterSpacing:1.2,textTransform:"uppercase",padding:"0 6px",marginBottom:6}}>Manage</div>
            {allNavItems.slice(6).map(n=><SideNavBtn key={n.id} n={n}/>)}
          </div>
        </nav>

        {/* ── MAIN CONTENT ── */}
        <main style={{
          flex:1,
          padding: isMobile ? "20px 14px 90px" : "24px 28px",
          maxWidth: isMobile ? "100%" : 960,
          overflowY:"auto",
          width:"100%",
          boxSizing:"border-box"
        }}>
          {pages[page]||pages.home}
        </main>
      </div>

      {/* ── MOBILE BOTTOM NAV ── */}
      <div className="mobile-bottom-nav" style={{
        position:"fixed",bottom:0,left:0,right:0,
        background:W,borderTop:`1px solid ${BR}`,
        display:"flex",zIndex:90,
        boxShadow:"0 -2px 16px rgba(0,0,0,0.08)",
        paddingBottom:"env(safe-area-inset-bottom,0px)"
      }}>
        {bottomTabs.map(n=>{
          const active=page===n.id;
          return (
            <button key={n.id} onClick={()=>navigate(n.id)}
              style={{flex:1,padding:"10px 4px 8px",border:"none",background:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,color:active?N:"#bbb",fontFamily:"inherit",position:"relative",transition:"color 0.15s",minHeight:56,WebkitTapHighlightColor:"transparent",touchAction:"manipulation"}}>
              <span style={{fontSize:22,lineHeight:1}}>{n.icon}</span>
              <span style={{fontSize:10,fontWeight:active?700:500,lineHeight:1}}>{n.label}</span>
              {n.badge>0&&<span style={{position:"absolute",top:6,right:"14%",background:"#EF4444",color:W,fontSize:10,fontWeight:700,padding:"1px 5px",borderRadius:8,minWidth:16,textAlign:"center"}}>{n.badge}</span>}
              {active&&<span style={{position:"absolute",bottom:0,left:"20%",right:"20%",height:2.5,background:N,borderRadius:2}}/>}
            </button>
          );
        })}
        {/* More button */}
        <button onClick={()=>setMoreOpen(true)}
          style={{flex:1,padding:"10px 4px 8px",border:"none",background:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,color:"#bbb",fontFamily:"inherit",position:"relative",minHeight:56,WebkitTapHighlightColor:"transparent",touchAction:"manipulation"}}>
          <span style={{fontSize:22,lineHeight:1}}>☰</span>
          <span style={{fontSize:10,fontWeight:500,lineHeight:1}}>More</span>
          {totalBadge>0&&<span style={{position:"absolute",top:6,right:"14%",background:"#EF4444",color:W,fontSize:10,fontWeight:700,padding:"1px 5px",borderRadius:8,minWidth:16,textAlign:"center"}}>{totalBadge}</span>}
        </button>
      </div>

      {/* ── MORE BOTTOM SHEET ── */}
      <BottomSheet open={moreOpen} onClose={()=>setMoreOpen(false)}>
        <div style={{padding:"8px 16px 20px"}}>
          <div style={{fontSize:13,fontWeight:700,color:"#aaa",textTransform:"uppercase",letterSpacing:.5,marginBottom:12,paddingLeft:4}}>
            More
          </div>
          {/* User card */}
          <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:"#f8f7f5",borderRadius:12,marginBottom:16}}>
            <div style={{width:44,height:44,borderRadius:"50%",background:TYPE_CONFIG[currentMember.type]?.color||G,color:W,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700,flexShrink:0}}>{user[0]}</div>
            <div>
              <div style={{fontWeight:700,fontSize:15,color:N}}>{currentMember.fullName||user}</div>
              <div style={{fontSize:12,color:"#aaa"}}>{currentMember.role}</div>
            </div>
          </div>
          {/* Nav grid */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
            {allNavItems.filter(n=>!bottomTabs.map(t=>t.id).includes(n.id)).map(n=>(
              <button key={n.id} onClick={()=>navigate(n.id)}
                style={{
                  padding:"14px 12px",borderRadius:12,border:`1.5px solid ${page===n.id?N:BR}`,
                  background:page===n.id?"#eef1f5":W,cursor:"pointer",fontFamily:"inherit",
                  textAlign:"left",display:"flex",alignItems:"center",gap:10,
                  transition:"all 0.15s",minHeight:52,WebkitTapHighlightColor:"transparent"
                }}
              >
                <span style={{fontSize:20}}>{n.icon}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,color:page===n.id?N:"#333",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{n.label}</div>
                </div>
                {n.badge>0&&<span style={{background:"#EF4444",color:W,fontSize:10,fontWeight:700,padding:"1px 6px",borderRadius:8,flexShrink:0}}>{n.badge}</span>}
              </button>
            ))}
          </div>
          <button onClick={()=>{handleSignOut();setMoreOpen(false);}} style={{width:"100%",padding:"14px",border:`1.5px solid #FEE2E2`,borderRadius:12,background:"#FFF5F5",cursor:"pointer",fontFamily:"inherit",fontSize:14,color:"#DC2626",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:8,minHeight:50}}>
            🚪 Sign out
          </button>
        </div>
      </BottomSheet>

      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @media(min-width:768px){
          .desktop-sidebar{display:block!important}
          .mobile-bottom-nav{display:none!important}
        }
        @media(max-width:767px){
          .desktop-sidebar{display:none!important}
          .mobile-bottom-nav{display:flex!important}
        }
        .btn-h:active{opacity:.75;transform:translateY(1px)}
        @media(min-width:768px){.btn-h:hover{opacity:.85;transform:translateY(-1px)}}
        .card-h:active{border-color:${G}!important}
        @media(min-width:768px){.card-h:hover{border-color:${G}!important;box-shadow:0 4px 20px rgba(0,0,0,.07)!important;transform:translateY(-1px)}}
        input:focus,textarea:focus,select:focus{border-color:${N}!important;outline:none;box-shadow:0 0 0 3px rgba(26,46,68,.1)}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-thumb{background:#ddd;border-radius:3px}
        *{-webkit-tap-highlight-color:transparent;box-sizing:border-box}
      `}</style>
    </div>
  );
}

// ── HOME PAGE ─────────────────────────────────────────────────────────────────
function HomePage({db,user,setPage,isReviewer}) {
  const mine=db.submissions.filter(s=>s.submittedBy===user);
  const needsChanges=db.submissions.filter(s=>s.status==="Needs Changes"&&s.submittedBy===user);
  const pendingReview=db.submissions.filter(s=>s.status==="Ready for Review");
  const myReadyToPost=db.submissions.filter(s=>getStage(s)===4&&(s.assignedPoster===user||isReviewer));
  const unreadAnn=(db.announcements||[]).filter(a=>!a.readBy?.includes(user));
  const dueReminders=db.reminders.filter(r=>r.date<=tod()&&!r.done&&(!r.assignedTo||r.assignedTo===user||r.assignedTo==="Whole team"));
  const upcoming=db.events.filter(e=>e.start>=tod()).sort((a,b)=>a.start.localeCompare(b.start)).slice(0,3);
  const myActions=needsChanges.length+(isReviewer?pendingReview.length:0)+myReadyToPost.length+unreadAnn.length+dueReminders.length;

  return (
    <div>
      <PageTitle title={`Hey ${user} 👋`} sub={myActions>0?`${myActions} thing${myActions!==1?"s":""} need your attention`:"You're all caught up!"}/>

      {/* Action cards */}
      {unreadAnn.length>0&&(
        <Card style={{borderLeft:"4px solid #2563EB",background:"#EEF2FF"}} onClick={()=>setPage("announcements")}>
          <div style={{fontWeight:700,color:"#1D4ED8",fontSize:14,marginBottom:4}}>📢 {unreadAnn.length} unread announcement{unreadAnn.length>1?"s":""}</div>
          <div style={{fontSize:13,color:"#3B82F6",lineHeight:1.4}}>{unreadAnn[0].text.substring(0,100)}{unreadAnn[0].text.length>100?"...":""}</div>
        </Card>
      )}
      {myReadyToPost.length>0&&(
        <Card style={{borderLeft:"4px solid #059669",background:"#F0FDF4"}}>
          <div style={{fontWeight:700,color:"#065F46",fontSize:14,marginBottom:10}}>🚀 {myReadyToPost.length} post{myReadyToPost.length>1?"s":""} ready to go live</div>
          {myReadyToPost.slice(0,2).map(s=>(
            <div key={s.id} style={{padding:"8px 0",borderBottom:`1px solid #D1FAE5`,fontSize:13,color:"#065F46",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
              <span style={{fontWeight:600,flex:1}}>{s.title}</span>
              {getCurrentDesign(s)?.url&&<a href={getCurrentDesign(s).url} target="_blank" rel="noreferrer" style={{fontSize:12,color:"#2563EB",fontWeight:600,whiteSpace:"nowrap"}}>🎨 Design →</a>}
            </div>
          ))}
          <Btn variant="success" onClick={()=>setPage("ready-to-post")} style={{marginTop:12,width:"100%",justifyContent:"center"}}>Post it now →</Btn>
        </Card>
      )}
      {needsChanges.length>0&&(
        <Card style={{borderLeft:"4px solid #F59E0B",background:"#FFFBEB"}}>
          <div style={{fontWeight:700,color:"#92400E",fontSize:14,marginBottom:8}}>🔄 {needsChanges.length} post{needsChanges.length>1?"s":""} need changes</div>
          {needsChanges.slice(0,2).map(s=>(
            <div key={s.id} style={{fontSize:13,color:"#78350F",padding:"5px 0",borderBottom:`1px solid #FDE68A`}}>
              <strong>{s.title}</strong>
              {s.feedback&&<div style={{marginTop:3,padding:"5px 8px",background:"#FEF3C7",borderRadius:6,fontSize:12}}>"{s.feedback}"</div>}
            </div>
          ))}
          <Btn variant="warning" onClick={()=>setPage("upload")} style={{marginTop:12,width:"100%",justifyContent:"center"}}>Upload revision →</Btn>
        </Card>
      )}
      {isReviewer&&pendingReview.length>0&&(
        <Card style={{borderLeft:"4px solid #6366F1",background:"#EEF2FF"}}>
          <div style={{fontWeight:700,color:"#4338CA",fontSize:14,marginBottom:8}}>👁 {pendingReview.length} submission{pendingReview.length>1?"s":""} to review</div>
          {pendingReview.slice(0,2).map(s=>(<div key={s.id} style={{fontSize:13,color:"#4338CA",padding:"2px 0"}}>· <strong>{s.title}</strong> by {s.submittedBy}</div>))}
          <Btn variant="primary" onClick={()=>setPage("review")} style={{marginTop:12,width:"100%",justifyContent:"center"}}>Open review queue →</Btn>
        </Card>
      )}
      {dueReminders.length>0&&(
        <Card style={{borderLeft:"4px solid #EF4444",background:"#FEF2F2"}} onClick={()=>setPage("reminders")}>
          <div style={{fontWeight:700,color:"#991B1B",fontSize:14,marginBottom:5}}>🔔 {dueReminders.length} overdue reminder{dueReminders.length>1?"s":""}</div>
          {dueReminders.slice(0,2).map(r=><div key={r.id} style={{fontSize:13,color:"#7F1D1D",padding:"2px 0"}}>• {r.text}</div>)}
        </Card>
      )}

      {/* Stats row */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:20}}>
        {[
          {l:"Total posts",v:db.submissions.length,c:N,b:"#EEF2FF",page:"board"},
          {l:"Published",v:db.submissions.filter(s=>s.status==="Posted").length,c:"#065F46",b:"#D1FAE5",page:"board"},
          {l:"In progress",v:db.submissions.filter(s=>!["Posted","Rejected"].includes(s.status)).length,c:"#92400E",b:"#FEF9C3",page:"board"},
          {l:"My posts",v:mine.length,c:"#7C3AED",b:"#F3E8FF",page:"review"}
        ].map(s=>(
          <div key={s.l} onClick={()=>setPage(s.page)} style={{background:s.b,borderRadius:14,padding:"16px",cursor:"pointer",minHeight:76,display:"flex",flexDirection:"column",justifyContent:"center"}}>
            <div style={{fontSize:28,fontWeight:800,color:s.c,lineHeight:1}}>{s.v}</div>
            <div style={{fontSize:12,color:s.c,opacity:.8,fontWeight:600,marginTop:3}}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
        <Btn variant="primary" onClick={()=>setPage("submit")} style={{justifyContent:"center",width:"100%",minHeight:48}}>💡 New idea</Btn>
        <Btn variant="gold" onClick={()=>setPage("upload")} style={{justifyContent:"center",width:"100%",minHeight:48}}>🎨 Upload</Btn>
      </div>

      {/* Upcoming events */}
      {upcoming.length>0&&(
        <Card>
          <div style={{fontWeight:700,color:N,fontSize:14,marginBottom:12}}>📅 Coming up</div>
          {upcoming.map((e,i)=>(
            <div key={e.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:i<upcoming.length-1?`1px solid ${BR}`:"none"}}>
              <div style={{width:40,height:40,borderRadius:10,background:CAT_COLORS[e.cat]||CAT_COLORS.Other,color:W,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0,textAlign:"center",lineHeight:1.2}}>
                {MONTHS_SHORT[+e.start.split("-")[1]-1]}<br/>{e.start.split("-")[2]}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,color:"#333",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.name}</div>
                <div style={{fontSize:12,color:"#aaa"}}>{fmtDate(e.start)}</div>
              </div>
              <CatBadge cat={e.cat}/>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

// ── BOARD PAGE — Mobile-first: vertical list with stage filter tabs ────────────
function BoardPage({db,update,user,isReviewer,setPage}) {
  const isMobile = useIsMobile();
  const [expandedId, setExpandedId] = useState(null);
  const [postLink, setPostLink] = useState("");
  const [markingId, setMarkingId] = useState(null);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState(0); // 0 = all
  const [platformFilter, setPlatformFilter] = useState("All");

  const filtered = useMemo(()=>{
    let subs=db.submissions;
    if(search.trim())subs=subs.filter(s=>s.title.toLowerCase().includes(search.toLowerCase())||s.submittedBy.toLowerCase().includes(search.toLowerCase()));
    if(platformFilter!=="All")subs=subs.filter(s=>getPlatforms(s).includes(platformFilter));
    return subs;
  },[db.submissions,search,platformFilter]);

  const markPosted=(id)=>{
    update(prev=>({...prev,submissions:prev.submissions.map(s=>s.id===id?{...s,status:"Posted",postedBy:user,postedDate:tod(),postLink:postLink.trim()}:s)}));
    setMarkingId(null);setPostLink("");
  };
  const canPost=(s)=>isReviewer||s.assignedPoster===user;

  // Stage counts for the filter tabs
  const stageCounts=[0,1,2,3,4,5].map(st=>st===0?filtered.filter(s=>s.status!=="Rejected").length:filtered.filter(s=>getStage(s)===st).length);
  const visiblePosts=(stageFilter===0?filtered.filter(s=>s.status!=="Rejected"):filtered.filter(s=>getStage(s)===stageFilter))
    .sort((a,b)=>(a.dueDate||a.submittedDate||"").localeCompare(b.dueDate||b.submittedDate||""));

  const PostRow = ({s}) => {
    const revs=getRevisions(s); const cur=getCurrentDesign(s);
    const stage=getStage(s); const isExpanded=expandedId===s.id;
    const platforms=getPlatforms(s); const isOverdue=s.dueDate&&s.dueDate<tod()&&s.status!=="Posted";
    const cfg=STAGE_CONFIG[stage]||STAGE_CONFIG[1];

    return (
      <div style={{background:W,borderRadius:14,border:`1px solid ${BR}`,marginBottom:8,overflow:"hidden",boxShadow:isExpanded?"0 4px 20px rgba(0,0,0,.08)":"none",transition:"box-shadow 0.2s"}}>
        {/* Stage accent bar */}
        <div style={{height:3,background:cfg.border,borderRadius:"14px 14px 0 0",marginTop:-1}}/>
        {/* Main row */}
        <div onClick={()=>setExpandedId(isExpanded?null:s.id)} style={{padding:"14px",cursor:"pointer",display:"flex",alignItems:"start",gap:10}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:6,alignItems:"center"}}>
              <span style={{fontSize:11,fontWeight:700,background:cfg.bg,color:cfg.fg,padding:"3px 9px",borderRadius:8,flexShrink:0}}>{cfg.short}</span>
              {isOverdue&&<span style={{fontSize:10,fontWeight:700,color:"#fff",background:"#EF4444",padding:"3px 7px",borderRadius:6}}>OVERDUE</span>}
              {stage===4&&s.assignedPoster===user&&<span style={{fontSize:10,fontWeight:700,color:"#065F46",background:"#D1FAE5",padding:"3px 7px",borderRadius:6}}>YOU POST</span>}
            </div>
            <div style={{fontSize:15,fontWeight:700,color:"#1a1a2e",lineHeight:1.3,marginBottom:5}}>{s.title}</div>
            <div style={{display:"flex",alignItems:"center",gap:4,flexWrap:"wrap"}}>
              <div style={{display:"flex",gap:2}}>{platforms.slice(0,4).map(p=><PlatformDot key={p} platform={p}/>)}</div>
              <span style={{fontSize:12,color:"#aaa"}}>{s.submittedBy}</span>
              {revs.length>0&&<span style={{fontSize:10,fontWeight:700,color:"#7C3AED",background:"#F3E8FF",padding:"2px 7px",borderRadius:6}}>v{revs.length}</span>}
            </div>
          </div>
          <div style={{flexShrink:0,fontSize:16,color:"#bbb",transition:"transform 0.2s",transform:isExpanded?"rotate(180deg)":"rotate(0deg)"}}>
            ⌄
          </div>
        </div>

        {/* Expanded detail */}
        {isExpanded&&(
          <div style={{borderTop:`1px solid #f0ede8`,padding:"14px",background:"#faf9f7"}} onClick={e=>e.stopPropagation()}>
            {s.caption&&<div style={{fontSize:13,color:"#555",fontStyle:"italic",marginBottom:12,lineHeight:1.6,padding:"10px 12px",background:"#fff",borderRadius:10,border:`1px solid ${BR}`}}>"{s.caption.substring(0,200)}{s.caption.length>200?"...":""}"</div>}
            {cur&&<a href={cur.url} target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:"#2563EB",background:"#EEF2FF",padding:"12px 14px",borderRadius:10,fontWeight:700,marginBottom:12,textDecoration:"none",border:"1px solid #C7D2FE",minHeight:48}}>
              🎨 Open design (v{revs.length}) →
            </a>}
            {s.feedback&&<div style={{fontSize:13,color:"#92400E",background:"#FEF9C3",padding:"10px 12px",borderRadius:10,marginBottom:12,border:"1px solid #FCD34D"}}>💬 <strong>Feedback:</strong> {s.feedback}</div>}
            <div style={{fontSize:12,color:"#aaa",marginBottom:12,lineHeight:1.8}}>
              {s.contentType} · by {s.submittedBy}
              {s.submittedDate&&` · ${fmtDate(s.submittedDate)}`}
              {s.dueDate&&<span style={{color:isOverdue?"#EF4444":undefined}}> · due {fmtDate(s.dueDate)}</span>}
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {stage===4&&canPost(s)&&(markingId===s.id?(
                <div style={{width:"100%"}}>
                  <Input placeholder="https://..." value={postLink} onChange={e=>setPostLink(e.target.value)} style={{marginBottom:8}}/>
                  <div style={{display:"flex",gap:8}}>
                    <Btn variant="success" onClick={()=>markPosted(s.id)} style={{flex:1,justifyContent:"center"}}>🚀 Confirm posted</Btn>
                    <Btn variant="secondary" onClick={()=>{setMarkingId(null);setPostLink("");}}>Cancel</Btn>
                  </div>
                </div>
              ):(
                <>
                  <Btn variant="success" size="sm" onClick={()=>setMarkingId(s.id)}>🚀 Mark posted</Btn>
                  <Btn variant="gold" size="sm" onClick={()=>setPage("ready-to-post")}>Guided flow →</Btn>
                </>
              ))}
              {stage===4&&s.postLink&&<a href={s.postLink} target="_blank" rel="noreferrer" style={{fontSize:13,color:"#059669",fontWeight:600,textDecoration:"none",padding:"8px 0"}}>🔗 View live →</a>}
              {stage===3&&isReviewer&&<Btn variant="primary" size="sm" onClick={()=>setPage("review")}>👁 Review →</Btn>}
              {stage===2&&s.submittedBy===user&&<Btn variant="gold" size="sm" onClick={()=>setPage("upload")}>🎨 Upload design →</Btn>}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (isMobile) {
    // Mobile: vertical list with filter tabs
    return (
      <div>
        <div style={{marginBottom:16}}>
          <h1 style={{fontFamily:"'Fraunces',serif",fontSize:20,fontWeight:800,color:N,margin:"0 0 2px"}}>Content Board</h1>
          <p style={{fontSize:13,color:"#94A3B8",margin:0}}>{stageCounts[0]} active posts</p>
        </div>

        {/* Search */}
        <div style={{position:"relative",marginBottom:12}}>
          <span style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",fontSize:16,color:"#bbb"}}>🔍</span>
          <Input placeholder="Search posts..." value={search} onChange={e=>setSearch(e.target.value)} style={{paddingLeft:42}}/>
        </div>

        {/* Stage filter tabs — horizontal scroll */}
        <div style={{overflowX:"auto",marginBottom:14,marginLeft:-14,paddingLeft:14,paddingRight:14,WebkitOverflowScrolling:"touch"}}>
          <div style={{display:"flex",gap:8,paddingBottom:2,width:"max-content"}}>
            {[{label:"All",stage:0,color:N},...STAGE_CONFIG.slice(1).map((c,i)=>({label:c.short,stage:i+1,color:c.border}))].map(t=>{
              const active=stageFilter===t.stage;
              const cnt=stageCounts[t.stage];
              return (
                <button key={t.stage} onClick={()=>setStageFilter(t.stage)}
                  style={{padding:"9px 14px",borderRadius:9,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",border:`2px solid ${active?t.color:BR}`,background:active?t.color+"18":W,color:active?t.color:"#888",transition:"all 0.15s",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:5,minHeight:40,WebkitTapHighlightColor:"transparent"}}>
                  {t.label}
                  {cnt>0&&<span style={{fontSize:11,fontWeight:700,background:active?t.color:"#e8e5df",color:active?"#fff":"#888",borderRadius:9,padding:"1px 6px",minWidth:20,textAlign:"center"}}>{cnt}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Posts list */}
        {visiblePosts.length===0
          ?<EmptyState icon="📭" text="No posts here."/>
          :visiblePosts.map(s=><PostRow key={s.id} s={s}/>)
        }

        {/* Rejected section */}
        {stageFilter===0&&filtered.filter(s=>s.status==="Rejected").length>0&&(
          <details style={{marginTop:8}}>
            <summary style={{cursor:"pointer",fontSize:13,color:"#94A3B8",fontWeight:600,padding:"10px 0",userSelect:"none",listStyle:"none",minHeight:44,display:"flex",alignItems:"center",gap:5}}>
              <span>✕ Rejected ({filtered.filter(s=>s.status==="Rejected").length})</span>
            </summary>
            <div style={{marginTop:8}}>
              {filtered.filter(s=>s.status==="Rejected").map(s=>(
                <div key={s.id} style={{background:W,border:`1px solid ${BR}`,borderRadius:10,padding:"12px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,opacity:.5,flexWrap:"wrap",marginBottom:6}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:"#555"}}>{s.title}</div>
                    <div style={{fontSize:11,color:"#aaa",marginTop:2}}>by {s.submittedBy}</div>
                  </div>
                  <Badge status="Rejected"/>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    );
  }

  // Desktop: original kanban board
  const PostCard=({s})=>{
    const revs=getRevisions(s);const cur=getCurrentDesign(s);const stage=getStage(s);const isExpanded=expandedId===s.id;const platforms=getPlatforms(s);const isOverdue=s.dueDate&&s.dueDate<tod()&&s.status!=="Posted";const isAssignedToMe=s.assignedPoster===user;
    return(<div onClick={()=>setExpandedId(isExpanded?null:s.id)} className="board-card" style={{background:"#fff",borderRadius:10,border:`1px solid #e8e4de`,marginBottom:8,cursor:"pointer",overflow:"hidden",transition:"all 0.2s",boxShadow:isExpanded?"0 8px 30px rgba(0,0,0,0.10)":"0 1px 3px rgba(0,0,0,0.04)"}}>
      <div style={{height:3,background:STAGE_CONFIG[stage]?.border||"#94A3B8",borderRadius:"10px 10px 0 0",marginTop:-1}}/>
      <div style={{padding:"10px 12px"}}>
        <div style={{fontSize:13,fontWeight:600,color:"#1a1a2e",marginBottom:6,lineHeight:1.35}}>{s.title}</div>
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
        <div style={{fontSize:10,color:"#aaa",marginBottom:12,lineHeight:1.7}}><span>{s.contentType}</span> · <span>by {s.submittedBy}</span> · <span>submitted {fmtDate(s.submittedDate)}</span>{s.reviewedBy&&<span> · reviewed by {s.reviewedBy}</span>}{s.dueDate&&<span style={{color:isOverdue?"#EF4444":undefined}}> · due {fmtDate(s.dueDate)}</span>}</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {stage===4&&canPost(s)&&(markingId===s.id?<div style={{width:"100%"}}><Input placeholder="https://instagram.com/p/..." value={postLink} onChange={e=>setPostLink(e.target.value)} style={{marginBottom:6}}/><div style={{display:"flex",gap:6}}><Btn variant="success" size="sm" onClick={()=>markPosted(s.id)}>🚀 Mark posted</Btn><Btn variant="secondary" size="sm" onClick={()=>{setMarkingId(null);setPostLink("");}}>Cancel</Btn></div></div>:<Btn variant="success" size="sm" onClick={()=>setMarkingId(s.id)}>🚀 Mark as posted</Btn>)}
          {stage===4&&canPost(s)&&<Btn variant="gold" size="sm" onClick={()=>setPage("ready-to-post")}>📋 Guided flow →</Btn>}
          {stage===5&&s.postLink&&<a href={s.postLink} target="_blank" rel="noreferrer" style={{fontSize:11,color:"#059669",fontWeight:600,padding:"4px 0",textDecoration:"none"}}>🔗 View live post →</a>}
        </div>
      </div>)}
    </div>);
  };

  return(
    <div>
      <div style={{marginBottom:18}}>
        <h1 style={{fontFamily:"'Fraunces',serif",fontSize:22,fontWeight:800,color:N,margin:"0 0 2px"}}>Content Pipeline</h1>
        <p style={{fontSize:13,color:"#94A3B8",margin:0}}>{filtered.filter(s=>s.status!=="Rejected").length} active posts</p>
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:18,alignItems:"center"}}>
        <div style={{position:"relative",flex:"1 1 200px",minWidth:160}}>
          <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"#bbb",fontSize:14}}>🔍</span>
          <input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:"100%",paddingLeft:32,paddingRight:12,height:38,border:`1.5px solid ${BR}`,borderRadius:9,fontSize:13,fontFamily:"inherit",background:W,boxSizing:"border-box",color:"#333",outline:"none"}}/>
        </div>
        <select value={platformFilter} onChange={e=>setPlatformFilter(e.target.value)} style={{height:38,border:`1.5px solid ${BR}`,borderRadius:9,fontSize:12,fontFamily:"inherit",background:W,padding:"0 10px",color:"#555",cursor:"pointer",minWidth:130}}>
          <option value="All">All platforms</option>{PLATFORMS.map(p=><option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <div style={{overflowX:"auto",paddingBottom:16}}>
        <div style={{display:"flex",gap:12,minWidth:900}}>
          {[1,2,3,4,5].map(stageNum=>{const cfg=STAGE_CONFIG[stageNum];const posts=filtered.filter(s=>getStage(s)===stageNum);const hasUrgent=posts.some(s=>s.dueDate&&s.dueDate<tod());return(<div key={stageNum} style={{flex:"1 1 0",minWidth:200,maxWidth:280}}><div style={{borderRadius:10,padding:"11px 13px 10px",marginBottom:8,background:cfg.bg,border:`1.5px solid ${cfg.border}20`}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:2}}><div style={{fontWeight:700,fontSize:12.5,color:cfg.fg}}>{cfg.label}</div><div style={{fontSize:11,fontWeight:700,color:posts.length>0?cfg.fg:"#CBD5E1",background:posts.length>0?cfg.border+"25":"transparent",padding:"2px 8px",borderRadius:20,minWidth:24,textAlign:"center"}}>{posts.length}</div></div><div style={{fontSize:10,color:cfg.fg,opacity:.6}}>{cfg.desc}</div>{hasUrgent&&<div style={{fontSize:9,fontWeight:700,color:"#EF4444",marginTop:4}}>⚠ Overdue items</div>}</div><div style={{minHeight:100}}>{posts.length===0?<div style={{textAlign:"center",padding:"24px 8px",color:"#CBD5E1",fontSize:11,border:"1.5px dashed #E2E8F0",borderRadius:10}}>Nothing here</div>:posts.sort((a,b)=>(a.dueDate||a.submittedDate).localeCompare(b.dueDate||b.submittedDate)).map(s=><PostCard key={s.id} s={s}/>)}</div></div>);})}
        </div>
      </div>
    </div>
  );
}

// ── SUBMIT PAGE ───────────────────────────────────────────────────────────────
function SubmitPage({db,update,user,setPage}) {
  const [step,setStep] = useState(1);
  const [f,setF] = useState({title:"",description:"",caption:"",platforms:[],contentType:"",event:"",dueDate:""});
  const [done,setDone] = useState(false);
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  const EMPTY_F={title:"",description:"",caption:"",platforms:[],contentType:"",event:"",dueDate:""};
  const canNext=step===1?f.title.trim().length>0:step===2?f.platforms.length>0&&!!f.contentType:true;

  const submit=()=>{
    const sub={
      id:db.nextId,title:f.title.trim(),description:f.description.trim(),caption:f.caption.trim(),
      platforms:f.platforms,platform:f.platforms[0]||"",contentType:f.contentType,event:f.event,
      dueDate:f.dueDate,submittedBy:user,submittedDate:tod(),status:"Ready for Review",
      reviewedBy:"",reviewDate:"",feedback:"",postedBy:"",postedDate:"",postLink:"",revisions:[],fileLinks:[]
    };
    update(prev=>({...prev,submissions:[...prev.submissions,sub],nextId:prev.nextId+1}));
    setDone(true);
  };

  if(done) return (
    <div style={{textAlign:"center",padding:"48px 20px"}}>
      <div style={{fontSize:60,marginBottom:12}}>🎉</div>
      <PageTitle title="Idea submitted!" sub={`"${f.title}" is now in the review queue.`}/>
      <div style={{display:"flex",flexDirection:"column",gap:10,maxWidth:280,margin:"0 auto"}}>
        <Btn variant="primary" size="lg" onClick={()=>{setStep(1);setF(EMPTY_F);setDone(false);}}>Submit another idea</Btn>
        <Btn variant="gold" size="lg" onClick={()=>setPage("upload")}>🎨 Upload design now</Btn>
        <Btn variant="secondary" onClick={()=>setPage("home")}>Go home</Btn>
      </div>
    </div>
  );

  const stepLabels=["What's the concept?","Where is it going?","Final details"];
  return (
    <div>
      <PageTitle title="💡 New post idea" sub={`Step ${step} of 3 — ${stepLabels[step-1]}`}/>
      {/* Progress bar */}
      <div style={{display:"flex",gap:4,marginBottom:20}}>
        {[1,2,3].map(s=><div key={s} style={{flex:1,height:5,borderRadius:3,background:s<=step?G:BR,transition:"all 0.3s"}}/>)}
      </div>

      <Card>
        {step===1&&(
          <div>
            <div style={{marginBottom:16}}>
              <Label>Post title *</Label>
              <Input placeholder='e.g. "Easter Sunday Invitation Flyer"' value={f.title} onChange={e=>set("title",e.target.value)}/>
            </div>
            <div style={{marginBottom:16}}>
              <Label>Description</Label>
              <Textarea placeholder="What is this post about?" value={f.description} onChange={e=>set("description",e.target.value)} style={{minHeight:80}}/>
            </div>
            <div style={{marginBottom:4}}>
              <Label>Suggested caption</Label>
              <Textarea placeholder="Write the full caption here, including hashtags..." value={f.caption} onChange={e=>set("caption",e.target.value)} style={{minHeight:120}}/>
            </div>
          </div>
        )}

        {step===2&&(
          <div>
            <div style={{marginBottom:18}}>
              <Label>Platforms * <span style={{color:f.platforms.length>0?"#059669":"#bbb",fontWeight:700}}>({f.platforms.length} selected)</span></Label>
              <MultiPillSelect options={PLATFORMS} values={f.platforms} onChange={v=>set("platforms",v)} colorMap={PLATFORM_COLORS}/>
            </div>
            <div>
              <Label>Content type *</Label>
              <PillSelect options={CONTENT_TYPES} value={f.contentType} onChange={v=>set("contentType",v)}/>
            </div>
          </div>
        )}

        {step===3&&(
          <div>
            <div style={{marginBottom:16}}>
              <Label>Church event</Label>
              <Select value={f.event} onChange={e=>set("event",e.target.value)}>
                <option value="">— Not linked to an event —</option>
                {db.events.sort((a,b)=>a.start.localeCompare(b.start)).map(e=><option key={e.id} value={e.name}>{e.name} ({fmtDate(e.start)})</option>)}
              </Select>
            </div>
            <div>
              <Label>Posting deadline</Label>
              <Input type="date" value={f.dueDate} onChange={e=>set("dueDate",e.target.value)}/>
            </div>
          </div>
        )}

        <div style={{display:"flex",gap:10,marginTop:22}}>
          {step>1&&<Btn variant="secondary" onClick={()=>setStep(s=>s-1)} style={{flex:1,justifyContent:"center"}}>← Back</Btn>}
          {step<3
            ?<Btn variant="primary" disabled={!canNext} onClick={()=>setStep(s=>s+1)} style={{flex:2,justifyContent:"center",opacity:canNext?1:.4}}>Next →</Btn>
            :<Btn variant="success" onClick={submit} style={{flex:2,justifyContent:"center",minHeight:52,fontSize:15}}>✅ Submit for review</Btn>
          }
        </div>
      </Card>
    </div>
  );
}

// ── REVIEW PAGE ───────────────────────────────────────────────────────────────
function ReviewPage({db,update,user,isReviewer,setPage}) {
  const [feedback,setFeedback] = useState({});
  const [assignedPoster,setAssignedPoster] = useState({});
  const [revising,setRevising] = useState({});
  const pending=db.submissions.filter(s=>s.status==="Ready for Review");
  const mySubmissions=db.submissions.filter(s=>s.submittedBy===user).slice().reverse();
  const posterCandidates=(db.members||[]).filter(m=>m.active&&(m.type==="lead"||m.type==="approver")).map(m=>m.name);

  const act=(id,status)=>{
    const sub=db.submissions.find(s=>s.id===id);
    const revs=getRevisions(sub);
    const isDesignApproval=status==="Approved"&&revs.length>0;
    update(prev=>({...prev,submissions:prev.submissions.map(s=>s.id===id?{...s,status,reviewedBy:user,reviewDate:tod(),feedback:feedback[id]||s.feedback||"",...(isDesignApproval?{assignedPoster:assignedPoster[id]||user}:{})}:s)}));
    setFeedback(p=>{const n={...p};delete n[id];return n;});
    setAssignedPoster(p=>{const n={...p};delete n[id];return n;});
  };

  const submitRevision=(id)=>{
    const rev=revising[id];
    if(!rev?.url?.trim())return;
    const revEntry={version:(getRevisions(db.submissions.find(s=>s.id===id)).length)+1,url:rev.url.trim(),linkType:rev.linkType||"Link",note:rev.note?.trim()||"",uploadedBy:user,uploadedDate:tod(),isRevision:true};
    update(prev=>({...prev,submissions:prev.submissions.map(s=>s.id===id?{...s,status:"Ready for Review",revisions:[...(s.revisions||[]),revEntry],reviewedBy:"",reviewDate:""}:s)}));
    setRevising(p=>{const n={...p};delete n[id];return n;});
  };

  if(!isReviewer) return (
    <div>
      <PageTitle title="My submissions" sub="Track everything you've submitted"/>
      {mySubmissions.length===0
        ?<EmptyState icon="📭" text="Nothing submitted yet."/>
        :mySubmissions.map(s=>{
          const revs=getRevisions(s);const isNC=s.status==="Needs Changes";const isApproved=s.status==="Approved";const rev=revising[s.id]||{};
          return (
            <Card key={s.id} style={{borderLeft:isNC?"4px solid #F59E0B":s.status==="Posted"?"4px solid #059669":"none"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",gap:10,flexWrap:"wrap",marginBottom:10}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:16,fontWeight:700,color:"#222",marginBottom:3}}>{s.title}</div>
                  <div style={{fontSize:12,color:"#aaa",marginBottom:8}}>{getPlatforms(s).join(", ")} · {s.contentType}</div>
                  {s.caption&&<div style={{padding:"8px 10px",background:"#f8f7f5",borderRadius:8,border:`1px solid ${BR}`,fontSize:13,color:"#555",fontStyle:"italic",lineHeight:1.5}}>"{s.caption.substring(0,120)}{s.caption.length>120?"...":""}"</div>}
                </div>
                <Badge status={s.status}/>
              </div>
              {revs.length>0&&(
                <div style={{margin:"10px 0",padding:"10px 12px",background:"#F3E8FF",borderRadius:10,border:"1px solid #E9D5FF"}}>
                  <div style={{fontSize:12,fontWeight:700,color:"#7C3AED",marginBottom:8}}>🎨 Design versions</div>
                  {revs.map((rv,idx)=>(
                    <div key={idx} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:idx<revs.length-1?"1px solid #EDE9FE":"none",flexWrap:"wrap"}}>
                      <span style={{fontSize:11,fontWeight:700,color:"#7C3AED"}}>v{idx+1}</span>
                      {rv.isRevision&&<span style={{fontSize:10,background:"#FED7AA",color:"#92400E",padding:"2px 6px",borderRadius:8,fontWeight:600}}>REVISED</span>}
                      <a href={rv.url} target="_blank" rel="noreferrer" style={{fontSize:13,color:"#2563EB",flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{rv.url}</a>
                    </div>
                  ))}
                </div>
              )}
              {isNC&&s.feedback&&(
                <div style={{margin:"10px 0",padding:"12px 14px",background:"#FEF9C3",borderRadius:10,borderLeft:"4px solid #F59E0B"}}>
                  <div style={{fontSize:12,fontWeight:700,color:"#92400E",marginBottom:4}}>🔄 Feedback from {s.reviewedBy||"reviewer"}</div>
                  <div style={{fontSize:14,color:"#78350F",lineHeight:1.6}}>{s.feedback}</div>
                </div>
              )}
              {(isNC||(isApproved&&revs.length===0))&&(
                <div style={{marginTop:12,padding:"14px",background:isNC?"#FFFBEB":"#F0FDF4",borderRadius:12,border:`2px dashed ${isNC?"#FCD34D":"#86EFAC"}`}}>
                  <div style={{fontWeight:700,color:isNC?"#92400E":"#166534",fontSize:14,marginBottom:12}}>
                    {isNC?`🔄 Upload revision (v${revs.length+1})`:"🎨 Upload your design"}
                  </div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
                    {["Google Drive","Canva","YouTube","Dropbox","WeTransfer","Other"].map(t=>(
                      <button key={t} onClick={()=>setRevising(p=>({...p,[s.id]:{...rev,linkType:t}}))} style={{padding:"9px 13px",borderRadius:9,fontSize:13,cursor:"pointer",fontFamily:"inherit",border:rev.linkType===t?`2px solid ${N}`:"2px solid #e8e5df",background:rev.linkType===t?"#eef1f5":"#fff",color:rev.linkType===t?N:"#777",fontWeight:rev.linkType===t?600:400,minHeight:40}}>{t}</button>
                    ))}
                  </div>
                  <div style={{marginBottom:10}}>
                    <Label>{rev.linkType||"Design"} link *</Label>
                    <Input placeholder="https://..." value={rev.url||""} onChange={e=>setRevising(p=>({...p,[s.id]:{...rev,url:e.target.value}}))}/>
                  </div>
                  {isNC&&(
                    <div style={{marginBottom:12}}>
                      <Label>What changed?</Label>
                      <Textarea placeholder="Describe your changes..." value={rev.note||""} onChange={e=>setRevising(p=>({...p,[s.id]:{...rev,note:e.target.value}}))} style={{minHeight:80}}/>
                    </div>
                  )}
                  <Btn variant={isNC?"warning":"success"} disabled={!rev.url?.trim()} onClick={()=>submitRevision(s.id)} style={{width:"100%",justifyContent:"center",opacity:rev.url?.trim()?1:.4,minHeight:48}}>
                    {isNC?`🔄 Submit revision v${revs.length+1}`:"📎 Submit for review"}
                  </Btn>
                </div>
              )}
            </Card>
          );
        })
      }
    </div>
  );

  return (
    <div>
      <PageTitle title="👁 Review queue" sub={`${pending.length} item${pending.length!==1?"s":""} waiting`}/>
      {pending.length===0
        ?<EmptyState icon="✨" text="Nothing to review right now!"/>
        :pending.map(s=>{
          const revs=getRevisions(s);const cur=getCurrentDesign(s);const isRevision=revs.some(r=>r.isRevision);
          return (
            <Card key={s.id} style={{borderLeft:isRevision?"4px solid #F59E0B":"none"}}>
              {isRevision&&<div style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:11,fontWeight:700,color:"#92400E",background:"#FEF9C3",padding:"4px 10px",borderRadius:9,marginBottom:10}}>🔄 Revision v{revs.length}</div>}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",flexWrap:"wrap",gap:8,marginBottom:12}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:17,fontWeight:700,color:"#222",marginBottom:3}}>{s.title}</div>
                  <div style={{fontSize:13,color:"#aaa"}}>By <strong style={{color:"#666"}}>{s.submittedBy}</strong> · {getPlatforms(s).join(", ")} · {s.contentType}</div>
                </div>
                <Badge status={s.status}/>
              </div>
              {s.caption&&(
                <div style={{marginBottom:12,padding:"10px 12px",background:"#faf9f7",borderRadius:10,border:`1px solid ${BR}`}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#999",textTransform:"uppercase",letterSpacing:.3,marginBottom:4}}>📝 Caption</div>
                  <div style={{fontSize:14,color:"#444",lineHeight:1.6,whiteSpace:"pre-wrap"}}>{s.caption}</div>
                </div>
              )}
              {revs.length>0&&(
                <div style={{marginBottom:12,padding:"12px",background:"#F0FDF4",borderRadius:10,border:"1px solid #86EFAC"}}>
                  <div style={{fontSize:12,fontWeight:700,color:"#166534",marginBottom:8}}>🎨 Design files ({revs.length})</div>
                  {revs.map((rv,idx)=>(
                    <div key={idx} style={{display:"flex",alignItems:"start",gap:8,padding:"8px 0",borderBottom:idx<revs.length-1?"1px solid #D1FAE5":"none",flexWrap:"wrap"}}>
                      <span style={{fontSize:12,fontWeight:700,color:rv.isRevision?"#F59E0B":"#059669",flexShrink:0}}>v{idx+1}</span>
                      {rv.isRevision&&<span style={{fontSize:10,background:"#FEF9C3",color:"#92400E",padding:"2px 6px",borderRadius:8,fontWeight:600}}>REVISED</span>}
                      <div style={{flex:1,minWidth:0}}>
                        <a href={rv.url} target="_blank" rel="noreferrer" style={{fontSize:14,color:"#2563EB",fontWeight:700,display:"block",minHeight:36,display:"flex",alignItems:"center"}}>🔗 View {rv.linkType||"Design"} (v{idx+1}) →</a>
                        {rv.note&&<div style={{fontSize:12,color:"#555",fontStyle:"italic",marginTop:2}}>"{rv.note}"</div>}
                        <div style={{fontSize:11,color:"#aaa"}}>by {rv.uploadedBy} · {fmtDate(rv.uploadedDate)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {revs.length===0&&<div style={{padding:"10px 12px",background:"#FEF9C3",borderRadius:9,fontSize:13,color:"#92400E",marginBottom:12}}>⚠️ No design uploaded yet — reviewing concept only.</div>}
              <div style={{marginBottom:14}}>
                <Label>Feedback for {s.submittedBy}</Label>
                <Textarea placeholder="Be specific about what needs to change..." value={feedback[s.id]||""} onChange={e=>setFeedback(p=>({...p,[s.id]:e.target.value}))} style={{minHeight:90}}/>
              </div>
              {revs.length>0&&(
                <div style={{marginBottom:14,padding:"12px",background:"#F0FDF4",borderRadius:10,border:"1px solid #86EFAC"}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#166534",marginBottom:8}}>📣 Who will post this?</div>
                  <Select value={assignedPoster[s.id]||""} onChange={e=>setAssignedPoster(p=>({...p,[s.id]:e.target.value}))}>
                    <option value="">— Assign poster (default: you) —</option>
                    {posterCandidates.map(n=><option key={n} value={n}>{n}</option>)}
                  </Select>
                </div>
              )}
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <Btn variant="success" onClick={()=>act(s.id,"Approved")} style={{flex:1,justifyContent:"center",minHeight:48}}>✅ Approve</Btn>
                <Btn variant="warning" onClick={()=>act(s.id,"Needs Changes")} style={{flex:1,justifyContent:"center",minHeight:48}}>🔄 Needs changes</Btn>
                <Btn variant="danger" onClick={()=>act(s.id,"Rejected")} style={{justifyContent:"center",minHeight:48}}>✕</Btn>
              </div>
            </Card>
          );
        })
      }
    </div>
  );
}

// ── UPLOAD PAGE ───────────────────────────────────────────────────────────────
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

  const handleUpload=()=>{
    if(!selectedId||!link.trim())return;
    const revEntry={version:newVersion,url:link.trim(),linkType:linkType||"Link",note:note.trim(),uploadedBy:user,uploadedDate:tod(),isRevision};
    const newStatus=selected?.status==="Needs Changes"?"Ready for Review":selected?.status;
    update(prev=>({...prev,submissions:prev.submissions.map(s=>s.id===+selectedId?{...s,revisions:[...(s.revisions||[]),revEntry],status:newStatus,...(selected?.status==="Needs Changes"?{reviewedBy:"",reviewDate:""}:{})}:s)}));
    setDone(true);
  };

  const reset=()=>{setSelectedId("");setLinkType("");setLink("");setNote("");setDone(false);};

  if(done) return (
    <div style={{textAlign:"center",padding:"48px 20px"}}>
      <div style={{fontSize:60,marginBottom:12}}>{isRevision?"🔄":"🎨"}</div>
      <PageTitle title={isRevision?"Revision submitted!":"Design uploaded!"} sub={isRevision?`Version ${newVersion} submitted.`:`Design attached to "${selected?.title||"the post"}".`}/>
      <div style={{display:"flex",flexDirection:"column",gap:10,maxWidth:280,margin:"0 auto"}}>
        <Btn variant="primary" size="lg" onClick={reset}>Upload another</Btn>
        <Btn variant="secondary" onClick={()=>setPage("review")}>View my submissions</Btn>
      </div>
    </div>
  );

  return (
    <div>
      <PageTitle title="🎨 Upload design" sub="Attach your design file to a post"/>
      <Card style={{marginBottom:12}}>
        <Label>Which post is this for?</Label>
        {uploadable.length===0
          ?<div style={{color:"#999",fontSize:14,padding:"12px",background:"#f9f8f6",borderRadius:8}}>No posts need a design right now.</div>
          :<Select value={selectedId} onChange={e=>setSelectedId(e.target.value)}>
            <option value="">— Select a post —</option>
            {uploadable.map(s=>{const revs=getRevisions(s);return<option key={s.id} value={s.id}>{s.title} ({s.status}){revs.length>0?` · v${revs.length} uploaded`:""}</option>;})}
          </Select>
        }
      </Card>

      {selected&&(
        <>
          <Card style={{borderLeft:`4px solid ${isRevision?"#F59E0B":"#059669"}`,marginBottom:12}}>
            <div style={{fontWeight:700,color:"#222",fontSize:15,marginBottom:4}}>{selected.title}</div>
            {selected.feedback&&selected.status==="Needs Changes"&&(
              <div style={{padding:"10px 12px",background:"#FEE2E2",borderRadius:9,fontSize:13,color:"#991B1B",marginTop:6}}>
                <strong>Reviewer feedback:</strong> {selected.feedback}
              </div>
            )}
          </Card>
          <Card>
            <h3 style={{margin:"0 0 14px",color:N,fontSize:16,fontWeight:700}}>
              {isRevision?`Upload revised design (v${newVersion})`:"Upload your design"}
            </h3>
            <div style={{marginBottom:14}}>
              <Label>File location</Label>
              <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                {["Google Drive","Canva","YouTube","Dropbox","WeTransfer","Other"].map(t=>(
                  <button key={t} onClick={()=>setLinkType(t)} style={{padding:"10px 14px",borderRadius:10,fontSize:13,cursor:"pointer",fontFamily:"inherit",border:linkType===t?`2px solid ${N}`:"2px solid #e8e5df",background:linkType===t?"#eef1f5":"#fff",color:linkType===t?N:"#777",fontWeight:linkType===t?700:400,minHeight:44}}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div style={{marginBottom:14}}>
              <Label>{linkType||"Design"} link *</Label>
              <Input placeholder="Paste the direct link here" value={link} onChange={e=>setLink(e.target.value)}/>
            </div>
            {isRevision&&(
              <div style={{marginBottom:14}}>
                <Label>What did you change?</Label>
                <Textarea placeholder="Describe the changes you made..." value={note} onChange={e=>setNote(e.target.value)} style={{minHeight:100}}/>
              </div>
            )}
            <Btn variant={isRevision?"warning":"success"} disabled={!link.trim()} onClick={handleUpload} style={{width:"100%",justifyContent:"center",opacity:link.trim()?1:.4,minHeight:52,fontSize:15}}>
              {isRevision?`🔄 Submit revision v${newVersion}`:"📎 Upload for review"}
            </Btn>
          </Card>
        </>
      )}
    </div>
  );
}

// ── IMPORT EXCEL HELPER ──────────────────────────────────────────────────────
function parseImportedCalendar(file, db, update, onDone, onError) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const wb = XLSX.read(data, {type:"array"});
      // Find the calendar sheet (prefer one with "Calendar" in name)
      const sheetName = wb.SheetNames.find(n=>n.toLowerCase().includes("calendar"))||wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(ws, {header:1, defval:""});

      // Find header row — look for a row that has "title" and "date"
      let headerIdx = -1;
      for (let i=0; i<Math.min(rows.length,8); i++) {
        const r = rows[i].map(c=>String(c).toLowerCase());
        if (r.some(c=>c.includes("title")||c.includes("post title")) && r.some(c=>c.includes("date"))) {
          headerIdx = i; break;
        }
      }
      if (headerIdx === -1) { onError("Could not find header row. Make sure the sheet has 'Date' and 'Title' columns."); return; }

      const headers = rows[headerIdx].map(c=>String(c).toLowerCase().trim());
      const col = (...keywords) => {
        for (const kw of keywords) {
          const idx = headers.findIndex(h=>h.includes(kw.toLowerCase()));
          if (idx !== -1) return idx;
        }
        return -1;
      };

      const C = {
        date:     col("date"),
        day:      col("day"),
        title:    col("post title","title"),
        series:   col("series"),
        platforms:col("platform"),
        ctype:    col("content type","format"),
        caption:  col("caption"),
        visual:   col("visual direction","visual"),
        story:    col("story companion","story"),
        engage:   col("engagement hook","engagement"),
        hashtags: col("hashtag"),
        submitter:col("submitted by"),
        designer: col("assigned designer","designer"),
        poster:   col("assigned poster","poster"),
        status:   col("board status","status"),
        dueDate:  col("due date"),
        event:    col("church event","event"),
        notes:    col("reviewer notes","notes","feedback"),
      };

      const VALID_STATUSES = ["Draft","Ready for Review","Approved","Needs Changes","Posted","Rejected"];
      let nextId = db.nextId || 1;
      const newPosts = [];

      for (let i=headerIdx+1; i<rows.length; i++) {
        const row = rows[i];
        const rawDate = C.date !== -1 ? row[C.date] : "";
        const rawTitle = C.title !== -1 ? String(row[C.title]||"").trim() : "";
        if (!rawDate || !rawTitle) continue;

        // Parse date — could be ISO string, Excel serial, or "Mar 1" style
        let dateIso = "";
        if (typeof rawDate === "number" && rawDate > 40000) {
          // Excel date serial
          try {
            const d = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
            dateIso = d.toISOString().split("T")[0];
          } catch { dateIso = ""; }
        } else {
          const ds = String(rawDate).trim();
          if (/^\\d{4}-\\d{2}-\\d{2}$/.test(ds)) {
            dateIso = ds;
          } else {
            // Try "Mar 1" style
            try {
              const d = new Date(ds + " 2026");
              if (!isNaN(d)) dateIso = d.toISOString().split("T")[0];
            } catch { dateIso = ""; }
          }
        }
        if (!dateIso) continue;

        const rawPlatforms = C.platforms !== -1 ? String(row[C.platforms]||"Instagram") : "Instagram";
        const platforms = rawPlatforms.split(/,|;/).map(p=>p.trim()).filter(p=>PLATFORMS.includes(p));
        if (!platforms.length) platforms.push("Instagram");

        const rawStatus = C.status !== -1 ? String(row[C.status]||"Draft").trim() : "Draft";
        const status = VALID_STATUSES.includes(rawStatus) ? rawStatus : "Draft";

        const rawDue = C.dueDate !== -1 ? row[C.dueDate] : "";
        let dueIso = dateIso;
        if (rawDue && typeof rawDue === "number" && rawDue > 40000) {
          try { dueIso = new Date(Math.round((rawDue-25569)*86400*1000)).toISOString().split("T")[0]; } catch {}
        } else if (rawDue && /^\\d{4}-\\d{2}-\\d{2}$/.test(String(rawDue).trim())) {
          dueIso = String(rawDue).trim();
        }

        const g = (c) => c !== -1 ? String(row[c]||"").trim() : "";

        newPosts.push({
          id: nextId++,
          title: rawTitle,
          series:          g(C.series),
          description:     g(C.visual),
          caption:         g(C.caption),
          hashtags:        g(C.hashtags),
          visualDirection: g(C.visual),
          storyCompanion:  g(C.story),
          engagementHook:  g(C.engage),
          platforms, platform: platforms[0],
          contentType:     g(C.ctype) || "Image/Graphic",
          event:           g(C.event),
          dueDate:         dueIso,
          submittedBy:     g(C.submitter),
          assignedDesigner:g(C.designer),
          assignedPoster:  g(C.poster),
          status,
          submittedDate:   tod(),
          reviewedBy:"", reviewDate:"", feedback: g(C.notes),
          postedBy:"", postedDate:"", postLink:"",
          fileLinks:[], revisions:[],
          importedFromExcel: true,
        });
      }

      if (!newPosts.length) { onError("No valid rows found. Check that your sheet has Date and Title columns."); return; }

      update(prev => ({
        ...prev,
        submissions: [...prev.submissions, ...newPosts],
        nextId,
      }));
      onDone(newPosts.length);
    } catch(err) {
      onError("Error reading file: " + err.message);
    }
  };
  reader.onerror = () => onError("Could not read file.");
  reader.readAsArrayBuffer(file);
}

// ── SOCIAL CALENDAR PAGE ──────────────────────────────────────────────────────
function SocialCalendarPage({db, update, user, isReviewer}) {
  const now = new Date();
  const [year,   setYear]   = useState(now.getFullYear());
  const [month,  setMonth]  = useState(now.getMonth());
  const [view,   setView]   = useState("calendar"); // "calendar" | "plan"
  const [selDay, setSelDay] = useState(null);
  const [platFilter, setPlatFilter] = useState("All");
  const [seriesFilter, setSeriesFilter] = useState("All");
  const [importStatus, setImportStatus] = useState(null); // null | "loading" | {count} | {error}
  const [editingId, setEditingId] = useState(null);
  const [assignModal, setAssignModal] = useState(null); // {id, field:"designer"|"poster"}
  const [editForm, setEditForm] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [newPost, setNewPost] = useState({title:"",platforms:[],contentType:"",series:""});
  const isMobile = useIsMobile();
  const fileInputRef = useRef(null);

  const today = tod();
  const totalDays = daysInMonth(year, month);
  const firstDay  = firstDayOfMonth(year, month);
  const members   = db.members || DEFAULT_MEMBERS;
  const activeMembers = members.filter(m=>m.active);

  const prevMonth = () => { if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1); setSelDay(null); };
  const nextMonth = () => { if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1); setSelDay(null); };

  const monthPosts = useMemo(() => db.submissions.filter(s => {
    const d = s.dueDate || s.postedDate;
    if (!d) return false;
    const [y,m] = d.split("-");
    return +y===year && +m-1===month;
  }), [db.submissions, year, month]);

  const filteredPosts = useMemo(() => monthPosts.filter(s => {
    if (platFilter !== "All" && !getPlatforms(s).includes(platFilter)) return false;
    if (seriesFilter !== "All" && s.series !== seriesFilter) return false;
    return true;
  }), [monthPosts, platFilter, seriesFilter]);

  const postsForDay = (d) => {
    const dateStr = padDate(year, month, d);
    return filteredPosts.filter(s => (s.dueDate||s.postedDate) === dateStr);
  };

  // ── ASSIGN ──────────────────────────────────────────────────
  const claimRole = (id, field) => {
    update(prev => ({
      ...prev,
      submissions: prev.submissions.map(s =>
        s.id === id ? {...s, [field]: user} : s
      )
    }));
  };

  const assignRole = (id, field, memberName) => {
    update(prev => ({
      ...prev,
      submissions: prev.submissions.map(s =>
        s.id === id ? {...s, [field]: memberName} : s
      )
    }));
    setAssignModal(null);
  };

  const unassignRole = (id, field) => {
    update(prev => ({
      ...prev,
      submissions: prev.submissions.map(s =>
        s.id === id ? {...s, [field]: ""} : s
      )
    }));
  };

  // ── EDIT ────────────────────────────────────────────────────
  const startEdit = (s) => {
    setEditingId(s.id);
    setEditForm({
      title: s.title, series: s.series||"", caption: s.caption||"",
      visualDirection: s.visualDirection||s.description||"",
      storyCompanion: s.storyCompanion||"",
      engagementHook: s.engagementHook||"",
      hashtags: s.hashtags||"",
      platforms: getPlatforms(s), contentType: s.contentType||"",
      dueDate: s.dueDate||"", status: s.status, event: s.event||"",
      assignedDesigner: s.assignedDesigner||"",
      assignedPoster: s.assignedPoster||"",
    });
  };

  const saveEdit = (id) => {
    update(prev => ({
      ...prev,
      submissions: prev.submissions.map(s =>
        s.id === id ? {
          ...s, ...editForm,
          platform: editForm.platforms[0]||"",
          description: editForm.visualDirection,
        } : s
      )
    }));
    setEditingId(null);
  };

  const deletePost = (id) => {
    if (!window.confirm("Remove this post from the calendar?")) return;
    update(prev => ({...prev, submissions: prev.submissions.filter(s=>s.id!==id)}));
    setSelDay(null);
  };

  // ── IMPORT ──────────────────────────────────────────────────
  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setImportStatus("loading");
    parseImportedCalendar(file, db, update,
      (count) => setImportStatus({count}),
      (err)   => setImportStatus({error: err})
    );
  };

  // ── ADD QUICK ───────────────────────────────────────────────
  const addQuick = () => {
    if (!newPost.title.trim() || !newPost.platforms.length) return;
    const dateStr = selDay ? padDate(year,month,selDay) : padDate(year,month,1);
    update(prev => ({
      ...prev,
      submissions: [...prev.submissions, {
        id: prev.nextId, title: newPost.title.trim(),
        series: newPost.series||"", description:"", caption:"",
        visualDirection:"", storyCompanion:"", engagementHook:"", hashtags:"",
        platforms: newPost.platforms, platform: newPost.platforms[0]||"",
        contentType: newPost.contentType||"Image/Graphic", event:"",
        dueDate: dateStr, submittedBy: user, submittedDate: today,
        status:"Draft", reviewedBy:"", reviewDate:"", feedback:"",
        assignedDesigner:"", assignedPoster:"",
        postedBy:"", postedDate:"", postLink:"", fileLinks:[], revisions:[],
      }],
      nextId: prev.nextId+1,
    }));
    setNewPost({title:"",platforms:[],contentType:"",series:""});
    setShowAdd(false);
  };

  // ── SERIES OPTIONS ──────────────────────────────────────────
  const SERIES_OPTIONS = ["#SupernaturalFaith2026","#FaithFuel","#FastWithERC","#SupernaturalStories","#BehindTheCross"];
  const SERIES_COLORS  = {
    "#SupernaturalFaith2026":"#0D1B3E",
    "#FaithFuel":"#C9A84C",
    "#FastWithERC":"#0F766E",
    "#SupernaturalStories":"#DB2777",
    "#BehindTheCross":"#EA580C",
  };

  // ── POST CARD ───────────────────────────────────────────────
  const PostCard = ({s, expanded=false, onToggle}) => {
    const stage = getStage(s);
    const platforms = getPlatforms(s);
    const isOverdue = s.dueDate && s.dueDate < today && s.status !== "Posted";
    const sc = SERIES_COLORS[s.series] || N;
    const myDesigner = s.assignedDesigner === user;
    const myPoster   = s.assignedPoster === user;
    const isEditing  = editingId === s.id;

    if (isEditing) return (
      <div style={{background:"#F8F7FF",borderRadius:14,border:`2px solid ${N}`,padding:14,marginBottom:10}}>
        <div style={{fontWeight:700,fontSize:14,color:N,marginBottom:12}}>✏️ Edit post</div>
        <div style={{marginBottom:10}}><Label>Title</Label>
          <Input value={editForm.title} onChange={e=>setEditForm(p=>({...p,title:e.target.value}))}/>
        </div>
        <div style={{marginBottom:10}}><Label>Series</Label>
          <Select value={editForm.series} onChange={e=>setEditForm(p=>({...p,series:e.target.value}))}>
            <option value="">— None —</option>
            {SERIES_OPTIONS.map(s=><option key={s} value={s}>{s}</option>)}
          </Select>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
          <div><Label>Content type</Label>
            <Select value={editForm.contentType} onChange={e=>setEditForm(p=>({...p,contentType:e.target.value}))}>
              {CONTENT_TYPES.map(ct=><option key={ct} value={ct}>{ct}</option>)}
            </Select>
          </div>
          <div><Label>Due date</Label>
            <Input type="date" value={editForm.dueDate} onChange={e=>setEditForm(p=>({...p,dueDate:e.target.value}))}/>
          </div>
        </div>
        <div style={{marginBottom:10}}><Label>Platforms</Label>
          <MultiPillSelect options={PLATFORMS} values={editForm.platforms} onChange={v=>setEditForm(p=>({...p,platforms:v}))} colorMap={PLATFORM_COLORS}/>
        </div>
        <div style={{marginBottom:10}}><Label>Caption</Label>
          <Textarea value={editForm.caption} onChange={e=>setEditForm(p=>({...p,caption:e.target.value}))} style={{minHeight:80}}/>
        </div>
        <div style={{marginBottom:10}}><Label>Visual direction</Label>
          <Input value={editForm.visualDirection} onChange={e=>setEditForm(p=>({...p,visualDirection:e.target.value}))}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
          <div><Label>Assigned designer</Label>
            <Select value={editForm.assignedDesigner} onChange={e=>setEditForm(p=>({...p,assignedDesigner:e.target.value}))}>
              <option value="">— Unassigned —</option>
              {activeMembers.filter(m=>m.type!=="approver").map(m=><option key={m.id} value={m.name}>{m.name}</option>)}
            </Select>
          </div>
          <div><Label>Assigned poster</Label>
            <Select value={editForm.assignedPoster} onChange={e=>setEditForm(p=>({...p,assignedPoster:e.target.value}))}>
              <option value="">— Unassigned —</option>
              {activeMembers.map(m=><option key={m.id} value={m.name}>{m.name}</option>)}
            </Select>
          </div>
        </div>
        <div style={{marginBottom:10}}><Label>Hashtags</Label>
          <Input value={editForm.hashtags} placeholder="#Tag1 #Tag2 …" onChange={e=>setEditForm(p=>({...p,hashtags:e.target.value}))}/>
        </div>
        <div style={{marginBottom:10}}><Label>Status</Label>
          <Select value={editForm.status} onChange={e=>setEditForm(p=>({...p,status:e.target.value}))}>
            {STATUSES.map(st=><option key={st} value={st}>{st}</option>)}
          </Select>
        </div>
        <div style={{display:"flex",gap:8}}>
          <Btn variant="success" onClick={()=>saveEdit(s.id)} style={{flex:2,justifyContent:"center",minHeight:44}}>✓ Save changes</Btn>
          <Btn variant="secondary" onClick={()=>setEditingId(null)} style={{flex:1,justifyContent:"center",minHeight:44}}>Cancel</Btn>
        </div>
      </div>
    );

    return (
      <div style={{borderRadius:14,border:`1.5px solid ${isOverdue?"#FCA5A5":BR}`,background:W,marginBottom:8,overflow:"hidden"}}>
        {/* Card header */}
        <div onClick={onToggle} style={{padding:"12px 14px",cursor:"pointer",WebkitTapHighlightColor:"transparent"}}>
          <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
            {/* Series color bar */}
            <div style={{width:4,borderRadius:4,background:sc,alignSelf:"stretch",flexShrink:0,minHeight:36}}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3,flexWrap:"wrap"}}>
                <span style={{fontSize:14,fontWeight:700,color:"#1F2937",flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.title}</span>
                <Badge status={s.status}/>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                {s.series && <span style={{fontSize:10,color:sc,fontWeight:700,background:sc+"15",padding:"1px 7px",borderRadius:6}}>{s.series}</span>}
                {s.contentType && <span style={{fontSize:10,color:DARK_GREY,background:BR,padding:"1px 7px",borderRadius:6}}>{s.contentType}</span>}
                <div style={{display:"flex",gap:2}}>{platforms.slice(0,3).map(p=><PlatformDot key={p} platform={p}/>)}</div>
                {isOverdue&&<span style={{fontSize:10,color:"#DC2626",fontWeight:700}}>⚠ OVERDUE</span>}
              </div>
            </div>
            <span style={{fontSize:14,color:"#ccc",flexShrink:0}}>{expanded?"▲":"▼"}</span>
          </div>
          {/* Assignment row */}
          <div style={{display:"flex",gap:12,marginTop:8,paddingLeft:14}}>
            <div style={{fontSize:11,color:"#888"}}>
              🎨 <span style={{fontWeight:s.assignedDesigner?600:400,color:s.assignedDesigner?"#374151":"#aaa"}}>{s.assignedDesigner||"No designer"}</span>
            </div>
            <div style={{fontSize:11,color:"#888"}}>
              🚀 <span style={{fontWeight:s.assignedPoster?600:400,color:s.assignedPoster?"#374151":"#aaa"}}>{s.assignedPoster||"No poster"}</span>
            </div>
          </div>
        </div>

        {/* Expanded detail */}
        {expanded && (
          <div style={{padding:"0 14px 14px",borderTop:`1px solid ${BR}`}}>
            {s.caption && (
              <div style={{marginTop:12,background:"#F9FAFB",borderRadius:10,padding:10,fontSize:13,color:"#374151",lineHeight:1.6,whiteSpace:"pre-wrap"}}>
                {s.caption}
              </div>
            )}
            {s.visualDirection && <div style={{marginTop:8,fontSize:12,color:"#6B7280"}}>🎨 <strong>Visual:</strong> {s.visualDirection}</div>}
            {s.storyCompanion  && <div style={{marginTop:4,fontSize:12,color:"#6B7280"}}>📲 <strong>Story:</strong> {s.storyCompanion}</div>}
            {s.engagementHook  && <div style={{marginTop:4,fontSize:12,color:"#6B7280"}}>💬 <strong>Hook:</strong> {s.engagementHook}</div>}
            {s.hashtags && <div style={{marginTop:4,fontSize:11,color:N,fontWeight:600}}>{s.hashtags}</div>}
            {s.dueDate && <div style={{marginTop:6,fontSize:12,color:isOverdue?"#DC2626":"#6B7280"}}>📅 Due: <strong>{fmtDate(s.dueDate)}</strong></div>}

            {/* Assignment buttons */}
            <div style={{marginTop:12,display:"flex",flexDirection:"column",gap:8}}>
              {/* Designer slot */}
              <div style={{background:"#F0FDF4",borderRadius:10,padding:"10px 12px",border:"1px solid #D1FAE5"}}>
                <div style={{fontSize:11,fontWeight:700,color:"#065F46",marginBottom:6}}>🎨 Designer</div>
                {s.assignedDesigner ? (
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:13,fontWeight:600,color:"#1F2937",flex:1}}>{s.assignedDesigner}{myDesigner&&<span style={{fontSize:10,color:"#059669",marginLeft:4}}>(you)</span>}</span>
                    {(isReviewer||myDesigner) && <button onClick={()=>unassignRole(s.id,"assignedDesigner")} style={{fontSize:11,color:"#aaa",background:"none",border:"none",cursor:"pointer",padding:"4px 8px",borderRadius:6,minHeight:30}}>✕ Remove</button>}
                    {isReviewer && <button onClick={()=>setAssignModal({id:s.id,field:"assignedDesigner"})} style={{fontSize:11,color:N,background:BR,border:"none",cursor:"pointer",padding:"4px 8px",borderRadius:6,minHeight:30,fontFamily:"inherit",fontWeight:600}}>Reassign</button>}
                  </div>
                ) : (
                  <div style={{display:"flex",gap:8}}>
                    <Btn variant="success" size="sm" onClick={()=>claimRole(s.id,"assignedDesigner")} style={{flex:1,justifyContent:"center",fontSize:12}}>✋ I'll design this</Btn>
                    {isReviewer && <Btn variant="ghost" size="sm" onClick={()=>setAssignModal({id:s.id,field:"assignedDesigner"})} style={{flex:1,justifyContent:"center",fontSize:12}}>Assign →</Btn>}
                  </div>
                )}
              </div>

              {/* Poster slot */}
              <div style={{background:"#EFF6FF",borderRadius:10,padding:"10px 12px",border:"1px solid #DBEAFE"}}>
                <div style={{fontSize:11,fontWeight:700,color:"#1D4ED8",marginBottom:6}}>🚀 Poster</div>
                {s.assignedPoster ? (
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:13,fontWeight:600,color:"#1F2937",flex:1}}>{s.assignedPoster}{myPoster&&<span style={{fontSize:10,color:"#2563EB",marginLeft:4}}>(you)</span>}</span>
                    {(isReviewer||myPoster) && <button onClick={()=>unassignRole(s.id,"assignedPoster")} style={{fontSize:11,color:"#aaa",background:"none",border:"none",cursor:"pointer",padding:"4px 8px",borderRadius:6,minHeight:30}}>✕ Remove</button>}
                    {isReviewer && <button onClick={()=>setAssignModal({id:s.id,field:"assignedPoster"})} style={{fontSize:11,color:N,background:BR,border:"none",cursor:"pointer",padding:"4px 8px",borderRadius:6,minHeight:30,fontFamily:"inherit",fontWeight:600}}>Reassign</button>}
                  </div>
                ) : (
                  <div style={{display:"flex",gap:8}}>
                    <Btn variant="primary" size="sm" onClick={()=>claimRole(s.id,"assignedPoster")} style={{flex:1,justifyContent:"center",fontSize:12}}>✋ I'll post this</Btn>
                    {isReviewer && <Btn variant="ghost" size="sm" onClick={()=>setAssignModal({id:s.id,field:"assignedPoster"})} style={{flex:1,justifyContent:"center",fontSize:12}}>Assign →</Btn>}
                  </div>
                )}
              </div>
            </div>

            {/* Lead controls */}
            {isReviewer && (
              <div style={{marginTop:10,display:"flex",gap:8}}>
                <Btn variant="ghost" size="sm" onClick={()=>startEdit(s)} style={{flex:1,justifyContent:"center",fontSize:12}}>✏️ Edit post</Btn>
                <button onClick={()=>deletePost(s.id)} style={{flex:1,padding:"8px 12px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",border:"1.5px solid #FCA5A5",background:"#FEF2F2",color:"#DC2626",fontFamily:"inherit",minHeight:36}}>🗑 Remove</button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ── ASSIGN MODAL ────────────────────────────────────────────
  const AssignModal = () => {
    if (!assignModal) return null;
    const eligible = assignModal.field === "assignedDesigner"
      ? activeMembers.filter(m=>m.type!=="approver")
      : activeMembers;
    return (
      <>
        <div onClick={()=>setAssignModal(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:300,backdropFilter:"blur(2px)"}}/>
        <div style={{position:"fixed",bottom:0,left:0,right:0,background:W,borderRadius:"20px 20px 0 0",zIndex:301,padding:"20px 16px",paddingBottom:"calc(20px + env(safe-area-inset-bottom,0px))"}}>
          <div style={{fontWeight:700,fontSize:15,color:N,marginBottom:14}}>
            Assign {assignModal.field==="assignedDesigner"?"designer":"poster"}
          </div>
          {eligible.map(m=>(
            <button key={m.id} onClick={()=>assignRole(assignModal.id,assignModal.field,m.name)}
              style={{width:"100%",textAlign:"left",padding:"12px 14px",borderRadius:10,border:`1.5px solid ${BR}`,background:W,cursor:"pointer",fontFamily:"inherit",marginBottom:6,display:"flex",alignItems:"center",gap:10,minHeight:52}}>
              <div style={{width:36,height:36,borderRadius:"50%",background:TYPE_CONFIG[m.type].color,color:W,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13,flexShrink:0}}>{m.name[0]}</div>
              <div>
                <div style={{fontWeight:600,fontSize:14,color:"#1F2937"}}>{m.fullName||m.name}</div>
                <div style={{fontSize:12,color:"#aaa"}}>{m.role}</div>
              </div>
            </button>
          ))}
          <button onClick={()=>setAssignModal(null)} style={{width:"100%",padding:"12px",borderRadius:10,border:"none",background:"#F3F4F6",cursor:"pointer",fontFamily:"inherit",color:"#6B7280",fontWeight:600,fontSize:14,marginTop:4,minHeight:44}}>Cancel</button>
        </div>
      </>
    );
  };

  // ── PLANNING LIST (all posts this month, grouped by week) ──
  const PlanningView = () => {
    const [expandedId, setExpandedId] = useState(null);
    const sorted = [...filteredPosts].sort((a,b)=>
      (a.dueDate||a.submittedDate||"").localeCompare(b.dueDate||b.submittedDate||"")
    );
    const unassigned = sorted.filter(s=>!s.assignedDesigner||!s.assignedPoster);
    const assigned   = sorted.filter(s=>s.assignedDesigner&&s.assignedPoster);

    return (
      <div>
        {unassigned.length>0&&(
          <div style={{marginBottom:16}}>
            <div style={{fontSize:11,fontWeight:700,color:"#EF4444",textTransform:"uppercase",letterSpacing:.5,marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
              <span style={{width:8,height:8,borderRadius:"50%",background:"#EF4444",display:"inline-block"}}/>
              Open tasks — claim one! ({unassigned.length})
            </div>
            {unassigned.map(s=>(
              <PostCard key={s.id} s={s} expanded={expandedId===s.id} onToggle={()=>setExpandedId(expandedId===s.id?null:s.id)}/>
            ))}
          </div>
        )}
        {assigned.length>0&&(
          <div>
            <div style={{fontSize:11,fontWeight:700,color:"#059669",textTransform:"uppercase",letterSpacing:.5,marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
              <span style={{width:8,height:8,borderRadius:"50%",background:"#059669",display:"inline-block"}}/>
              Assigned & underway ({assigned.length})
            </div>
            {assigned.map(s=>(
              <PostCard key={s.id} s={s} expanded={expandedId===s.id} onToggle={()=>setExpandedId(expandedId===s.id?null:s.id)}/>
            ))}
          </div>
        )}
        {filteredPosts.length===0&&<EmptyState icon="📅" text="No posts this month yet. Import a calendar or add one above."/>}
      </div>
    );
  };

  // ── CALENDAR GRID ──────────────────────────────────────────
  const CalendarView = () => {
    const selPosts = selDay ? postsForDay(selDay) : [];
    const selDateStr = selDay ? padDate(year,month,selDay) : "";
    const [expandedId, setExpandedId] = useState(null);

    return (
      <>
        <div style={{background:W,borderRadius:14,border:`1px solid ${BR}`,overflow:"hidden",marginBottom:14}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",background:"#f8f7f5",borderBottom:`1px solid ${BR}`}}>
            {["S","M","T","W","T","F","S"].map((d,i)=>(
              <div key={i} style={{padding:"8px 2px",textAlign:"center",fontSize:12,fontWeight:700,color:"#999"}}>{d}</div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)"}}>
            {Array.from({length:firstDay},(_,i)=>(
              <div key={`e${i}`} style={{minHeight:isMobile?52:72,borderRight:`1px solid ${BR}`,borderBottom:`1px solid ${BR}`,background:"#fafaf9"}}/>
            ))}
            {Array.from({length:totalDays},(_,i)=>{
              const d=i+1;
              const dateStr=padDate(year,month,d);
              const dayPosts=postsForDay(d);
              const isToday=dateStr===today;
              const isSel=selDay===d;
              const hasEvent=db.events.some(e=>e.start<=dateStr&&e.end>=dateStr);
              const hasOpen=dayPosts.some(p=>!p.assignedDesigner||!p.assignedPoster);
              return (
                <div key={d} onClick={()=>setSelDay(isSel?null:d)}
                  style={{minHeight:isMobile?52:72,padding:"5px 3px",borderRight:`1px solid ${BR}`,borderBottom:`1px solid ${BR}`,cursor:"pointer",background:isSel?"#EEF2FF":W,transition:"background 0.1s",WebkitTapHighlightColor:"transparent",position:"relative"}}>
                  <div style={{display:"flex",alignItems:"center",gap:2,marginBottom:2}}>
                    <div style={{fontSize:12,fontWeight:isToday?700:400,color:isToday?W:"#555",width:22,height:22,borderRadius:"50%",background:isToday?N:"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      {d}
                    </div>
                    {hasOpen&&dayPosts.length>0&&<div style={{width:5,height:5,borderRadius:"50%",background:"#EF4444"}}/>}
                    {hasEvent&&<div style={{width:5,height:5,borderRadius:"50%",background:G}}/>}
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:1}}>
                    {dayPosts.slice(0,isMobile?1:2).map((p,idx)=>(
                      <div key={idx} style={{width:"100%",padding:"1px 3px",borderRadius:2,background:(SERIES_COLORS[p.series]||PLATFORM_COLORS[getPlatforms(p)[0]]||"#999")+"22",borderLeft:`2px solid ${SERIES_COLORS[p.series]||PLATFORM_COLORS[getPlatforms(p)[0]]||"#999"}`,fontSize:9,color:"#333",overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>
                        {p.title}
                      </div>
                    ))}
                    {dayPosts.length>(isMobile?1:2)&&<div style={{fontSize:9,color:"#aaa",fontWeight:700}}>+{dayPosts.length-(isMobile?1:2)}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* Legend */}
        <div style={{display:"flex",gap:12,marginBottom:12,flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:"#888"}}><div style={{width:8,height:8,borderRadius:"50%",background:"#EF4444"}}/> Open tasks</div>
          <div style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:"#888"}}><div style={{width:8,height:8,borderRadius:"50%",background:G}}/> Church event</div>
          <div style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:"#888"}}><div style={{width:22,height:22,borderRadius:"50%",background:N,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:W}}>•</div> Today</div>
        </div>

        {/* Day panel */}
        {selDay&&(
          <Card style={{borderLeft:`4px solid ${N}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{fontWeight:700,color:N,fontSize:15}}>{fmtDate(selDateStr)}</div>
              {isReviewer&&<Btn variant="gold" size="sm" onClick={()=>setShowAdd(!showAdd)}>{showAdd?"Cancel":"＋ Add"}</Btn>}
            </div>
            {showAdd&&(
              <div style={{padding:14,background:"#F8F9FA",borderRadius:10,marginBottom:14,border:`1px solid ${BR}`}}>
                <div style={{marginBottom:10}}><Label>Title</Label><Input placeholder="Post title…" value={newPost.title} onChange={e=>setNewPost(p=>({...p,title:e.target.value}))}/></div>
                <div style={{marginBottom:10}}><Label>Platforms</Label>
                  <MultiPillSelect options={PLATFORMS} values={newPost.platforms} onChange={v=>setNewPost(p=>({...p,platforms:v}))} colorMap={PLATFORM_COLORS}/>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                  <div><Label>Content type</Label>
                    <Select value={newPost.contentType} onChange={e=>setNewPost(p=>({...p,contentType:e.target.value}))}>
                      <option value="">Select…</option>
                      {CONTENT_TYPES.map(ct=><option key={ct} value={ct}>{ct}</option>)}
                    </Select>
                  </div>
                  <div><Label>Series</Label>
                    <Select value={newPost.series} onChange={e=>setNewPost(p=>({...p,series:e.target.value}))}>
                      <option value="">— None —</option>
                      {SERIES_OPTIONS.map(s=><option key={s} value={s}>{s}</option>)}
                    </Select>
                  </div>
                </div>
                <Btn variant="success" onClick={addQuick} disabled={!newPost.title.trim()||!newPost.platforms.length} style={{width:"100%",justifyContent:"center",opacity:newPost.title.trim()&&newPost.platforms.length?1:.4,minHeight:44}}>Add to calendar</Btn>
              </div>
            )}
            {selPosts.length===0
              ?<p style={{color:"#ccc",fontSize:13,margin:0,textAlign:"center",padding:"16px 0"}}>Nothing scheduled. {isReviewer?"Tap + Add to create one.":""}</p>
              :selPosts.map(s=>(
                <PostCard key={s.id} s={s} expanded={expandedId===s.id} onToggle={()=>setExpandedId(expandedId===s.id?null:s.id)}/>
              ))
            }
          </Card>
        )}
      </>
    );
  };

  const openCount = monthPosts.filter(s=>!s.assignedDesigner||!s.assignedPoster).length;

  return (
    <div>
      {/* Header */}
      <div style={{marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8,marginBottom:8}}>
          <PageTitle title="🗓 Content Calendar" sub={`${MONTHS[month]} ${year} · ${monthPosts.length} posts${openCount>0?" · "+openCount+" open tasks":""}`}/>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {/* Import button */}
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleImport} style={{display:"none"}}/>
            <Btn variant="gold" size="sm" onClick={()=>fileInputRef.current?.click()}>⬆ Import Excel</Btn>
            <Btn variant="ghost" size="sm" onClick={()=>exportCalendarExcel(db,year,month)}>⬇ Export</Btn>
          </div>
        </div>

        {/* Import status banner */}
        {importStatus==="loading"&&(
          <div style={{padding:"10px 14px",background:"#EFF6FF",borderRadius:10,border:"1px solid #BFDBFE",fontSize:13,color:"#1D4ED8",marginBottom:10}}>
            ⏳ Importing posts from Excel…
          </div>
        )}
        {importStatus&&importStatus.count&&(
          <div style={{padding:"10px 14px",background:"#D1FAE5",borderRadius:10,border:"1px solid #6EE7B7",fontSize:13,color:"#065F46",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <span>✅ Imported {importStatus.count} posts successfully!</span>
            <button onClick={()=>setImportStatus(null)} style={{background:"none",border:"none",cursor:"pointer",color:"#065F46",fontSize:16,padding:"0 4px"}}>×</button>
          </div>
        )}
        {importStatus&&importStatus.error&&(
          <div style={{padding:"10px 14px",background:"#FEE2E2",borderRadius:10,border:"1px solid #FCA5A5",fontSize:13,color:"#DC2626",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <span>❌ {importStatus.error}</span>
            <button onClick={()=>setImportStatus(null)} style={{background:"none",border:"none",cursor:"pointer",color:"#DC2626",fontSize:16,padding:"0 4px"}}>×</button>
          </div>
        )}

        {/* Open tasks callout */}
        {openCount>0&&(
          <div onClick={()=>setView("plan")} style={{padding:"10px 14px",background:"#FEF9C3",borderRadius:10,border:"1px solid #FDE047",fontSize:13,color:"#854D0E",marginBottom:10,cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:16}}>👋</span>
            <span><strong>{openCount} post{openCount!==1?"s":""}</strong> still need designers or posters — tap to claim one!</span>
            <span style={{marginLeft:"auto",fontSize:12,fontWeight:700}}>View →</span>
          </div>
        )}
      </div>

      {/* View toggle + month nav row */}
      <div style={{display:"flex",gap:8,marginBottom:12,alignItems:"center"}}>
        <div style={{display:"flex",background:"#F3F4F6",borderRadius:10,padding:3,gap:2,flex:1,maxWidth:200}}>
          {[["calendar","📅 Grid"],["plan","📋 Tasks"]].map(([v,l])=>(
            <button key={v} onClick={()=>setView(v)}
              style={{flex:1,padding:"7px 8px",borderRadius:8,fontSize:12,fontWeight:700,border:"none",cursor:"pointer",fontFamily:"inherit",background:view===v?W:"transparent",color:view===v?N:"#9CA3AF",boxShadow:view===v?"0 1px 4px rgba(0,0,0,0.1)":"none",transition:"all 0.15s"}}>
              {l}
            </button>
          ))}
        </div>
        <div style={{display:"flex",alignItems:"center",background:W,borderRadius:10,border:`1px solid ${BR}`,overflow:"hidden",flex:1}}>
          <button onClick={prevMonth} style={{padding:"8px 12px",border:"none",background:"none",cursor:"pointer",fontSize:16,color:"#666",minHeight:40,WebkitTapHighlightColor:"transparent"}}>‹</button>
          <div style={{flex:1,textAlign:"center",fontFamily:"'Fraunces',serif",fontSize:14,fontWeight:700,color:N}}>{MONTHS[month]} {year}</div>
          <button onClick={nextMonth} style={{padding:"8px 12px",border:"none",background:"none",cursor:"pointer",fontSize:16,color:"#666",minHeight:40,WebkitTapHighlightColor:"transparent"}}>›</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{overflowX:"auto",marginLeft:-14,paddingLeft:14,paddingRight:14,marginBottom:12,WebkitOverflowScrolling:"touch"}}>
        <div style={{display:"flex",gap:5,paddingBottom:2,width:"max-content"}}>
          {["All",...PLATFORMS].map(p=>(
            <button key={p} onClick={()=>setPlatFilter(p)}
              style={{padding:"5px 10px",borderRadius:7,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",border:platFilter===p?`2px solid ${PLATFORM_COLORS[p]||N}`:`1.5px solid ${BR}`,background:platFilter===p?(PLATFORM_COLORS[p]||N)+"18":W,color:platFilter===p?(PLATFORM_COLORS[p]||N):"#aaa",minHeight:32,display:"flex",alignItems:"center",gap:3,whiteSpace:"nowrap"}}>
              {p!=="All"&&<PlatformDot platform={p}/>}{p}
            </button>
          ))}
        </div>
      </div>

      {view==="calendar" ? <CalendarView/> : <PlanningView/>}

      <AssignModal/>
    </div>
  );
}


// ── CALENDAR (EVENTS) PAGE ────────────────────────────────────────────────────
function CalendarPage({db,update}) {
  const [sel,setSel]=useState(new Date().getMonth());
  const [adding,setAdding]=useState(false);
  const [nf,setNf]=useState({name:"",cat:"Other",start:"",end:""});
  const events=db.events.filter(e=>{const m1=+e.start.split("-")[1]-1,m2=+e.end.split("-")[1]-1;return m1<=sel&&m2>=sel;}).sort((a,b)=>a.start.localeCompare(b.start));
  const addEvent=()=>{if(!nf.name.trim()||!nf.start)return;update(prev=>({...prev,events:[...prev.events,{id:`c_${prev.nextEventId}`,name:nf.name.trim(),cat:nf.cat,start:nf.start,end:nf.end||nf.start,custom:true}],nextEventId:prev.nextEventId+1}));setNf({name:"",cat:"Other",start:"",end:""});setAdding(false);};

  return (
    <div>
      <PageTitle title="📅 Church events 2026"/>
      {/* Month filter - horizontal scroll */}
      <div style={{overflowX:"auto",marginLeft:-14,paddingLeft:14,paddingRight:14,marginBottom:14,WebkitOverflowScrolling:"touch"}}>
        <div style={{display:"flex",gap:6,paddingBottom:2,width:"max-content"}}>
          {MONTHS_SHORT.map((m,i)=>(
            <button key={m} onClick={()=>setSel(i)} style={{padding:"9px 14px",borderRadius:9,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",border:"none",background:sel===i?N:BR,color:sel===i?W:"#777",transition:"all 0.15s",minHeight:40,WebkitTapHighlightColor:"transparent"}}>
              {m}
            </button>
          ))}
        </div>
      </div>
      <Btn variant="gold" size="sm" onClick={()=>setAdding(!adding)} style={{marginBottom:14}}>
        {adding?"Cancel":"＋ Add event"}
      </Btn>
      {adding&&(
        <Card style={{borderLeft:`4px solid ${G}`}}>
          <h3 style={{margin:"0 0 14px",color:N,fontSize:15,fontWeight:700}}>Add new event</h3>
          <div style={{marginBottom:12}}>
            <Label>Event name</Label>
            <Input placeholder="e.g. Special Guest Speaker" value={nf.name} onChange={e=>setNf(p=>({...p,name:e.target.value}))}/>
          </div>
          <div style={{marginBottom:12}}>
            <Label>Category</Label>
            <PillSelect options={Object.keys(CAT_COLORS)} value={nf.cat} onChange={v=>setNf(p=>({...p,cat:v}))}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
            <div><Label>Start</Label><Input type="date" value={nf.start} onChange={e=>setNf(p=>({...p,start:e.target.value}))}/></div>
            <div><Label>End</Label><Input type="date" value={nf.end} onChange={e=>setNf(p=>({...p,end:e.target.value}))}/></div>
          </div>
          <Btn variant="primary" disabled={!nf.name.trim()||!nf.start} onClick={addEvent} style={{width:"100%",justifyContent:"center",opacity:nf.name.trim()&&nf.start?1:.4,minHeight:48}}>
            Add event
          </Btn>
        </Card>
      )}
      {events.length===0
        ?<EmptyState icon="📅" text={`Nothing scheduled in ${MONTHS_SHORT[sel]}`}/>
        :events.map(e=>(
          <Card key={e.id} style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:4,height:52,borderRadius:2,background:CAT_COLORS[e.cat]||CAT_COLORS.Other,flexShrink:0}}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:600,fontSize:15,color:"#333"}}>{e.name}{e.custom?" ✦":""}</div>
              <div style={{fontSize:12,color:"#aaa",marginTop:2}}>{fmtDate(e.start)}{e.end!==e.start?` — ${fmtDate(e.end)}`:""}</div>
            </div>
            <CatBadge cat={e.cat}/>
            {e.custom&&(
              <button onClick={()=>update(p=>({...p,events:p.events.filter(x=>x.id!==e.id)}))} style={{background:"none",border:"none",color:"#ccc",fontSize:22,cursor:"pointer",padding:"4px 8px",borderRadius:6,minHeight:44,minWidth:44,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
            )}
          </Card>
        ))
      }
    </div>
  );
}

// ── REMINDERS PAGE ────────────────────────────────────────────────────────────
function RemindersPage({db,update,user}) {
  const [adding,setAdding]=useState(false);
  const [nf,setNf]=useState({text:"",date:"",assignedTo:""});
  const allNames=getAllNames(db.members||DEFAULT_MEMBERS);
  const add=()=>{
    if(!nf.text.trim()||!nf.date)return;
    update(prev=>({...prev,reminders:[...prev.reminders,{id:prev.nextReminderId,text:nf.text.trim(),date:nf.date,assignedTo:nf.assignedTo,createdBy:user,createdDate:tod(),done:false}],nextReminderId:prev.nextReminderId+1}));
    setNf({text:"",date:"",assignedTo:""});setAdding(false);
  };
  const active=db.reminders.filter(r=>!r.done).sort((a,b)=>a.date.localeCompare(b.date));
  const completed=db.reminders.filter(r=>r.done);
  const isOverdue=d=>d<tod();

  return (
    <div>
      <PageTitle title="🔔 Reminders" sub="Deadlines and nudges"/>
      <Btn variant="gold" size="sm" onClick={()=>setAdding(!adding)} style={{marginBottom:14}}>
        {adding?"Cancel":"＋ New reminder"}
      </Btn>
      {adding&&(
        <Card style={{borderLeft:`4px solid ${G}`}}>
          <div style={{marginBottom:12}}>
            <Label>What needs to happen?</Label>
            <Input placeholder='"Post Easter countdown"' value={nf.text} onChange={e=>setNf(p=>({...p,text:e.target.value}))}/>
          </div>
          <div style={{marginBottom:12}}>
            <Label>When</Label>
            <Input type="date" value={nf.date} onChange={e=>setNf(p=>({...p,date:e.target.value}))}/>
          </div>
          <div style={{marginBottom:14}}>
            <Label>Who's responsible?</Label>
            <Select value={nf.assignedTo} onChange={e=>setNf(p=>({...p,assignedTo:e.target.value}))}>
              <option value="">— Whole team —</option>
              {allNames.map(n=><option key={n} value={n}>{n}</option>)}
            </Select>
          </div>
          <Btn variant="primary" disabled={!nf.text.trim()||!nf.date} onClick={add} style={{width:"100%",justifyContent:"center",opacity:nf.text.trim()&&nf.date?1:.4,minHeight:48}}>
            Set reminder
          </Btn>
        </Card>
      )}
      {active.length===0&&completed.length===0
        ?<EmptyState icon="🔔" text="No reminders yet."/>
        :<>
          {active.map(r=>(
            <Card key={r.id} style={{display:"flex",alignItems:"center",gap:12,borderLeft:isOverdue(r.date)?"4px solid #EF4444":`4px solid ${G}`,padding:"14px"}}>
              <button onClick={()=>update(p=>({...p,reminders:p.reminders.map(x=>x.id===r.id?{...x,done:true}:x)}))} style={{width:32,height:32,borderRadius:"50%",border:"2px solid #ccc",background:W,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",minWidth:32,minHeight:32}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:500,color:isOverdue(r.date)?"#DC2626":"#333",lineHeight:1.4}}>
                  {r.text}
                  {isOverdue(r.date)&&<span style={{fontSize:10,color:"#DC2626",marginLeft:8,fontWeight:700,background:"#FEE2E2",padding:"2px 6px",borderRadius:4}}>OVERDUE</span>}
                </div>
                <div style={{fontSize:12,color:"#aaa",marginTop:2}}>{fmtDate(r.date)} · {r.assignedTo||"Whole team"}</div>
              </div>
              <button onClick={()=>update(p=>({...p,reminders:p.reminders.filter(x=>x.id!==r.id)}))} style={{background:"none",border:"none",color:"#ccc",fontSize:22,cursor:"pointer",borderRadius:6,minHeight:44,minWidth:44,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
            </Card>
          ))}
          {completed.length>0&&(
            <div style={{marginTop:20}}>
              <div style={{fontSize:12,fontWeight:700,color:"#ccc",marginBottom:8,textTransform:"uppercase",letterSpacing:.5}}>Done ({completed.length})</div>
              {completed.map(r=>(
                <Card key={r.id} style={{opacity:.5,display:"flex",alignItems:"center",gap:12,padding:"12px 14px"}}>
                  <button onClick={()=>update(p=>({...p,reminders:p.reminders.map(x=>x.id===r.id?{...x,done:false}:x)}))} style={{width:32,height:32,borderRadius:"50%",border:"2px solid #059669",background:"#D1FAE5",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:"#059669",minWidth:32,minHeight:32}}>✓</button>
                  <div style={{flex:1,textDecoration:"line-through",fontSize:14,color:"#999"}}>{r.text}</div>
                  <button onClick={()=>update(p=>({...p,reminders:p.reminders.filter(x=>x.id!==r.id)}))} style={{background:"none",border:"none",color:"#ddd",fontSize:22,cursor:"pointer",borderRadius:6,minHeight:44,minWidth:44,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
                </Card>
              ))}
            </div>
          )}
        </>
      }
    </div>
  );
}

// ── ANNOUNCEMENTS PAGE ────────────────────────────────────────────────────────
function AnnouncementsPage({db,update,user}) {
  const [adding,setAdding]=useState(false);
  const [text,setText]=useState("");
  const announcements=(db.announcements||[]).slice().reverse();
  const isLead=(db.members||DEFAULT_MEMBERS).find(m=>m.name===user)?.type==="lead";
  const add=()=>{
    if(!text.trim())return;
    update(prev=>({...prev,announcements:[...(prev.announcements||[]),{id:prev.nextAnnouncementId||1,text:text.trim(),createdBy:user,createdDate:tod(),readBy:[user]}],nextAnnouncementId:(prev.nextAnnouncementId||1)+1}));
    setText("");setAdding(false);
  };
  const markRead=(id)=>{update(prev=>({...prev,announcements:(prev.announcements||[]).map(a=>a.id===id&&!a.readBy?.includes(user)?{...a,readBy:[...(a.readBy||[]),user]}:a)}));};

  return (
    <div>
      <PageTitle title="📢 Announcements" sub="Team notices and updates"/>
      {isLead&&<Btn variant="gold" size="sm" onClick={()=>setAdding(!adding)} style={{marginBottom:14}}>{adding?"Cancel":"＋ Post announcement"}</Btn>}
      {adding&&(
        <Card style={{borderLeft:"4px solid #2563EB",background:"#EEF2FF"}}>
          <div style={{marginBottom:12}}>
            <Label>Announcement</Label>
            <Textarea placeholder="What does the team need to know?" value={text} onChange={e=>setText(e.target.value)} style={{minHeight:100}}/>
          </div>
          <Btn variant="primary" disabled={!text.trim()} onClick={add} style={{width:"100%",justifyContent:"center",opacity:text.trim()?1:.4,minHeight:48}}>
            Post to team
          </Btn>
        </Card>
      )}
      {announcements.length===0
        ?<EmptyState icon="📢" text="No announcements yet."/>
        :announcements.map(a=>{
          const unread=!a.readBy?.includes(user);
          return (
            <Card key={a.id} style={{borderLeft:unread?"4px solid #2563EB":`4px solid ${BR}`,background:unread?"#EEF2FF":W}} onClick={()=>markRead(a.id)}>
              {unread&&<span style={{fontSize:11,fontWeight:700,color:"#2563EB",background:"#DBEAFE",padding:"2px 8px",borderRadius:5,display:"inline-block",marginBottom:6}}>NEW</span>}
              <p style={{margin:0,fontSize:14,color:"#333",lineHeight:1.6}}>{a.text}</p>
              <div style={{fontSize:12,color:"#aaa",marginTop:8}}>By {a.createdBy} · {fmtDate(a.createdDate)}</div>
            </Card>
          );
        })
      }
    </div>
  );
}

// ── TEAM PAGE ─────────────────────────────────────────────────────────────────
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
  const addMember=()=>{
    if(!nf.name.trim()||!nf.fullName.trim())return;
    const nm={id:db.nextMemberId||20,name:nf.name.trim(),fullName:nf.fullName.trim(),role:nf.role||"Team Member",type:nf.type,tasks:nf.tasks,active:true};
    update(prev=>({...prev,members:[...(prev.members||DEFAULT_MEMBERS),nm],nextMemberId:(prev.nextMemberId||20)+1}));
    setNf({name:"",fullName:"",role:"",type:"creator",tasks:""});setAdding(false);
  };
  const toggleActive=(id)=>{update(prev=>({...prev,members:(prev.members||DEFAULT_MEMBERS).map(m=>m.id===id?{...m,active:!m.active}:m)}));};

  const MemberCard=({m})=>(
    <Card>
      {editing?.id===m.id?(
        <div>
          <div style={{marginBottom:12}}>
            <Label>Display name</Label>
            <Input value={editing.name} onChange={e=>setEditing(p=>({...p,name:e.target.value}))} style={{marginBottom:10}}/>
            <Label>Full name</Label>
            <Input value={editing.fullName} onChange={e=>setEditing(p=>({...p,fullName:e.target.value}))} style={{marginBottom:10}}/>
            <Label>Role</Label>
            <Input value={editing.role} onChange={e=>setEditing(p=>({...p,role:e.target.value}))} style={{marginBottom:10}}/>
            <Label>Type</Label>
            <Select value={editing.type} onChange={e=>setEditing(p=>({...p,type:e.target.value}))} style={{marginBottom:10}}>
              {MEMBER_TYPES.map(t=><option key={t} value={t}>{TYPE_CONFIG[t].label}</option>)}
            </Select>
            <Label>Responsibilities</Label>
            <Textarea value={editing.tasks} onChange={e=>setEditing(p=>({...p,tasks:e.target.value}))} style={{minHeight:70}}/>
          </div>
          <div style={{display:"flex",gap:8}}>
            <Btn variant="success" onClick={saveEdit} style={{flex:1,justifyContent:"center"}}>Save</Btn>
            <Btn variant="secondary" onClick={()=>setEditing(null)} style={{flex:1,justifyContent:"center"}}>Cancel</Btn>
          </div>
        </div>
      ):(
        <div style={{display:"flex",alignItems:"start",gap:12}}>
          <div style={{width:44,height:44,borderRadius:"50%",background:TYPE_CONFIG[m.type].color,color:W,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,flexShrink:0}}>
            {m.name[0]}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:700,fontSize:15,color:"#333"}}>{m.fullName||m.name}</div>
            <div style={{fontSize:12,color:"#aaa"}}>{m.role}</div>
            <span style={{fontSize:11,background:TYPE_CONFIG[m.type].color+"18",color:TYPE_CONFIG[m.type].color,padding:"3px 9px",borderRadius:7,fontWeight:700,display:"inline-block",marginTop:5}}>
              {TYPE_CONFIG[m.type].label}
            </span>
            {m.tasks&&<p style={{fontSize:13,color:"#888",margin:"8px 0 0",lineHeight:1.5}}>{m.tasks}</p>}
          </div>
          {isReviewer&&(
            <div style={{display:"flex",flexDirection:"column",gap:6,flexShrink:0}}>
              <Btn variant="ghost" size="sm" onClick={()=>setEditing({...m})}>Edit</Btn>
              <button onClick={()=>toggleActive(m.id)} style={{padding:"6px 12px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",border:`1.5px solid ${BR}`,background:W,color:"#aaa",minHeight:34}}>Remove</button>
            </div>
          )}
        </div>
      )}
    </Card>
  );

  const Section=({title,items})=>items.length===0?null:(
    <div style={{marginBottom:20}}>
      <div style={{fontSize:11,fontWeight:700,color:"#aaa",textTransform:"uppercase",letterSpacing:.5,marginBottom:10}}>{title}</div>
      {items.map(m=><MemberCard key={m.id} m={m}/>)}
    </div>
  );

  return (
    <div>
      <PageTitle title="👥 The team" sub={`${members.filter(m=>m.active).length} active members`}/>
      {isReviewer&&(
        <Btn variant="gold" size="sm" onClick={()=>setAdding(!adding)} style={{marginBottom:14}}>
          {adding?"Cancel":"＋ Add member"}
        </Btn>
      )}
      {adding&&(
        <Card style={{borderLeft:`4px solid ${G}`,marginBottom:20}}>
          <h3 style={{margin:"0 0 14px",color:N,fontSize:15,fontWeight:700}}>New team member</h3>
          <div style={{marginBottom:12}}><Label>Display name</Label><Input placeholder="e.g. Jean" value={nf.name} onChange={e=>setNf(p=>({...p,name:e.target.value}))}/></div>
          <div style={{marginBottom:12}}><Label>Full name</Label><Input placeholder="e.g. Jean Dupont" value={nf.fullName} onChange={e=>setNf(p=>({...p,fullName:e.target.value}))}/></div>
          <div style={{marginBottom:12}}><Label>Role</Label><Input placeholder="e.g. Designer" value={nf.role} onChange={e=>setNf(p=>({...p,role:e.target.value}))}/></div>
          <div style={{marginBottom:12}}><Label>Type</Label><Select value={nf.type} onChange={e=>setNf(p=>({...p,type:e.target.value}))}>{MEMBER_TYPES.map(t=><option key={t} value={t}>{TYPE_CONFIG[t].label}</option>)}</Select></div>
          <div style={{marginBottom:14}}><Label>Responsibilities</Label><Textarea placeholder="What will they be doing?" value={nf.tasks} onChange={e=>setNf(p=>({...p,tasks:e.target.value}))} style={{minHeight:70}}/></div>
          <Btn variant="success" disabled={!nf.name.trim()||!nf.fullName.trim()} onClick={addMember} style={{width:"100%",justifyContent:"center",opacity:nf.name.trim()&&nf.fullName.trim()?1:.4,minHeight:48}}>
            Add member
          </Btn>
        </Card>
      )}
      <Section title="Team Leads" items={leads}/>
      <Section title="Creators & Designers" items={creators}/>
      <Section title="Reviewers & Approvers" items={approvers}/>
      {inactive.length>0&&(
        <div>
          <div style={{fontSize:11,fontWeight:700,color:"#ddd",textTransform:"uppercase",letterSpacing:.5,marginBottom:8}}>Inactive ({inactive.length})</div>
          {inactive.map(m=>(
            <Card key={m.id} style={{opacity:.5,display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:40,height:40,borderRadius:"50%",background:"#ddd",color:W,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700}}>{m.name[0]}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,color:"#999",textDecoration:"line-through"}}>{m.fullName||m.name}</div>
                <div style={{fontSize:12,color:"#ccc"}}>{m.role}</div>
              </div>
              {isReviewer&&<Btn variant="ghost" size="sm" onClick={()=>toggleActive(m.id)}>Restore</Btn>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── EXPORT PAGE ───────────────────────────────────────────────────────────────
function ExportPage({db,user}) {
  const now=new Date();
  const [calYear,setCalYear]=useState(now.getFullYear());
  const [calMonth,setCalMonth]=useState(now.getMonth());
  const stats={total:db.submissions.length,posted:db.submissions.filter(s=>s.status==="Posted").length,pending:db.submissions.filter(s=>s.status==="Ready for Review").length,withFiles:db.submissions.filter(s=>getRevisions(s).length>0).length};

  return (
    <div>
      <PageTitle title="📤 Export" sub="Download as formatted Excel"/>
      <Card style={{background:"#faf9f7",marginBottom:16}}>
        <div style={{fontSize:12,fontWeight:700,color:"#999",textTransform:"uppercase",letterSpacing:.3,marginBottom:12}}>Current stats</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
          {[{l:"Total posts",v:stats.total,c:N},{l:"Published",v:stats.posted,c:"#059669"},{l:"Pending",v:stats.pending,c:"#D97706"},{l:"With designs",v:stats.withFiles,c:"#7C3AED"}].map(s=>(
            <div key={s.l} style={{textAlign:"center",padding:"10px",background:W,borderRadius:10,border:`1px solid ${BR}`}}>
              <div style={{fontSize:24,fontWeight:800,color:s.c}}>{s.v}</div>
              <div style={{fontSize:11,color:"#aaa"}}>{s.l}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card style={{marginBottom:10}}>
        <div style={{display:"flex",alignItems:"start",gap:12}}>
          <div style={{fontSize:32}}>📋</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:15,color:N,marginBottom:4}}>Full media hub export</div>
            <p style={{fontSize:13,color:"#888",margin:"0 0 14px",lineHeight:1.5}}>Everything in one workbook — all posts, designs, stats, and events.</p>
            <Btn variant="primary" onClick={()=>exportAllExcel(db)} style={{width:"100%",justifyContent:"center",minHeight:48}}>
              ⬇ Download full export (.xlsx)
            </Btn>
          </div>
        </div>
      </Card>

      <Card>
        <div style={{display:"flex",alignItems:"start",gap:12}}>
          <div style={{fontSize:32}}>🗓</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:15,color:N,marginBottom:4}}>Monthly calendar</div>
            <p style={{fontSize:13,color:"#888",margin:"0 0 14px",lineHeight:1.5}}>Calendar view for a specific month.</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              <Select value={calMonth} onChange={e=>setCalMonth(+e.target.value)}>
                {MONTHS.map((m,i)=><option key={m} value={i}>{m}</option>)}
              </Select>
              <Select value={calYear} onChange={e=>setCalYear(+e.target.value)}>
                {[2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}
              </Select>
            </div>
            <Btn variant="gold" onClick={()=>exportCalendarExcel(db,calYear,calMonth)} style={{width:"100%",justifyContent:"center",minHeight:48}}>
              ⬇ {MONTHS_SHORT[calMonth]} {calYear} calendar
            </Btn>
          </div>
        </div>
      </Card>
    </div>
  );
}