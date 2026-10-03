const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'NIKXITER';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '129837465';
const ROOT = __dirname;
const DATA = process.env.DATA_DIR || path.join(ROOT, 'data');
const UPLOADS = process.env.UPLOAD_DIR || path.join(ROOT, 'uploads');
fs.mkdirSync(DATA, {recursive:true}); fs.mkdirSync(UPLOADS, {recursive:true});

const productsDefault = {
  dripapk:{name:'DRIP CLIENT APKMOD',status:'ready',prices:{'1 Hari':10000,'3 Hari':25000,'7 Hari':45000,'15 Hari':70000,'30 Hari':100000},stock:{'1 Hari':[],'3 Hari':[],'7 Hari':[],'15 Hari':[],'30 Hari':[]}},
  dripproxy:{name:'DRIP CLIENT PROXY',status:'ready',prices:{'1 Hari':10000,'3 Hari':25000,'7 Hari':45000,'30 Hari':100000},stock:{'1 Hari':[],'3 Hari':[],'7 Hari':[],'30 Hari':[]}},
  driproot:{name:'DRIP CLIENT ROOT',status:'ready',prices:{'1 Jam':10000,'7 Jam':20000,'30 Hari':40000},stock:{'1 Jam':[],'7 Jam':[],'30 Hari':[]}},
  dripwireandroid:{name:'DRIP WIRE ANDROID',status:'ready',prices:{'6 Jam':9000,'12 Jam':14000,'1 Hari':20000,'7 Hari':55000},stock:{'6 Jam':[],'12 Jam':[],'1 Hari':[],'7 Hari':[]}},
  dripwireios:{name:'DRIP WIRE IOS',status:'ready',prices:{'6 Jam':9000,'12 Jam':14000,'1 Hari':20000,'7 Hari':55000},stock:{'6 Jam':[],'12 Jam':[],'1 Hari':[],'7 Hari':[]}},
  bala:{name:'BALA MOD NON ROOT',status:'ready',prices:{'1 Jam':4000,'3 Jam':8000,'6 Jam':13000,'12 Jam':26000,'1 Hari':52000,'2 Hari':105000,'3 Hari':155000,'7 Hari':329000},stock:{'1 Jam':[],'3 Jam':[],'6 Jam':[],'12 Jam':[],'1 Hari':[],'2 Hari':[],'3 Hari':[],'7 Hari':[]}}
};
function readJson(file, fallback){ try{return JSON.parse(fs.readFileSync(file,'utf8'))}catch{return fallback} }
function writeJson(file, obj){ fs.writeFileSync(file, JSON.stringify(obj,null,2)); }
const settingsFile=path.join(DATA,'settings.json'), ordersFile=path.join(DATA,'orders.json');
let settings=readJson(settingsFile,{botStatus:'aktif',products:productsDefault});
if(!settings.products) settings.products=productsDefault;
for(const [k,p] of Object.entries(productsDefault)) if(!settings.products[k]) settings.products[k]=p;
let orders=readJson(ordersFile,[]);
if(!Array.isArray(orders)) orders=Object.values(orders);
function save(){writeJson(settingsFile,settings);writeJson(ordersFile,orders)}
function money(n){return 'Rp'+Number(n||0).toLocaleString('id-ID')}
function id(){return 'NX-'+Math.random().toString(36).slice(2,8).toUpperCase()}
function sessionHash(s){return crypto.createHash('sha256').update(s).digest('hex')}
const sessions=new Set();
function auth(req,res,next){const s=req.headers.authorization||''; if(s.startsWith('Bearer ')&&sessions.has(s.slice(7))){req.admin=true;return next()} return res.status(401).json({error:'Unauthorized'})}

const storage=multer.diskStorage({destination:UPLOADS,filename:(req,file,cb)=>cb(null,Date.now()+'-'+crypto.randomBytes(6).toString('hex')+path.extname(file.originalname).toLowerCase())});
const upload=multer({storage,limits:{fileSize:8*1024*1024},fileFilter:(req,file,cb)=>cb(null,/^image\/(jpeg|png|webp)$/.test(file.mimetype))});
app.get('/healthz',(req,res)=>res.json({ok:true,service:'NIKXITER SHOP'}));
app.use(express.json()); app.use(express.urlencoded({extended:true})); app.use('/uploads',express.static(UPLOADS)); app.use(express.static(path.join(ROOT,'public')));

app.post('/api/login',(req,res)=>{const {username,password}=req.body;if(username!==ADMIN_USERNAME||password!==ADMIN_PASSWORD)return res.status(401).json({error:'Username atau password salah'});const token=sessionHash(username+'|'+Date.now()+'|'+crypto.randomBytes(16).toString('hex'));sessions.add(token);res.json({token})});
app.post('/api/logout',auth,(req,res)=>{sessions.delete((req.headers.authorization||'').slice(7));res.json({ok:true})});
app.get('/api/shop',(req,res)=>res.json({botStatus:settings.botStatus,products:settings.products,logo:'/logo.jpg',qris:'/qris.jpg'}));
app.get('/api/orders/:orderId',(req,res)=>{const o=orders.find(x=>x.paymentId===req.params.orderId);if(!o)return res.status(404).json({error:'Order tidak ditemukan'});res.json({...o,proofUrl:o.proof?'/uploads/'+o.proof:null,keys:undefined})});
app.post('/api/orders',upload.single('proof'),(req,res)=>{
  const {product,duration,quantity,name,whatsapp}=req.body; const p=settings.products[product]; const q=Math.max(1,Math.min(10,Number(quantity||1))); if(!p)return res.status(400).json({error:'Produk tidak ditemukan'}); if(settings.botStatus!=='aktif')return res.status(400).json({error:'Toko sedang maintenance'}); if(p.status!=='ready')return res.status(400).json({error:'Produk sedang '+p.status}); if(!p.prices[duration])return res.status(400).json({error:'Durasi tidak ditemukan'}); if((p.stock[duration]||[]).length<q)return res.status(400).json({error:'Stok tidak cukup'});
  const paymentId=id(); const total=p.prices[duration]*q; const order={paymentId,createdAt:new Date().toISOString(),name:name||'-',whatsapp:whatsapp||'-',productCode:product,duration,product:p.name,quantity:q,price:p.prices[duration],total,receiver:'NIKXITER',status:'menunggu pembayaran',proof:req.file?req.file.filename:null,keys:[]}; orders.unshift(order);save();res.json({orderId:paymentId,total,order});
});
app.post('/api/orders/:id/proof',upload.single('proof'),(req,res)=>{const o=orders.find(x=>x.paymentId===req.params.id);if(!o)return res.status(404).json({error:'Order tidak ditemukan'});if(!req.file)return res.status(400).json({error:'Bukti pembayaran wajib berupa gambar'});o.proof=req.file.filename;o.status='bukti diterima - menunggu verifikasi';o.updatedAt=new Date().toISOString();save();res.json({ok:true,status:o.status})});

app.get('/api/admin/dashboard',auth,(req,res)=>{const pending=orders.filter(o=>o.status==='bukti diterima - menunggu verifikasi');res.json({botStatus:settings.botStatus,orders,products:settings.products,pendingCount:pending.length})});
app.get('/api/admin/orders/:id/proof',auth,(req,res)=>{const o=orders.find(x=>x.paymentId===req.params.id);if(!o||!o.proof)return res.status(404).send('Bukti tidak ditemukan');res.sendFile(path.join(UPLOADS,o.proof))});
app.post('/api/admin/orders/:id/approve',auth,(req,res)=>{const o=orders.find(x=>x.paymentId===req.params.id);if(!o)return res.status(404).json({error:'Order tidak ditemukan'});if(o.status==='key telah dikirim')return res.status(400).json({error:'Order sudah disetujui'});const p=settings.products[o.productCode];const stock=p?.stock?.[o.duration]||[];if(stock.length<o.quantity)return res.status(400).json({error:'Stok key tidak cukup untuk order ini'});o.keys=stock.splice(0,o.quantity);o.status='key telah dikirim';o.approvedAt=new Date().toISOString();save();res.json({ok:true,keys:o.keys,status:o.status})});
app.post('/api/admin/orders/:id/reject',auth,(req,res)=>{const o=orders.find(x=>x.paymentId===req.params.id);if(!o)return res.status(404).json({error:'Order tidak ditemukan'});o.status='pembayaran ditolak';o.rejectedAt=new Date().toISOString();save();res.json({ok:true})});
app.post('/api/admin/toggle-bot',auth,(req,res)=>{settings.botStatus=settings.botStatus==='aktif'?'maintenance':'aktif';save();res.json({botStatus:settings.botStatus})});
app.post('/api/admin/products/:code/status',auth,(req,res)=>{const p=settings.products[req.params.code];if(!p)return res.status(404).json({error:'Produk tidak ditemukan'});if(!['ready','maintenance','patch'].includes(req.body.status))return res.status(400).json({error:'Status invalid'});p.status=req.body.status;save();res.json({ok:true})});
app.post('/api/admin/products/:code/price',auth,(req,res)=>{const p=settings.products[req.params.code];if(!p)return res.status(404).json({error:'Produk tidak ditemukan'});const {duration,price}=req.body;if(!p.prices[duration])return res.status(400).json({error:'Durasi tidak ditemukan'});p.prices[duration]=Math.max(0,Number(price));save();res.json({ok:true})});
app.post('/api/admin/products/:code/restock',auth,(req,res)=>{const p=settings.products[req.params.code];if(!p)return res.status(404).json({error:'Produk tidak ditemukan'});const {duration,keys}=req.body;if(!p.stock[duration])return res.status(400).json({error:'Durasi tidak ditemukan'});const arr=Array.isArray(keys)?keys:String(keys||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean).map(x=>{const m=x.match(/^key\s*:\s*(.+)$/i);return m?m[1].trim():x});const existing=new Set(p.stock[duration]);let added=0;for(const k of arr)if(!existing.has(k)){p.stock[duration].push(k);existing.add(k);added++}save();res.json({ok:true,added,stock:p.stock[duration].length})});
app.post('/api/admin/products',auth,(req,res)=>{const {code,name,prices}=req.body;if(!code||!name||settings.products[code])return res.status(400).json({error:'Kode kosong/duplikat'});const pr=typeof prices==='object'?prices:{};const stock={};Object.keys(pr).forEach(d=>stock[d]=[]);settings.products[code]={name,status:'ready',prices:pr,stock};save();res.json({ok:true})});
app.post('/api/admin/products/:code/rename',auth,(req,res)=>{const p=settings.products[req.params.code];if(!p)return res.status(404).json({error:'Produk tidak ditemukan'});p.name=String(req.body.name||p.name);save();res.json({ok:true})});
app.delete('/api/admin/products/:code',auth,(req,res)=>{if(!settings.products[req.params.code])return res.status(404).json({error:'Produk tidak ditemukan'});delete settings.products[req.params.code];save();res.json({ok:true})});

app.get('*',(req,res)=>res.sendFile(path.join(ROOT,'public','index.html')));
app.listen(PORT,()=>console.log('NIKXITER SHOP running on http://localhost:'+PORT));
