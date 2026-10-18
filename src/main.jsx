import React, {useEffect, useRef, useState, useCallback} from 'react';
import {createRoot} from 'react-dom/client';
import QRCode from 'qrcode';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {MapPin, UploadCloud, Image as ImageIcon, Download, CalendarDays, Clock3, LocateFixed, Map, SlidersHorizontal, RotateCcw, ChevronDown, Layers3, ShieldCheck, Check, X, Sun, Moon, Smartphone, ArrowUpRight, Trash2, MoveVertical, QrCode, Info, Menu} from 'lucide-react';
import './style.css';

const initial = {title:'Markal, Maharashtra 412105',address:'Markal, Maharashtra 412105, India',lat:'18.667000',lng:'73.900000',date:'2026-10-17',time:'12:42',label:'Field visit',theme:'dark',qr:true,coordinates:true,position:'bottom',opacity:68,scale:100,margin:3,mark:true};
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const locValid=(lat,lng)=>Number.isFinite(Number(lat))&&Number.isFinite(Number(lng))&&lat!==''&&lng!==''&&Math.abs(Number(lat))<=90&&Math.abs(Number(lng))<=180;
const locUrl=(s)=>`https://www.openstreetmap.org/?mlat=${encodeURIComponent(s.lat)}&mlon=${encodeURIComponent(s.lng)}#map=15/${encodeURIComponent(s.lat)}/${encodeURIComponent(s.lng)}`;
const pad=(n)=>String(n).padStart(2,'0');
function friendlyDate(s){if(!s)return 'Date not set';const [y,m,d]=s.split('-').map(Number);const dt=new Date(y,m-1,d);return Number.isNaN(+dt)?s:`${dt.toLocaleDateString('en-US',{weekday:'long'})}, ${pad(d)}/${pad(m)}/${y}`}
function friendlyTime(s){const [h,m]=String(s||'').split(':').map(Number);if(!Number.isFinite(h)||!Number.isFinite(m))return s||'';return `${pad(h%12||12)}:${pad(m)} ${h>=12?'PM':'AM'}`}
function rounded(ctx,x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
function textFit(ctx,str,max){let t=String(str||'');while(t.length>2&&ctx.measureText(t).width>max)t=t.slice(0,-2);return t.length<String(str||'').length?t+'…':t}
function buildOverlay(ctx,w,h,s,qrCanvas,preview=false){
 const portrait=h>w, base=Math.min(w,portrait?1080:1700); const unit=base/1080*(Number(s.scale)/100); const inset=clamp(Math.round(Math.min(w,h)*Number(s.margin)/100),4,Math.min(w,h)*.16);
 const isDark=s.theme==='dark', fg=isDark?'#fff':'#152235',sub=isDark?'rgba(255,255,255,.81)':'#536178';
 const padX=clamp(25*unit,10,80), vPad=clamp(20*unit,9,65), qrSize=s.qr?clamp(160*unit,48,300):0;
 const fontA=clamp(34*unit,13,100),fontB=clamp(22*unit,10,65),fontC=clamp(20*unit,9,60),badge=clamp(17*unit,9,55);
 const available=w-inset*2;const desiredH=Math.max(qrSize+vPad*2, vPad*2+fontA*1.3+fontB*1.6+fontC*2.5+badge*1.8);
 const oh=Math.min(h*.65,desiredH), y=s.position==='top'?inset:s.position==='middle'?(h-oh)/2:h-inset-oh;
 const color=isDark?`rgba(9,19,33,${Number(s.opacity)/100})`:`rgba(255,255,255,${Number(s.opacity)/100})`;
 ctx.save(); rounded(ctx,inset,y,available,oh,clamp(23*unit,10,36));ctx.fillStyle=color;ctx.fill();
 ctx.strokeStyle=isDark?'rgba(255,255,255,.15)':'rgba(31,43,62,.12)';ctx.lineWidth=Math.max(1,unit);ctx.stroke();
 const x=inset+padX, maxW=Math.max(30,available-padX*2-(s.qr?qrSize+padX:0));
 let cy=y+vPad+fontA*.9;ctx.fillStyle=fg;ctx.font=`700 ${fontA}px Inter, system-ui, Arial`;ctx.fillText(textFit(ctx,s.title||'Untitled location',maxW),x,cy);
 cy+=fontB*1.8;ctx.fillStyle=sub;ctx.font=`400 ${fontB}px Inter, system-ui, Arial`;ctx.fillText(textFit(ctx,s.address||'Add an address',maxW),x,cy);
 if(s.coordinates){cy+=fontC*1.8;ctx.font=`400 ${fontC}px Inter, system-ui, Arial`;ctx.fillText(textFit(ctx,`Lat ${s.lat||'—'}°  Long ${s.lng||'—'}°`,maxW),x,cy)}
 cy+=fontC*1.8;ctx.fillText(textFit(ctx,`${friendlyDate(s.date)}  ${friendlyTime(s.time)}`,maxW),x,cy);
 if(s.mark){ctx.fillStyle=isDark?'rgba(233,241,255,.67)':'rgba(68,83,103,.84)';ctx.font=`600 ${badge}px Inter, system-ui, Arial`;ctx.fillText(textFit(ctx,'CUSTOM GEO TAG  ·  USER-ENTERED DETAILS',maxW),x,y+oh-vPad*.75)}
 if(s.qr&&qrCanvas){const bx=inset+available-padX-qrSize,by=y+(oh-qrSize)/2;ctx.fillStyle='#fff';rounded(ctx,bx-qrSize*.07,by-qrSize*.07,qrSize*1.14,qrSize*1.14,qrSize*.13);ctx.fill();ctx.drawImage(qrCanvas,bx,by,qrSize,qrSize)}
 ctx.restore();
}
function MapPicker({value,onPick,onClose}){
 const div=useRef(null);const handler=useRef(onPick);handler.current=onPick;
 useEffect(()=>{
  const valid=locValid(value.lat,value.lng),pos=valid?[Number(value.lat),Number(value.lng)]:[20.5937,78.9629];
  const map=L.map(div.current,{zoomControl:true}).setView(pos,valid?13:5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; OpenStreetMap contributors',maxZoom:19}).addTo(map);
  const marker=L.circleMarker(pos,{radius:10,color:'#6c64fa',fillColor:'#847cff',weight:3,fillOpacity:.9}).addTo(map);
  map.on('click',(e)=>{marker.setLatLng(e.latlng);handler.current(e.latlng.lat.toFixed(6),e.latlng.lng.toFixed(6))});
  setTimeout(()=>map.invalidateSize(),150);
  return ()=>map.remove();
 },[]);
 return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><div className="map-modal"><div className="modal-head"><div><h3>Choose on map</h3><p>Tap anywhere to update coordinates.</p></div><button className="icon-btn" onClick={onClose} aria-label="Close map"><X size={19}/></button></div><div ref={div} className="map-view"/><div className="map-foot"><span><MapPin size={15}/> {value.lat}, {value.lng}</span><button className="primary mini" onClick={onClose}>Use location <Check size={15}/></button></div></div></div>
}
function App(){
 const [s,setS]=useState(initial),[file,setFile]=useState(null),[img,setImg]=useState(null),[qr,setQr]=useState(null),[exporting,setExporting]=useState(false),[mapOpen,setMapOpen]=useState(false),[tab,setTab]=useState('details'),[toast,setToast]=useState(''),[mobilePanel,setMobilePanel]=useState(true);
 const previewRef=useRef(null),fileRef=useRef(null),urlRef=useRef(null),imgRef=useRef(null);
 const update=(k,v)=>setS(p=>({...p,[k]:v}));
 const notify=(m)=>{setToast(m);setTimeout(()=>setToast(''),3000)};
 const loadFile=(f)=>{if(!f)return;if(!f.type.startsWith('image/')){notify('Please choose a JPG, PNG, WebP or HEIC-supported image.');return}if(f.size>45*1024*1024){notify('Image is too large (maximum 45 MB).');return}
  const url=URL.createObjectURL(f),im=new Image();im.onload=()=>{if(urlRef.current)URL.revokeObjectURL(urlRef.current);urlRef.current=url;setImg(im);imgRef.current=im;setFile({name:f.name,size:f.size});notify('Image ready to edit')};im.onerror=()=>{URL.revokeObjectURL(url);notify('This image format could not be opened in your browser.')};im.src=url;
 };
 useEffect(()=>{const handler=e=>{if(e.key==='Escape')setMapOpen(false)};window.addEventListener('keydown',handler);return()=>{window.removeEventListener('keydown',handler);if(urlRef.current)URL.revokeObjectURL(urlRef.current)}},[]);
 useEffect(()=>{let active=true;const value=locValid(s.lat,s.lng)?locUrl(s):`Location: ${s.address}`;QRCode.toCanvas(value,{width:280,margin:1,errorCorrectionLevel:'M',color:{dark:'#121826',light:'#ffffff'}}).then(c=>{if(active)setQr(c)}).catch(()=>setQr(null));return()=>{active=false}},[s.lat,s.lng,s.address]);
 const render=useCallback((canvas,im,isPreview=false)=>{if(!im||!canvas)return;let w=im.naturalWidth,h=im.naturalHeight;if(isPreview){const limit=1300,r=Math.min(1,limit/Math.max(w,h));w=Math.max(1,Math.round(w*r));h=Math.max(1,Math.round(h*r))}canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d',{alpha:false});ctx.imageSmoothingQuality='high';ctx.drawImage(im,0,0,w,h);buildOverlay(ctx,w,h,s,qr,isPreview)},[s,qr]);
 useEffect(()=>{if(img&&previewRef.current)render(previewRef.current,img,true)},[img,render]);
 const download=async()=>{if(!img){notify('Upload a photo first');return}setExporting(true);try{const c=document.createElement('canvas');render(c,img);const blob=await new Promise(ok=>c.toBlob(ok,'image/png'));if(!blob)throw new Error('Unable to export');const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`geotag-${(s.date||'photo')}.png`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);notify('PNG saved successfully')}catch(e){notify('Could not export image. Try a smaller photo.')}finally{setExporting(false)}};
 const useNow=()=>{const d=new Date();update('date',`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`);setS(p=>({...p,date:`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`,time:`${pad(d.getHours())}:${pad(d.getMinutes())}`}))};
 const gps=()=>{if(!navigator.geolocation){notify('Location is not supported in this browser');return}navigator.geolocation.getCurrentPosition(p=>{setS(x=>({...x,lat:p.coords.latitude.toFixed(6),lng:p.coords.longitude.toFixed(6)}));notify('Current coordinates added')},()=>notify('Enable location permission and try again'),{enableHighAccuracy:true,timeout:12000})};
 const reset=()=>{setS(initial);notify('Settings restored to defaults')};
 return <div className="app-shell">
 <header className="site-header"><div className="brand"><div className="brand-icon"><MapPin size={22} strokeWidth={2.7}/></div><div><strong>GeoTag<span>Studio</span></strong><small>PHOTO LOCATION EDITOR</small></div></div><div className="header-right"><span className="header-status"><span className="live-dot"/> All edits stay in your browser</span><button className="outline header-export" onClick={download} disabled={!img||exporting}><Download size={16}/> Export photo</button></div></header>
 <main className="main"><div className="page-intro"><div><div className="eyebrow"><span/> YOUR CREATIVE WORKSPACE</div><h1>Give every photo its <em>place.</em></h1><p>Beautiful location stamps, your details, your photos. Designed for mobile and desktop.</p></div><div className="intro-pill"><ShieldCheck size={17}/> Private, browser-based editing</div></div>
 <section className="workspace"><aside className={`sidebar ${mobilePanel?'expanded':''}`}><div className="panel-title"><div><SlidersHorizontal size={18}/><strong>Editor controls</strong></div><button className="reset" onClick={reset}><RotateCcw size={14}/> Reset</button></div>
 <div className="tabbar"><button className={tab==='details'?'active':''} onClick={()=>setTab('details')}><MapPin size={16}/> Location & time</button><button className={tab==='style'?'active':''} onClick={()=>setTab('style')}><Layers3 size={16}/> Appearance</button></div>
 <div className="controls-scroll">{tab==='details'?<>
  <div className="field-title"><span>01</span> PHOTO SOURCE</div><button className="upload-tile" onClick={()=>fileRef.current?.click()}><div className="upload-icon"><UploadCloud size={21}/></div><div><strong>{file?'Change your photo':'Click to upload a photo'}</strong><small>{file?file.name:'JPG, PNG, WebP · Up to 45 MB'}</small></div><ArrowUpRight size={17}/></button><input ref={fileRef} className="hidden" type="file" accept="image/*" onChange={e=>{loadFile(e.target.files?.[0]);e.target.value=''}}/>
 <div className="field-title top-title"><span>02</span> LOCATION DETAILS</div>
 <label className="field"><span>Location name</span><div className="input-wrap"><MapPin size={16}/><input value={s.title} onChange={e=>update('title',e.target.value)} placeholder="e.g. Markal, Maharashtra"/></div></label>
 <label className="field"><span>Full address</span><input className="plain-input" value={s.address} onChange={e=>update('address',e.target.value)} placeholder="Enter full address"/></label>
 <div className="field grid-two"><label><span>Latitude</span><input className="plain-input" inputMode="decimal" value={s.lat} onChange={e=>update('lat',e.target.value)} placeholder="18.667000"/></label><label><span>Longitude</span><input className="plain-input" inputMode="decimal" value={s.lng} onChange={e=>update('lng',e.target.value)} placeholder="73.900000"/></label></div>
 {!locValid(s.lat,s.lng)&&<p className="validation">Use latitude between -90 and 90 and longitude between -180 and 180.</p>}
 <div className="location-actions"><button onClick={()=>setMapOpen(true)}><Map size={15}/> Pick on map</button><button onClick={gps}><LocateFixed size={15}/> My location</button></div>
 <div className="field-title top-title"><span>03</span> DATE & TIME</div>
 <div className="field grid-two"><label><span>Date</span><input className="plain-input" type="date" value={s.date} onChange={e=>update('date',e.target.value)}/></label><label><span>Time</span><input className="plain-input" type="time" value={s.time} onChange={e=>update('time',e.target.value)}/></label></div>
 <button className="subtle-action" onClick={useNow}><Clock3 size={15}/> Set current date & time</button>
 </>:<>
 <div className="field-title"><span>01</span> OVERLAY STYLE</div>
 <div className="field"><span>Card theme</span><div className="segmented"><button className={s.theme==='dark'?'selected':''} onClick={()=>update('theme','dark')}><Moon size={16}/> Dark glass</button><button className={s.theme==='light'?'selected':''} onClick={()=>update('theme','light')}><Sun size={16}/> Light glass</button></div></div>
 <div className="field"><span>Overlay placement</span><div className="segmented"><button className={s.position==='top'?'selected':''} onClick={()=>update('position','top')}>Top</button><button className={s.position==='middle'?'selected':''} onClick={()=>update('position','middle')}>Middle</button><button className={s.position==='bottom'?'selected':''} onClick={()=>update('position','bottom')}>Bottom</button></div></div>
 <div className="field"><div className="range-label"><span>Glass opacity</span><b>{s.opacity}%</b></div><input type="range" min="30" max="95" value={s.opacity} onChange={e=>update('opacity',e.target.value)}/></div>
 <div className="field"><div className="range-label"><span>Overlay scale</span><b>{s.scale}%</b></div><input type="range" min="60" max="155" value={s.scale} onChange={e=>update('scale',e.target.value)}/></div>
 <div className="field"><div className="range-label"><span>Edge spacing</span><b>{s.margin}%</b></div><input type="range" min="1" max="10" value={s.margin} onChange={e=>update('margin',e.target.value)}/></div>
 <div className="field-title top-title"><span>02</span> DISPLAY OPTIONS</div>
 <label className="toggle-row"><div><QrCode size={17}/><span>Location QR code</span></div><input type="checkbox" checked={s.qr} onChange={e=>update('qr',e.target.checked)}/></label>
 <label className="toggle-row"><div><MapPin size={17}/><span>Show coordinates</span></div><input type="checkbox" checked={s.coordinates} onChange={e=>update('coordinates',e.target.checked)}/></label>
 <label className="toggle-row"><div><Info size={17}/><span>Custom geotag label</span></div><input type="checkbox" checked={s.mark} onChange={e=>update('mark',e.target.checked)}/></label>
 <p className="editor-note">Location and timestamps are manually entered; the export does not change your photo's original GPS/EXIF metadata.</p>
 </>}</div>
 <div className="panel-bottom"><button className="primary" onClick={download} disabled={!img||exporting}><Download size={17}/>{exporting?'Preparing PNG…':'Download HD photo'}<ArrowUpRight size={17}/></button><p>Full-resolution PNG · No server upload</p></div></aside>
 <div className="preview-column"><div className="preview-top"><div><div className="preview-title"><span className="preview-dot"/> Live preview</div><p>See your location design instantly</p></div><div className="preview-tools"><span><Smartphone size={15}/> Auto fit</span><span><ImageIcon size={15}/> {img?`${img.naturalWidth} × ${img.naturalHeight}`:'Portrait + Landscape'}</span></div></div>
 <div className={`preview-stage ${!img?'stage-empty':''}`} onDragOver={e=>{e.preventDefault()}} onDrop={e=>{e.preventDefault();loadFile(e.dataTransfer.files?.[0])}}>{img?<canvas ref={previewRef} className="photo-canvas" aria-label="Photo with geotag overlay"/>:<div className="empty-preview"><div className="empty-art"><div className="sun"/><div className="mountain m1"/><div className="mountain m2"/><div className="art-pin"><MapPin size={29}/></div><div className="art-overlay"><div className="art-lines"><i/><i/><i/></div><div className="art-qr"><QrCode size={31}/></div></div></div><h2>Your photo goes here</h2><p>Upload any portrait or landscape photo to start creating your custom geo tag.</p><button className="primary preview-upload" onClick={()=>fileRef.current?.click()}><UploadCloud size={17}/> Choose a photo</button><small>or drag & drop an image anywhere here</small></div>}</div>
 <div className="preview-bottom"><div><ShieldCheck size={17}/><span>Your photos never leave your device</span></div><div className="formats">JPG <span>·</span> PNG <span>·</span> WebP</div></div>
 <div className="tips"><div className="tip-icon"><Info size={17}/></div><div><strong>Made for every orientation.</strong> The stamp automatically adapts to portrait and landscape photographs while preserving the original photo resolution.</div></div>
 </div></section><footer><span>© 2026 GeoTag Studio</span><span>Designed for creators, field teams & everyday photos</span></footer></main>
 {mapOpen&&<MapPicker value={s} onPick={(lat,lng)=>setS(p=>({...p,lat,lng}))} onClose={()=>setMapOpen(false)}/>}{toast&&<div className="toast"><Check size={17}/>{toast}</div>}
 </div>
}
createRoot(document.getElementById('root')).render(<App/>);
