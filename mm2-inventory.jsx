import { useState, useEffect, useRef } from "react";

// ─── DEFAULTS ────────────────────────────────────────────────────────────────
const DEFAULT_CATEGORIES = ["Season 1","Classic","Holiday"];
const DEFAULT_SECTIONS   = ["Low","Tier 1 Low Godlies","Sets","Chromas"];
const DEFAULT_ITEMS = [
  {id:"s1_1",name:"Harvester",   category:"Season 1",section:"Low",              price:225,notes:"",order:1,stock:0},
  {id:"s1_2",name:"Icepiercer", category:"Season 1",section:"Low",              price:165,notes:"",order:2,stock:0},
  {id:"s1_3",name:"Bat",        category:"Season 1",section:"Low",              price:180,notes:"",order:3,stock:0},
  {id:"s1_4",name:"Elderwood",  category:"Season 1",section:"Tier 1 Low Godlies",price:450,notes:"",order:4,stock:0},
  {id:"s1_5",name:"Icebreaker", category:"Season 1",section:"Tier 1 Low Godlies",price:500,notes:"",order:5,stock:0},
  {id:"cl_1",name:"Corrupt",    category:"Classic",  section:"Low",              price:200,notes:"",order:1,stock:0},
  {id:"cl_2",name:"Ghostblade", category:"Classic",  section:"Low",              price:175,notes:"",order:2,stock:0},
  {id:"cl_3",name:"Darkblade",  category:"Classic",  section:"Tier 1 Low Godlies",price:480,notes:"",order:3,stock:0},
  {id:"cl_4",name:"Luger",      category:"Classic",  section:"Sets",             price:350,notes:"",order:4,stock:0},
  {id:"cl_5",name:"Chroma Luger",category:"Classic", section:"Chromas",          price:900,notes:"",order:5,stock:0},
  {id:"ho_1",name:"Pumpkin",    category:"Holiday",  section:"Low",              price:190,notes:"",order:1,stock:0},
  {id:"ho_2",name:"Candy Cane", category:"Holiday",  section:"Low",              price:160,notes:"",order:2,stock:0},
  {id:"ho_3",name:"Holiday Scythe",category:"Holiday",section:"Tier 1 Low Godlies",price:520,notes:"",order:3,stock:0},
  {id:"ho_4",name:"Chroma Holiday Scythe",category:"Holiday",section:"Chromas",  price:950,notes:"",order:4,stock:0},
];
const DEFAULT_SECTION_SORT = {}; // {sectionName: "manual"|"priceHL"|"priceLH"|"az"|"za"}

// ─── THEME PALETTES ───────────────────────────────────────────────────────────
const PALETTES = {
  yellow: { name:"🟡 Yellow",  accent:"#e2ff6e", accentDark:"#b8d44a", accentText:"#1a1a0e" },
  blue:   { name:"🔵 Blue",    accent:"#6eb4ff", accentDark:"#4a8fd4", accentText:"#0a0f1a" },
  green:  { name:"🟢 Green",   accent:"#6effa0", accentDark:"#4ad47a", accentText:"#0a1a10" },
  red:    { name:"🔴 Red",     accent:"#ff6e6e", accentDark:"#d44a4a", accentText:"#1a0a0a" },
  purple: { name:"🟣 Purple",  accent:"#c06eff", accentDark:"#9a4ad4", accentText:"#100a1a" },
  orange: { name:"🟠 Orange",  accent:"#ffaa6e", accentDark:"#d48a4a", accentText:"#1a0f0a" },
  gray:   { name:"⚫ Gray",    accent:"#c8c8c8", accentDark:"#a0a0a0", accentText:"#0f0f0f" },
};

// ─── UNICODE BOLD HEADERS ────────────────────────────────────────────────────
function toBoldUnicode(str) {
  const map = {
    A:"𝐀",B:"𝐁",C:"𝐂",D:"𝐃",E:"𝐄",F:"𝐅",G:"𝐆",H:"𝐇",I:"𝐈",J:"𝐉",K:"𝐊",L:"𝐋",M:"𝐌",
    N:"𝐍",O:"𝐎",P:"𝐏",Q:"𝐐",R:"𝐑",S:"𝐒",T:"𝐓",U:"𝐔",V:"𝐕",W:"𝐖",X:"𝐗",Y:"𝐘",Z:"𝐙",
    a:"𝐚",b:"𝐛",c:"𝐜",d:"𝐝",e:"𝐞",f:"𝐟",g:"𝐠",h:"𝐡",i:"𝐢",j:"𝐣",k:"𝐤",l:"𝐥",m:"𝐦",
    n:"𝐧",o:"𝐨",p:"𝐩",q:"𝐪",r:"𝐫",s:"𝐬",t:"𝐭",u:"𝐮",v:"𝐯",w:"𝐰",x:"𝐱",y:"𝐲",z:"𝐳",
    "0":"𝟎","1":"𝟏","2":"𝟐","3":"𝟑","4":"𝟒","5":"𝟓","6":"𝟔","7":"𝟕","8":"𝟖","9":"𝟗",
  };
  return str.split("").map(c=>map[c]||c).join("");
}

// ─── LOCAL STORAGE ────────────────────────────────────────────────────────────
function ls(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function lsSet(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }

function genId() { return "i_" + Math.random().toString(36).slice(2,9); }

// ─── SORT ITEMS IN SECTION ────────────────────────────────────────────────────
function sortSection(items, method) {
  const arr = [...items];
  if (method === "priceHL") return arr.sort((a,b)=>b.price-a.price);
  if (method === "priceLH") return arr.sort((a,b)=>a.price-b.price);
  if (method === "az")      return arr.sort((a,b)=>a.name.localeCompare(b.name));
  if (method === "za")      return arr.sort((a,b)=>b.name.localeCompare(a.name));
  return arr.sort((a,b)=>a.order-b.order); // manual
}

// ─── STOCK LIST GENERATOR ─────────────────────────────────────────────────────
function generateStockList(items, sections, sectionSort) {
  const header = `𝗙𝗢𝗥 𝗦𝗔𝗟𝗘 MM2 ITEMS❗\n𝗚𝗢𝗗𝗟𝗜𝗘𝗦 𝗙𝗢𝗥 𝗚𝗖𝗔𝗦𝗛\n[ 𝐋𝐎𝐀𝐃 : 𝐀𝐃𝐃 30% ]\n@ me for faster notice\n\nx0 = NO STOCK\nItem [Price] x = Quantity\n`;
  const footer = `\nPM / DM for direct notice\nWtu mm / mw (ADMODS)`;
  let body = "";
  for (const sec of sections) {
    const method = sectionSort[sec] || "manual";
    const secItems = sortSection(items.filter(i=>i.section===sec), method);
    if (secItems.length===0) continue;
    body += `\n${toBoldUnicode(sec.toUpperCase())}\n\n`;
    for (const item of secItems) body += `${item.name} [${item.price}] x${item.stock}\n`;
  }
  return header + body + footer;
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
function Toast({msg,onDone,accent}) {
  useEffect(()=>{ const t=setTimeout(onDone,2500); return ()=>clearTimeout(t); },[]);
  return <div style={{position:"fixed",bottom:88,left:"50%",transform:"translateX(-50%)",background:accent,color:"#111",padding:"10px 24px",borderRadius:10,fontWeight:800,fontSize:14,zIndex:9999,whiteSpace:"nowrap",boxShadow:"0 4px 24px #0009",letterSpacing:0.3}}>{msg}</div>;
}

// ─── REUSABLE STYLED HELPERS (theme-aware) ────────────────────────────────────
function mkStyles(theme, dark) {
  const bg0  = dark ? "#0b0b08" : "#f5f5ee";
  const bg1  = dark ? "#141410" : "#ebebdf";
  const bg2  = dark ? "#1c1c14" : "#e0e0d2";
  const bg3  = dark ? "#252518" : "#d4d4c4";
  const txt  = dark ? "#f0f0e0" : "#1a1a10";
  const txt2 = dark ? "#999990" : "#666655";
  const bdr  = dark ? accent(theme)+"22" : accent(theme)+"44";
  const a    = PALETTES[theme].accent;
  const aT   = PALETTES[theme].accentText;
  return {bg0,bg1,bg2,bg3,txt,txt2,bdr,a,aT};
}
function accent(theme) { return PALETTES[theme]?.accent || "#e2ff6e"; }
function accentText(theme) { return PALETTES[theme]?.accentText || "#1a1a0e"; }

// ─── ITEM CARD ────────────────────────────────────────────────────────────────
function ItemCard({item, onUpdate, onPatch, categories, sections, S, dragging, onDragStart, onDrop, expandEdit}) {
  const [stock, setStock] = useState(String(item.stock));
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({});
  useEffect(()=>{ setStock(String(item.stock)); },[item.stock]);

  function commitStock(v) {
    const n = Math.max(0, parseInt(v)||0);
    setStock(String(n));
    onUpdate(item.id, n);
  }

  function openEdit() {
    setDraft({name:item.name, price:item.price, category:item.category, section:item.section, notes:item.notes||""});
    setEditing(true);
  }

  function saveEdit() {
    onPatch(item.id, {...draft, price:Number(draft.price)||0});
    setEditing(false);
  }

  const a = S.a, aT = S.aT;
  return (
    <div
      draggable
      onDragStart={()=>onDragStart(item.id)}
      onDragOver={e=>e.preventDefault()}
      onDrop={()=>onDrop(item.id)}
      style={{background: dragging? S.bg3 : S.bg2, border:`1.5px solid ${S.bdr}`, borderRadius:12, padding:"12px 14px", marginBottom:10, opacity: dragging?0.5:1, transition:"background 0.15s"}}
    >
      {/* top row */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:700,fontSize:15,color:a,letterSpacing:0.3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</div>
          <div style={{fontSize:12,color:S.txt2,marginTop:2}}>
            {item.section} · <span style={{color:a+"aa"}}>GC {item.price}</span>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:0}}>
          <button onClick={()=>commitStock(String(Math.max(0,item.stock-1)))} style={mkBtn(a,aT)}>−</button>
          <input value={stock} onChange={e=>setStock(e.target.value)}
            onBlur={e=>commitStock(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&commitStock(stock)}
            style={{width:50,textAlign:"center",background:S.bg1,color:a,border:`1.5px solid ${a}44`,borderRadius:8,fontSize:17,fontWeight:700,padding:"6px 0",outline:"none"}}/>
          <button onClick={()=>commitStock(String(item.stock+1))} style={mkBtn(a,aT)}>+</button>
        </div>
      </div>

      {/* quick meta row */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:7}}>
        <div style={{fontSize:12,color:S.txt2}}>
          Stock: <span style={{color:a,fontWeight:700}}>{item.stock}</span>
          {item.notes && <span style={{marginLeft:8,color:S.txt2+"99"}}>{item.notes}</span>}
        </div>
        <button onClick={openEdit} style={{background:"transparent",border:`1px solid ${a}44`,color:a,borderRadius:7,padding:"3px 10px",cursor:"pointer",fontSize:11,fontWeight:700}}>
          ✎ Edit
        </button>
      </div>

      {/* inline edit panel */}
      {editing && (
        <div style={{marginTop:12,borderTop:`1px solid ${S.bdr}`,paddingTop:12}}>
          <FieldRow label="Name"><input style={mkInp(S)} value={draft.name} onChange={e=>setDraft(p=>({...p,name:e.target.value}))}/></FieldRow>
          <FieldRow label="Price"><input style={mkInp(S)} type="number" value={draft.price} onChange={e=>setDraft(p=>({...p,price:e.target.value}))}/></FieldRow>
          <FieldRow label="Category">
            <select style={mkInp(S)} value={draft.category} onChange={e=>setDraft(p=>({...p,category:e.target.value}))}>
              {categories.map(c=><option key={c}>{c}</option>)}
            </select>
          </FieldRow>
          <FieldRow label="Section">
            <select style={mkInp(S)} value={draft.section} onChange={e=>setDraft(p=>({...p,section:e.target.value}))}>
              {sections.map(s=><option key={s}>{s}</option>)}
            </select>
          </FieldRow>
          <FieldRow label="Notes"><input style={mkInp(S)} value={draft.notes} onChange={e=>setDraft(p=>({...p,notes:e.target.value}))}/></FieldRow>
          <div style={{display:"flex",gap:8,marginTop:8}}>
            <button onClick={saveEdit} style={{...mkBtn(a,aT),flex:1,borderRadius:9,height:38,fontSize:13,fontWeight:800}}>Save Changes</button>
            <button onClick={()=>setEditing(false)} style={{flex:1,borderRadius:9,height:38,fontSize:13,fontWeight:700,background:"transparent",color:S.txt2,border:`1px solid ${S.bdr}`,cursor:"pointer"}}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

function FieldRow({label,children}) {
  return <div style={{display:"flex",flexDirection:"column",gap:3,marginBottom:9}}><label style={{fontSize:11,fontWeight:700,color:"#888",letterSpacing:0.5,textTransform:"uppercase"}}>{label}</label>{children}</div>;
}
function mkBtn(a,aT) { return {width:38,height:38,borderRadius:8,background:a,color:aT,border:"none",fontSize:20,fontWeight:900,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",touchAction:"manipulation",userSelect:"none",flexShrink:0}; }
function mkInp(S) { return {background:S.bg1,color:S.txt,border:`1.5px solid ${S.bdr}`,borderRadius:8,padding:"8px 10px",fontSize:14,outline:"none",width:"100%",boxSizing:"border-box"}; }
function mkBtnSecondary(a,S) { return {background:"transparent",color:a,border:`1.5px solid ${a}44`,borderRadius:9,padding:"10px 0",fontSize:14,fontWeight:800,cursor:"pointer",letterSpacing:0.3,width:"100%"}; }

// ─── LIST EDITOR (categories / sections) ─────────────────────────────────────
function ListEditor({title,items,onAdd,onRename,onDelete,onReorder,accent:a,S}) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [renamingIdx, setRenamingIdx] = useState(null);
  const [renameVal, setRenameVal] = useState("");
  const [dragIdx, setDragIdx] = useState(null);

  function doAdd() {
    if (!newName.trim()) return;
    onAdd(newName.trim()); setNewName(""); setAdding(false);
  }
  function doRename(idx) {
    if (!renameVal.trim()) return;
    onRename(idx, renameVal.trim()); setRenamingIdx(null);
  }
  function dropOn(idx) {
    if (dragIdx==null||dragIdx===idx) return;
    const arr=[...items]; const [m]=arr.splice(dragIdx,1); arr.splice(idx,0,m);
    onReorder(arr); setDragIdx(null);
  }

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <div style={{fontWeight:700,fontSize:15,color:a}}>{title}</div>
        <button onClick={()=>setAdding(p=>!p)} style={{background:a,color:S.aT,border:"none",borderRadius:8,padding:"6px 14px",fontSize:13,fontWeight:800,cursor:"pointer"}}>+ Add</button>
      </div>
      {adding && (
        <div style={{display:"flex",gap:8,marginBottom:10}}>
          <input style={{...mkInp(S),flex:1}} autoFocus placeholder="Name..." value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doAdd()}/>
          <button onClick={doAdd} style={{...mkBtn(a,S.aT),borderRadius:8}}>✓</button>
        </div>
      )}
      {items.map((item,idx)=>(
        <div key={item} draggable onDragStart={()=>setDragIdx(idx)} onDragOver={e=>e.preventDefault()} onDrop={()=>dropOn(idx)}
          style={{background:S.bg2,border:`1px solid ${S.bdr}`,borderRadius:9,padding:"10px 12px",marginBottom:6,display:"flex",alignItems:"center",gap:8,cursor:"grab",opacity:dragIdx===idx?0.4:1}}>
          <span style={{color:S.txt2,fontSize:16,cursor:"grab"}}>⠿</span>
          {renamingIdx===idx ? (
            <>
              <input style={{...mkInp(S),flex:1,padding:"4px 8px"}} autoFocus value={renameVal} onChange={e=>setRenameVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doRename(idx)}/>
              <button onClick={()=>doRename(idx)} style={{...mkBtn(a,S.aT),width:30,height:30,borderRadius:6,fontSize:14}}>✓</button>
              <button onClick={()=>setRenamingIdx(null)} style={{background:"transparent",border:"none",color:S.txt2,cursor:"pointer",fontSize:16,padding:"0 4px"}}>✕</button>
            </>
          ) : (
            <>
              <span style={{flex:1,fontWeight:600,color:S.txt,fontSize:14}}>{item}</span>
              <button onClick={()=>{setRenamingIdx(idx);setRenameVal(item);}} style={{background:"transparent",border:`1px solid ${a}44`,color:a,borderRadius:6,padding:"3px 10px",cursor:"pointer",fontSize:12,fontWeight:700}}>Rename</button>
              <button onClick={()=>onDelete(idx)} style={{background:"transparent",border:`1px solid #ff6e6e44`,color:"#ff6e6e",borderRadius:6,padding:"3px 8px",cursor:"pointer",fontSize:12,fontWeight:700}}>✕</button>
            </>
          )}
        </div>
      ))}
      {items.length===0 && <div style={{textAlign:"center",color:S.txt2,padding:"20px 0",fontSize:13}}>No items yet.</div>}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  // ── State ────────────────────────────────────────────────────────────────
  const [items,       setItems]       = useState(()=>ls("mm2_items_v3",DEFAULT_ITEMS));
  const [categories,  setCategories]  = useState(()=>ls("mm2_cats_v3",DEFAULT_CATEGORIES));
  const [sections,    setSections]    = useState(()=>ls("mm2_secs_v3",DEFAULT_SECTIONS));
  const [sectionSort, setSectionSort] = useState(()=>ls("mm2_sort_v3",DEFAULT_SECTION_SORT));
  const [theme,       setTheme]       = useState(()=>ls("mm2_theme","yellow"));
  const [dark,        setDark]        = useState(()=>ls("mm2_dark",true));
  const [page,        setPage]        = useState("inventory");
  const [invTab,      setInvTab]      = useState(null);
  const [search,      setSearch]      = useState("");
  const [stockText,   setStockText]   = useState("");
  const [prevStocks,  setPrevStocks]  = useState({});
  const [history,     setHistory]     = useState([]);
  const [toast,       setToast]       = useState("");
  const [editItem,    setEditItem]    = useState(null);
  const [quickSearch, setQuickSearch] = useState("");
  const [quickItem,   setQuickItem]   = useState(null);
  const [quickVal,    setQuickVal]    = useState(0);
  const [dragId,      setDragId]      = useState(null);
  const [collapsed,   setCollapsed]   = useState({});

  // Sync invTab to categories changes
  useEffect(()=>{ if (!invTab || !categories.includes(invTab)) setInvTab(categories[0]||null); },[categories]);

  // persist everything
  useEffect(()=>lsSet("mm2_items_v3",items),[items]);
  useEffect(()=>lsSet("mm2_cats_v3",categories),[categories]);
  useEffect(()=>lsSet("mm2_secs_v3",sections),[sections]);
  useEffect(()=>lsSet("mm2_sort_v3",sectionSort),[sectionSort]);
  useEffect(()=>lsSet("mm2_theme",theme),[theme]);
  useEffect(()=>lsSet("mm2_dark",dark),[dark]);

  const S = mkStyles(theme, dark);
  const a = S.a, aT = S.aT;

  // ── Item helpers ──────────────────────────────────────────────────────────
  function updateStock(id,val) {
    setItems(prev=>prev.map(i=>i.id===id?{...i,stock:Math.max(0,val)}:i));
  }
  function patchItem(id,patch) {
    setItems(prev=>prev.map(i=>i.id===id?{...i,...patch}:i));
  }
  function deleteItem(id) {
    if (!confirm("Delete this item?")) return;
    setItems(prev=>prev.filter(i=>i.id!==id));
    setToast("Item deleted.");
  }
  function addItem(form) {
    const maxOrder = Math.max(0,...items.filter(i=>i.category===form.category).map(i=>i.order));
    setItems(prev=>[...prev,{...form,id:genId(),stock:0,order:maxOrder+1}]);
    setEditItem(null); setToast("Item added!");
  }
  function saveItemForm(form) {
    if (editItem==="new") addItem(form);
    else { patchItem(editItem.id,{...form,price:Number(form.price)||0}); setEditItem(null); setToast("Saved!"); }
  }

  // ── Category helpers ──────────────────────────────────────────────────────
  function renameCategory(idx, newName) {
    const old = categories[idx];
    setCategories(prev=>{const a=[...prev];a[idx]=newName;return a;});
    setItems(prev=>prev.map(i=>i.category===old?{...i,category:newName}:i));
    setToast(`Category renamed to "${newName}"`);
  }
  function deleteCategory(idx) {
    const name = categories[idx];
    if (!confirm(`Delete category "${name}"? Items inside will become uncategorized.`)) return;
    setCategories(prev=>prev.filter((_,i)=>i!==idx));
    setItems(prev=>prev.map(i=>i.category===name?{...i,category:"Uncategorized"}:i));
    setToast(`Category "${name}" deleted.`);
  }
  function addCategory(name) {
    if (categories.includes(name)) return setToast("Already exists.");
    setCategories(prev=>[...prev,name]); setToast("Category added!");
  }

  // ── Section helpers ───────────────────────────────────────────────────────
  function renameSection(idx, newName) {
    const old = sections[idx];
    setSections(prev=>{const a=[...prev];a[idx]=newName;return a;});
    setItems(prev=>prev.map(i=>i.section===old?{...i,section:newName}:i));
    setSectionSort(prev=>{
      const s={...prev};
      if (s[old]!==undefined){s[newName]=s[old];delete s[old];}
      return s;
    });
    setToast(`Section renamed to "${newName}"`);
  }
  function deleteSection(idx) {
    const name = sections[idx];
    if (!confirm(`Delete section "${name}"? Items inside will become unsectioned.`)) return;
    setSections(prev=>prev.filter((_,i)=>i!==idx));
    setItems(prev=>prev.map(i=>i.section===name?{...i,section:"Unsorted"}:i));
    setToast(`Section "${name}" deleted.`);
  }
  function addSection(name) {
    if (sections.includes(name)) return setToast("Already exists.");
    setSections(prev=>[...prev,name]); setToast("Section added!");
  }

  // ── Search ────────────────────────────────────────────────────────────────
  function doSearch(q) {
    setSearch(q);
    if (!q) return;
    const found = items.find(i=>i.name.toLowerCase().includes(q.toLowerCase()));
    if (found) {
      setInvTab(found.category);
      setTimeout(()=>{
        const el=document.getElementById("item_"+found.id);
        if(el) el.scrollIntoView({behavior:"smooth",block:"center"});
      },120);
    }
  }

  // ── Drag reorder ──────────────────────────────────────────────────────────
  function handleDrop(targetId) {
    if (!dragId||dragId===targetId) return;
    const cat=invTab;
    const catItems=items.filter(i=>i.category===cat).sort((a,b)=>a.order-b.order);
    const fromIdx=catItems.findIndex(i=>i.id===dragId);
    const toIdx=catItems.findIndex(i=>i.id===targetId);
    if(fromIdx<0||toIdx<0) return;
    const arr=[...catItems]; const [m]=arr.splice(fromIdx,1); arr.splice(toIdx,0,m);
    const orders={}; arr.forEach((it,i)=>orders[it.id]=i+1);
    setItems(prev=>prev.map(i=>orders[i.id]!==undefined?{...i,order:orders[i.id]}:i));
    setDragId(null);
  }

  // ── Update stock list ─────────────────────────────────────────────────────
  function doUpdateStockList() {
    const snap={}; items.forEach(i=>{snap[i.id]=i.stock;});
    const changes=items.filter(i=>(prevStocks[i.id]??null)!==null && prevStocks[i.id]!==i.stock);
    setHistory(changes.map(i=>({id:i.id,name:i.name,prev:prevStocks[i.id],curr:i.stock})));
    setPrevStocks(snap);
    setStockText(generateStockList(items,sections,sectionSort));
    setPage("stocklist"); setToast("Stock list updated!");
  }

  // ── Quick update ──────────────────────────────────────────────────────────
  useEffect(()=>{
    if(!quickSearch){setQuickItem(null);return;}
    const found=items.find(i=>i.name.toLowerCase().includes(quickSearch.toLowerCase()));
    if(found){setQuickItem(found);setQuickVal(found.stock);}
    else setQuickItem(null);
  },[quickSearch,items]);

  // ── Inventory items for current tab ───────────────────────────────────────
  const tabItems = items
    .filter(i=>i.category===invTab && (!search||i.name.toLowerCase().includes(search.toLowerCase())))
    .sort((a,b)=>a.order-b.order);

  // ── Nav pages config ──────────────────────────────────────────────────────
  const PAGES=[
    {id:"inventory",icon:"📦",label:"Inventory"},
    {id:"stocklist",icon:"📋",label:"Stock"},
    {id:"quick",    icon:"⚡",label:"Quick"},
    {id:"history",  icon:"📊",label:"History"},
    {id:"manage",   icon:"🗂",label:"Items"},
    {id:"cats",     icon:"📁",label:"Cats"},
    {id:"secs",     icon:"🏷",label:"Secs"},
    {id:"settings", icon:"⚙️",label:"Settings"},
  ];

  // ─── New Item Form ────────────────────────────────────────────────────────
  function ItemForm({initial,onSave,onCancel}) {
    const [f,setF]=useState(initial||{name:"",category:categories[0]||"",section:sections[0]||"",price:0,notes:"",order:999});
    function set(k,v){setF(p=>({...p,[k]:v}));}
    return (
      <div style={{background:S.bg2,border:`1.5px solid ${a}33`,borderRadius:14,padding:18,marginBottom:16}}>
        <FieldRow label="Item Name"><input style={mkInp(S)} value={f.name} onChange={e=>set("name",e.target.value)}/></FieldRow>
        <FieldRow label="Price (GC)"><input style={mkInp(S)} type="number" value={f.price} onChange={e=>set("price",e.target.value)}/></FieldRow>
        <FieldRow label="Category">
          <select style={mkInp(S)} value={f.category} onChange={e=>set("category",e.target.value)}>
            {categories.map(c=><option key={c}>{c}</option>)}
          </select>
        </FieldRow>
        <FieldRow label="Section">
          <select style={mkInp(S)} value={f.section} onChange={e=>set("section",e.target.value)}>
            {sections.map(s=><option key={s}>{s}</option>)}
          </select>
        </FieldRow>
        <FieldRow label="Display Order"><input style={mkInp(S)} type="number" value={f.order} onChange={e=>set("order",+e.target.value)}/></FieldRow>
        <FieldRow label="Notes (optional)"><input style={mkInp(S)} value={f.notes} onChange={e=>set("notes",e.target.value)}/></FieldRow>
        <div style={{display:"flex",gap:8,marginTop:10}}>
          <button onClick={()=>onSave(f)} style={{...mkBtn(a,aT),flex:1,borderRadius:10,height:42,fontSize:14,fontWeight:800}}>Save Item</button>
          <button onClick={onCancel} style={{...mkBtnSecondary(a,S),flex:0.5}}>Cancel</button>
        </div>
      </div>
    );
  }

  // ─── RENDER ───────────────────────────────────────────────────────────────
  const stickySearchTop = page==="inventory" ? 61 : 0;

  return (
    <div style={{minHeight:"100vh",background:S.bg0,color:S.txt,fontFamily:"'Rajdhani',sans-serif",paddingBottom:90}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;600;700&display=swap');
        *{box-sizing:border-box;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-track{background:${S.bg0};}
        ::-webkit-scrollbar-thumb{background:${a}44;border-radius:4px;}
        input[type=number]::-webkit-inner-spin-button{opacity:0.3;}
        select option{background:${S.bg2};color:${S.txt};}
      `}</style>

      {/* HEADER */}
      <div style={{background:S.bg1,borderBottom:`1px solid ${a}22`,padding:"13px 16px",position:"sticky",top:0,zIndex:60,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{fontSize:19,fontWeight:700,color:a,letterSpacing:1}}>MM2 Stock Manager</div>
          <div style={{fontSize:10,color:S.txt2,letterSpacing:1.5,textTransform:"uppercase"}}>Murder Mystery 2</div>
        </div>
        <div style={{background:a+"18",color:a,border:`1px solid ${a}33`,borderRadius:7,padding:"4px 10px",fontSize:12,fontWeight:700}}>
          {items.length} items
        </div>
      </div>

      {/* SEARCH (inventory only, sticky) */}
      {page==="inventory" && (
        <div style={{position:"sticky",top:61,zIndex:50,background:S.bg0,padding:"8px 14px",borderBottom:`1px solid ${a}11`}}>
          <input placeholder="🔍 Search items..." value={search} onChange={e=>doSearch(e.target.value)}
            style={{...mkInp(S),fontSize:14,padding:"9px 13px"}}/>
        </div>
      )}

      {/* NAV TABS (scrollable horizontal) */}
      <div style={{position:"sticky",top: page==="inventory"?109:61,zIndex:49,background:S.bg0,padding:"8px 14px 4px",borderBottom:`1px solid ${a}11`,display:"flex",gap:4,overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
        {PAGES.map(p=>(
          <button key={p.id} onClick={()=>setPage(p.id)} style={{
            padding:"7px 13px",borderRadius:8,border:"none",cursor:"pointer",whiteSpace:"nowrap",
            fontSize:12,fontWeight:700,flexShrink:0,
            background:page===p.id?a:S.bg2,
            color:page===p.id?aT:S.txt2,
            letterSpacing:0.4,
          }}>{p.icon} {p.label}</button>
        ))}
      </div>

      {/* PAGE CONTENT */}
      <div style={{padding:"14px 14px 0"}}>

        {/* ══ INVENTORY ══ */}
        {page==="inventory" && (
          <>
            {/* Category tabs */}
            <div style={{display:"flex",gap:5,marginBottom:12,overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
              {categories.map(c=>(
                <button key={c} onClick={()=>setInvTab(c)} style={{
                  flexShrink:0,padding:"8px 14px",borderRadius:9,cursor:"pointer",fontSize:13,fontWeight:700,
                  border:`1.5px solid ${invTab===c?a:a+"33"}`,
                  background:invTab===c?a:"transparent",
                  color:invTab===c?aT:a+"99",
                }}>{c}</button>
              ))}
            </div>

            {invTab ? (
              <>
                {tabItems.length===0 && <div style={{textAlign:"center",color:S.txt2,padding:40,fontSize:14}}>No items in this category.</div>}
                {tabItems.map(item=>(
                  <div key={item.id} id={"item_"+item.id}>
                    <ItemCard item={item} onUpdate={updateStock} onPatch={patchItem}
                      categories={categories} sections={sections} S={S}
                      dragging={dragId===item.id}
                      onDragStart={setDragId}
                      onDrop={handleDrop}
                    />
                  </div>
                ))}
              </>
            ) : (
              <div style={{textAlign:"center",color:S.txt2,padding:40}}>No categories yet. Add one in the Cats tab.</div>
            )}

            {/* Sticky Update btn */}
            <div style={{position:"sticky",bottom:75,padding:"10px 0",background:`linear-gradient(transparent,${S.bg0} 55%)`,zIndex:30}}>
              <button onClick={doUpdateStockList} style={{...mkBtn(a,aT),width:"100%",borderRadius:11,height:50,fontSize:16,fontWeight:800,letterSpacing:1,boxShadow:`0 4px 24px ${a}44`}}>
                ▶ UPDATE STOCK LIST
              </button>
            </div>
          </>
        )}

        {/* ══ STOCK LIST ══ */}
        {page==="stocklist" && (
          <>
            <div style={{fontSize:13,color:S.txt2,marginBottom:8}}>Your formatted stock list — edit freely:</div>
            <textarea value={stockText||generateStockList(items,sections,sectionSort)}
              onChange={e=>setStockText(e.target.value)}
              style={{...mkInp(S),height:400,fontFamily:"monospace",fontSize:13,lineHeight:1.75,resize:"vertical"}}/>
            <button onClick={()=>{
              navigator.clipboard.writeText(stockText||generateStockList(items,sections,sectionSort));
              setToast("Copied to clipboard!");
            }} style={{...mkBtn(a,aT),width:"100%",borderRadius:11,height:48,fontSize:15,fontWeight:800,marginTop:10}}>
              📋 COPY STOCK LIST
            </button>

            {history.length>0 && (
              <div style={{marginTop:20}}>
                <div style={{fontWeight:700,color:a,marginBottom:10,fontSize:15}}>📊 Last Update Changes</div>
                {history.map(h=>(
                  <div key={h.id} style={{background:S.bg2,border:`1px solid ${S.bdr}`,borderRadius:10,padding:"10px 14px",marginBottom:8}}>
                    <div style={{fontWeight:700,color:a}}>{h.name}</div>
                    <div style={{fontSize:13,color:S.txt2,marginTop:3}}>
                      Prev: <b style={{color:S.txt}}>{h.prev}</b> → Now: <b style={{color:a}}>{h.curr}</b>{" "}
                      <span style={{color:h.curr>h.prev?"#6eff9a":"#ff6e6e",fontWeight:800}}>{h.curr>h.prev?"+":""}{h.curr-h.prev}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ══ QUICK UPDATE ══ */}
        {page==="quick" && (
          <>
            <div style={{fontWeight:700,color:a,fontSize:17,marginBottom:12}}>⚡ Quick Update</div>
            <input placeholder="Search item name..." value={quickSearch} onChange={e=>setQuickSearch(e.target.value)}
              style={{...mkInp(S),marginBottom:14}} autoFocus/>
            {quickItem ? (
              <div style={{background:S.bg2,border:`1.5px solid ${a}44`,borderRadius:14,padding:20}}>
                <div style={{fontWeight:700,color:a,fontSize:20,marginBottom:3}}>{quickItem.name}</div>
                <div style={{fontSize:12,color:S.txt2,marginBottom:14}}>{quickItem.category} · {quickItem.section} · GC {quickItem.price}</div>
                <div style={{fontSize:14,color:S.txt2,marginBottom:10}}>Current Stock: <b style={{color:a}}>{quickItem.stock}</b></div>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
                  <button onClick={()=>setQuickVal(v=>Math.max(0,v-1))} style={{...mkBtn(a,aT),width:50,height:50}}>−</button>
                  <input type="number" value={quickVal} onChange={e=>setQuickVal(Math.max(0,+e.target.value))}
                    style={{...mkInp(S),width:80,textAlign:"center",fontSize:22,fontWeight:700}}/>
                  <button onClick={()=>setQuickVal(v=>v+1)} style={{...mkBtn(a,aT),width:50,height:50}}>+</button>
                </div>
                <button onClick={()=>{updateStock(quickItem.id,quickVal);setToast(`${quickItem.name} → x${quickVal}`);setQuickSearch("");}}
                  style={{...mkBtn(a,aT),width:"100%",borderRadius:11,height:46,fontSize:15,fontWeight:800}}>
                  ✓ SAVE
                </button>
              </div>
            ) : quickSearch && <div style={{textAlign:"center",color:S.txt2,padding:30}}>No item found.</div>}
          </>
        )}

        {/* ══ HISTORY ══ */}
        {page==="history" && (
          <>
            <div style={{fontWeight:700,color:a,fontSize:17,marginBottom:12}}>📊 Stock Change History</div>
            {history.length===0
              ? <div style={{textAlign:"center",color:S.txt2,padding:40}}>No history yet. Update your stock list first.</div>
              : history.map(h=>(
                  <div key={h.id} style={{background:S.bg2,border:`1px solid ${S.bdr}`,borderRadius:12,padding:"13px 15px",marginBottom:10}}>
                    <div style={{fontWeight:700,color:a,fontSize:15,marginBottom:5}}>{h.name}</div>
                    <div style={{display:"flex",gap:20,fontSize:14,flexWrap:"wrap"}}>
                      <div><span style={{color:S.txt2}}>Previous: </span><b style={{color:S.txt}}>{h.prev}</b></div>
                      <div><span style={{color:S.txt2}}>Current: </span><b style={{color:a}}>{h.curr}</b></div>
                      <div style={{color:h.curr>h.prev?"#6eff9a":"#ff6e6e",fontWeight:800}}>{h.curr>h.prev?"+":""}{h.curr-h.prev}</div>
                    </div>
                  </div>
                ))
            }
          </>
        )}

        {/* ══ MANAGE ITEMS ══ */}
        {page==="manage" && (
          <>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <div style={{fontWeight:700,color:a,fontSize:17}}>🗂 Manage Items</div>
              <button onClick={()=>setEditItem("new")} style={{...mkBtn(a,aT),width:"auto",borderRadius:9,padding:"0 16px",height:38,fontSize:13}}>+ Add Item</button>
            </div>
            {editItem && (
              <ItemForm initial={editItem==="new"?undefined:editItem} onSave={saveItemForm} onCancel={()=>setEditItem(null)}/>
            )}
            {categories.map(cat=>{
              const catItems=items.filter(i=>i.category===cat).sort((a,b)=>a.order-b.order);
              const open=!collapsed[cat];
              return (
                <div key={cat} style={{marginBottom:10}}>
                  <button onClick={()=>setCollapsed(p=>({...p,[cat]:!p[cat]}))}
                    style={{width:"100%",background:S.bg2,border:`1.5px solid ${S.bdr}`,borderRadius:10,padding:"10px 14px",
                      color:a,fontWeight:700,fontSize:14,textAlign:"left",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span>{cat}</span><span style={{color:S.txt2,fontSize:13}}>{catItems.length} items {open?"▲":"▼"}</span>
                  </button>
                  {open && catItems.map(item=>(
                    <div key={item.id} style={{background:S.bg1,border:`1px solid ${S.bdr}`,borderRadius:8,padding:"9px 13px",marginTop:4,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:700,color:a,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</div>
                        <div style={{fontSize:12,color:S.txt2}}>{item.section} · GC {item.price} · x{item.stock}</div>
                      </div>
                      <div style={{display:"flex",gap:6,flexShrink:0}}>
                        <button onClick={()=>setEditItem(item)} style={{background:a+"22",color:a,border:"none",borderRadius:7,padding:"5px 11px",cursor:"pointer",fontWeight:700,fontSize:12}}>Edit</button>
                        <button onClick={()=>deleteItem(item.id)} style={{background:"#ff6e6e22",color:"#ff6e6e",border:"none",borderRadius:7,padding:"5px 9px",cursor:"pointer",fontWeight:700,fontSize:12}}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </>
        )}

        {/* ══ CATEGORIES ══ */}
        {page==="cats" && (
          <ListEditor title="📁 Category Manager"
            items={categories}
            onAdd={addCategory}
            onRename={renameCategory}
            onDelete={deleteCategory}
            onReorder={setCategories}
            accent={a} S={S}/>
        )}

        {/* ══ SECTIONS ══ */}
        {page==="secs" && (
          <>
            <ListEditor title="🏷 Section Manager"
              items={sections}
              onAdd={addSection}
              onRename={renameSection}
              onDelete={deleteSection}
              onReorder={setSections}
              accent={a} S={S}/>

            {/* Sort settings per section */}
            <div style={{marginTop:20,borderTop:`1px solid ${S.bdr}`,paddingTop:16}}>
              <div style={{fontWeight:700,color:a,fontSize:15,marginBottom:12}}>⬆ Sort Settings per Section</div>
              {sections.map(sec=>{
                const cur=sectionSort[sec]||"manual";
                const opts=[
                  {val:"manual",  label:"Manual (drag order)"},
                  {val:"priceHL", label:"Price: High → Low"},
                  {val:"priceLH", label:"Price: Low → High"},
                  {val:"az",      label:"Alphabetical A → Z"},
                  {val:"za",      label:"Alphabetical Z → A"},
                ];
                return (
                  <div key={sec} style={{background:S.bg2,border:`1px solid ${S.bdr}`,borderRadius:10,padding:"12px 14px",marginBottom:10}}>
                    <div style={{fontWeight:700,color:a,marginBottom:8,fontSize:14}}>{sec}</div>
                    {opts.map(o=>(
                      <label key={o.val} style={{display:"flex",alignItems:"center",gap:9,marginBottom:6,cursor:"pointer",fontSize:14,color:S.txt}}>
                        <input type="radio" name={"sort_"+sec} checked={cur===o.val}
                          onChange={()=>setSectionSort(p=>({...p,[sec]:o.val}))}
                          style={{accentColor:a,width:16,height:16}}/>
                        {o.label}
                      </label>
                    ))}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ══ SETTINGS ══ */}
        {page==="settings" && (
          <>
            <div style={{fontWeight:700,color:a,fontSize:17,marginBottom:16}}>⚙️ Settings</div>

            {/* Theme mode */}
            <div style={{background:S.bg2,border:`1px solid ${S.bdr}`,borderRadius:12,padding:"14px 16px",marginBottom:14}}>
              <div style={{fontWeight:700,color:a,marginBottom:12,fontSize:14}}>🌙 Theme Mode</div>
              {[{val:true,label:"Dark Mode"},{val:false,label:"Light Mode"}].map(m=>(
                <label key={String(m.val)} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8,cursor:"pointer",fontSize:15,color:S.txt}}>
                  <input type="radio" checked={dark===m.val} onChange={()=>setDark(m.val)}
                    style={{accentColor:a,width:17,height:17}}/>
                  {m.label}
                </label>
              ))}
            </div>

            {/* Color palette */}
            <div style={{background:S.bg2,border:`1px solid ${S.bdr}`,borderRadius:12,padding:"14px 16px",marginBottom:14}}>
              <div style={{fontWeight:700,color:a,marginBottom:12,fontSize:14}}>🎨 Theme Color</div>
              {Object.entries(PALETTES).map(([key,pal])=>(
                <label key={key} style={{display:"flex",alignItems:"center",gap:12,marginBottom:10,cursor:"pointer"}}>
                  <input type="radio" checked={theme===key} onChange={()=>setTheme(key)}
                    style={{accentColor:pal.accent,width:17,height:17}}/>
                  <div style={{width:20,height:20,borderRadius:"50%",background:pal.accent,flexShrink:0}}/>
                  <span style={{fontSize:15,color:S.txt,fontWeight:theme===key?700:400}}>{pal.name}</span>
                  {theme===key && <span style={{fontSize:11,background:pal.accent,color:pal.accentText,borderRadius:5,padding:"2px 8px",fontWeight:800}}>Active</span>}
                </label>
              ))}
            </div>

            {/* Stats */}
            <div style={{background:S.bg2,border:`1px solid ${S.bdr}`,borderRadius:12,padding:"14px 16px",marginBottom:14}}>
              <div style={{fontWeight:700,color:a,marginBottom:10,fontSize:14}}>📈 Stats</div>
              {[
                ["Total Items", items.length],
                ["Categories", categories.length],
                ["Sections", sections.length],
                ["Total Stock", items.reduce((s,i)=>s+i.stock,0)],
              ].map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${S.bdr}`,fontSize:14}}>
                  <span style={{color:S.txt2}}>{k}</span><span style={{fontWeight:700,color:a}}>{v}</span>
                </div>
              ))}
            </div>

            {/* Reset */}
            <button onClick={()=>{
              if(!confirm("Reset ALL data to defaults? This cannot be undone.")) return;
              setItems(DEFAULT_ITEMS); setCategories(DEFAULT_CATEGORIES);
              setSections(DEFAULT_SECTIONS); setSectionSort({});
              setToast("Data reset to defaults.");
            }} style={{width:"100%",padding:"12px 0",borderRadius:10,background:"transparent",color:"#ff6e6e",border:"1.5px solid #ff6e6e44",cursor:"pointer",fontWeight:800,fontSize:14}}>
              ⚠ Reset All Data
            </button>
          </>
        )}

      </div>

      {/* BOTTOM NAV */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,background:S.bg1,borderTop:`1px solid ${a}22`,display:"flex",zIndex:60,overflowX:"auto"}}>
        {PAGES.map(p=>(
          <button key={p.id} onClick={()=>setPage(p.id)} style={{
            flex:"1 0 auto",minWidth:40,padding:"10px 4px 6px",border:"none",background:"transparent",
            cursor:"pointer",fontSize:18,display:"flex",flexDirection:"column",alignItems:"center",gap:1,
            opacity:page===p.id?1:0.32,
            borderTop:page===p.id?`2px solid ${a}`:"2px solid transparent",
          }}>
            <span>{p.icon}</span>
            <span style={{fontSize:8,fontWeight:700,color:page===p.id?a:S.txt2,letterSpacing:0.3,textTransform:"uppercase"}}>{p.label}</span>
          </button>
        ))}
      </div>

      {toast && <Toast msg={toast} onDone={()=>setToast("")} accent={a}/>}
    </div>
  );
}
