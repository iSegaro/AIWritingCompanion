chrome.runtime.onMessage.addListener(((e,r,s)=>{if("playOffscreenAudio"===e.action&&e.url){const r=new Audio(e.url);return r.crossOrigin="anonymous",r.addEventListener("ended",(()=>{s({success:!0})})),r.addEventListener("error",(e=>{s({success:!1,error:e.message||"Audio playback error"})})),r.play().then((()=>{})).catch((e=>{s({success:!1,error:e.message})})),!0}}));