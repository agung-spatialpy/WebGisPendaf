const map = L.map('map', {preferCanvas:true});
const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 20, attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);
let kerjaLayer, ukurLayer, kerjaData, ukurData, comparisonData=[];
const fmt = n => n==null || !Number.isFinite(Number(n)) ? '—' : Number(n).toLocaleString('id-ID',{minimumFractionDigits:2,maximumFractionDigits:2});
const safe = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function styleKerja(){return {color:'#1768b2',weight:2,fillColor:'#3d91d5',fillOpacity:.24};}
function styleUkur(){return {color:'#b96618',weight:2,fillColor:'#efa34e',fillOpacity:.32,dashArray:'5 3'};}
function popup(feature, source){
  const p=feature.properties||{};
  return `<div class="popup-title">${safe(p.Bidang||'Bidang tanpa nama')}</div>
    <div class="popup-line">Sumber: ${source}</div>
    <div class="popup-line">ID: ${safe(p.id??'—')}</div>
    <div class="popup-line">Luas: <b>${fmt(p.luas_m2)} m²</b></div>`;
}
function onEach(source){return (feature,layer)=>layer.bindPopup(popup(feature,source));}
function updateStats(){
  const sum = data => data.features.reduce((s,f)=>s+Number(f.properties.luas_m2||0),0);
  document.getElementById('statKerja').textContent=kerjaData.features.length;
  document.getElementById('statUkur').textContent=ukurData.features.length;
  document.getElementById('totalKerja').textContent=fmt(sum(kerjaData));
  document.getElementById('totalUkur').textContent=fmt(sum(ukurData));
}
function renderTable(filter=''){
  const body=document.getElementById('comparisonBody');
  const rows=comparisonData.filter(r=>r.bidang.toLowerCase().includes(filter.toLowerCase()));
  body.innerHTML=rows.map(r=>{
    const statusClass=r.status==='Cocok'?'':'missing';
    return `<tr><td><b>${safe(r.bidang)}</b></td><td class="num">${fmt(r.luas_digitasi)}</td>
      <td class="num">${fmt(r.luas_ukur)}</td><td class="num">${fmt(r.selisih)}</td>
      <td><span class="status ${statusClass}">${safe(r.status)}</span></td></tr>`;
  }).join('') || '<tr><td colspan="5">Tidak ada bidang yang cocok dengan pencarian.</td></tr>';
}
function showDetail(feature, source){
  const p=feature.properties||{};
  document.getElementById('detailPanel').innerHTML=`<h2>Informasi bidang</h2>
    <div class="detail-grid">
      <div class="detail-item"><span>Nama bidang</span><strong>${safe(p.Bidang||'—')}</strong></div>
      <div class="detail-item"><span>Layer</span><strong>${source}</strong></div>
      <div class="detail-item"><span>ID fitur</span><strong>${safe(p.id??'—')}</strong></div>
      <div class="detail-item"><span>Luas</span><strong>${fmt(p.luas_m2)} m²</strong></div>
      <div class="detail-item"><span>Luas (hektare)</span><strong>${fmt(p.luas_ha)} ha</strong></div>
    </div><p class="detail-source">Luas dihitung dari geometri pada CRS EPSG:32748.</p>`;
}
function zoomToName(name){
  const matches=[];
  [kerjaLayer,ukurLayer].forEach(layer=>layer.eachLayer(l=>{
    if(String(l.feature?.properties?.Bidang||'').toLowerCase()===name.toLowerCase()) matches.push(l);
  }));
  if(!matches.length){document.getElementById('searchMessage').textContent='Bidang tidak ditemukan.';return;}
  const group=L.featureGroup(matches);map.fitBounds(group.getBounds().pad(.25));
  matches[0].openPopup();showDetail(matches[0].feature,matches[0].feature.properties.__source||'Layer');
  document.getElementById('searchMessage').textContent=`Menemukan ${matches.length} fitur dengan nama ${name}.`;
}
async function init(){
  try{
    const [k,u,c,s]=await Promise.all([
      fetch('data/peta_kerja.geojson').then(r=>{if(!r.ok)throw Error('peta_kerja.geojson');return r.json()}),
      fetch('data/hasil_ukur.geojson').then(r=>{if(!r.ok)throw Error('hasil_ukur.geojson');return r.json()}),
      fetch('data/perbandingan.json').then(r=>r.json()),
      fetch('data/statistik.json').then(r=>r.json())
    ]);
    kerjaData=k;ukurData=u;comparisonData=c;
    kerjaData.features.forEach(f=>f.properties.__source='Peta kerja');
    ukurData.features.forEach(f=>f.properties.__source='Hasil ukur');
    kerjaLayer=L.geoJSON(kerjaData,{style:styleKerja,onEachFeature:(f,l)=>{l.bindPopup(popup(f,'Peta kerja'));l.on('click',()=>showDetail(f,'Peta kerja'));}});
    ukurLayer=L.geoJSON(ukurData,{style:styleUkur,onEachFeature:(f,l)=>{l.bindPopup(popup(f,'Hasil ukur'));l.on('click',()=>showDetail(f,'Hasil ukur'));}});
    kerjaLayer.addTo(map);ukurLayer.addTo(map);
    const bounds=L.featureGroup([kerjaLayer,ukurLayer]).getBounds();map.fitBounds(bounds.pad(.12));
    updateStats();renderTable();
    document.getElementById('rmseValue').textContent=Number(s.rmse_sumber_excel).toLocaleString('id-ID',{minimumFractionDigits:6,maximumFractionDigits:6});
    document.getElementById('toggleKerja').addEventListener('change',e=>e.target.checked?map.addLayer(kerjaLayer):map.removeLayer(kerjaLayer));
    document.getElementById('toggleUkur').addEventListener('change',e=>e.target.checked?map.addLayer(ukurLayer):map.removeLayer(ukurLayer));
    document.getElementById('toggleBasemap').addEventListener('change',e=>e.target.checked?map.addLayer(osm):map.removeLayer(osm));
    document.getElementById('zoomAll').addEventListener('click',()=>map.fitBounds(L.featureGroup([kerjaLayer,ukurLayer]).getBounds().pad(.12)));
    document.getElementById('searchBtn').addEventListener('click',()=>zoomToName(document.getElementById('searchInput').value.trim()));
    document.getElementById('searchInput').addEventListener('keydown',e=>{if(e.key==='Enter')zoomToName(e.target.value.trim())});
    document.getElementById('tableSearch').addEventListener('input',e=>renderTable(e.target.value));
  }catch(err){
    console.error(err);
    document.getElementById('map').innerHTML='<div style="padding:24px;color:#9b2c2c">Gagal memuat data. Jalankan aplikasi melalui server lokal sesuai petunjuk README, bukan dengan membuka index.html langsung.</div>';
  }
}
init();
