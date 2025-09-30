import React from "react";
 // tabs: tasks | music | story | ach | journal
export default function TopTabs({ tab, setTab }) {
  return (
    <div style={{ display:"flex", gap:12, marginBottom:12, flexWrap:"wrap" }}>
      <button className={`tab ${tab==="tasks"?"active":""}`} onClick={()=>setTab("tasks")}>Tasks</button>
      <button className={`tab ${tab==="music"?"active":""}`} onClick={()=>setTab("music")}>Music</button>
      <button className={`tab ${tab==="story"?"active":""}`} onClick={()=>setTab("story")}>Story</button>
      <button className={`tab ${tab==="ach"?"active":""}`} onClick={()=>setTab("ach")}>Achievements</button>
      <button className={`tab ${tab==="journal"?"active":""}`} onClick={()=>setTab("journal")}>Journal</button>
    </div>
  );
}
