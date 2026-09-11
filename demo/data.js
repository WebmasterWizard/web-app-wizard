// Wizard Hub Demo: constants, helpers, and mock data. Everything here is invented example data.
const $ = s => document.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clone = o => JSON.parse(JSON.stringify(o));
const pad = n => String(n).padStart(2, '0');
const ymd = x => `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
const TODAY = ymd(new Date());
const day = n => { const x = new Date(); x.setDate(x.getDate() + n); return ymd(x); };
const at = (n, hm = '10:00') => `${day(n)}T${hm}`;
const nowISO = () => { const x = new Date(); return `${ymd(x)}T${pad(x.getHours())}:${pad(x.getMinutes())}`; };
const fmtDate = s => s ? new Date(s.length === 10 ? s + 'T00:00' : s).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
const fmtDT = s => s ? new Date(s).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
const money = n => (n === '' || n == null || isNaN(n)) ? '' : '฿' + Number(n).toLocaleString('th-TH');
const short = (s, n) => (s = String(s ?? '')).length > n ? s.slice(0, n - 1) + '…' : s;
let seq = Date.now();
const uid = p => p + (seq++).toString(36);

const ROLES = { admin: 'Admin', manager: 'Manager', marketing: 'Marketing', callcenter: 'Call Center' };
const LV = { full: 'จัดการ', propose: 'เสนอแก้', work: 'บันทึกงาน', view: 'ดู' };
// Permission per menu per role. Missing = menu hidden. Only Admin deletes.
const P = {
  dashboard: { admin: 'view', manager: 'view', marketing: 'view', callcenter: 'view' },
  services: { admin: 'full', manager: 'full', marketing: 'propose', callcenter: 'view' },
  branches: { admin: 'full', manager: 'full', marketing: 'view', callcenter: 'view' },
  promotions: { admin: 'full', manager: 'full', marketing: 'propose', callcenter: 'view' },
  knowledge: { admin: 'full', manager: 'full', marketing: 'propose', callcenter: 'propose' },
  rules: { admin: 'full', manager: 'full', marketing: 'view', callcenter: 'view' },
  calls: { admin: 'full', manager: 'view', callcenter: 'work' },
  tickets: { admin: 'full', manager: 'full', callcenter: 'work' },
  scripts: { admin: 'full', manager: 'full', marketing: 'propose', callcenter: 'view' },
  users: { admin: 'full' },
  audit: { admin: 'view', manager: 'view' },
  versions: { admin: 'full', manager: 'full', marketing: 'view' },
  import: { admin: 'full', manager: 'full', marketing: 'propose' },
  settings: { admin: 'full' },
};
const APPR = { approved: 'เผยแพร่แล้ว', pending: 'รออนุมัติ', rejected: 'ส่งกลับแก้ไข' };

const CATS = ['ล้างรถ', 'ขัดสี', 'เคลือบแก้ว', 'ฟิล์ม', 'ดูแลภายใน', 'อื่นๆ'];
const BTYPES = ['สาขาหลัก (Full Service)', 'สาขาในห้าง', 'Express Wash'];
const BSTAT = ['เปิดให้บริการ', 'ปิดปรับปรุง', 'ปิดถาวร'];
const PTYPES = ['รายเดือน', 'เฉพาะวัน', 'เฉพาะบริการ', 'เฉพาะสาขา', 'Credit Card', 'Partner'];
const KTYPES = ['FAQ', 'เอกสาร', 'รูปภาพ'];
const KCATS = ['ราคา', 'การจอง', 'บริการ', 'การรับประกัน', 'สาขา', 'ทั่วไป'];
const RCATS = ['ราคา', 'โปรโมชั่น', 'การจอง', 'การขาย', 'ทั่วไป'];
const APPLY = ['AI + ทีมงาน', 'AI เท่านั้น', 'ทีมงานเท่านั้น'];
const ONOFF = ['Active', 'Inactive'];
const TOPICS = ['สอบถามราคา', 'จองคิว', 'สอบถามโปรโมชั่น', 'สอบถามสาขา', 'ร้องเรียน', 'แจ้งโปรโมชั่น', 'ติดตามหลังบริการ', 'อื่นๆ'];
const RESULTS = ['ตอบแล้ว', 'นัดหมายแล้ว', 'ต้องติดตาม', 'ไม่รับสาย'];
const TPRI = ['สูง', 'กลาง', 'ต่ำ'];
const TSTAT = ['เปิด', 'กำลังดำเนินการ', 'รอลูกค้า', 'ปิดแล้ว'];
const PURP = ['แจ้งโปรโมชั่น', 'ติดตามหลังบริการ', 'เตือนนัดหมาย', 'ต่ออายุการรับประกัน'];
const USTAT = ['ใช้งาน', 'ปิดใช้งาน'];
const ICAT = ['แชท', 'เสียง', 'ERP', 'โทรศัพท์', 'Cloud', 'อื่นๆ'];
const ISTAT = ['ยังไม่เชื่อมต่อ', 'วางแผนไว้', 'กำลังทดสอบ'];

const TONE = {
  'เผยแพร่แล้ว': 'ok', 'รออนุมัติ': 'warn', 'ส่งกลับแก้ไข': 'crit',
  'Active': 'ok', 'Scheduled': 'acc', 'Expired': 'mute', 'Inactive': 'mute',
  'เปิดให้บริการ': 'ok', 'ปิดปรับปรุง': 'warn', 'ปิดถาวร': 'mute', 'ใช้งาน': 'ok', 'ปิดใช้งาน': 'mute',
  'เปิด': 'acc', 'กำลังดำเนินการ': 'warn', 'รอลูกค้า': 'plain', 'ปิดแล้ว': 'ok', 'เกินกำหนด': 'crit',
  'สูง': 'crit', 'กลาง': 'warn', 'ต่ำ': 'plain',
  'ตอบแล้ว': 'ok', 'นัดหมายแล้ว': 'ok', 'ต้องติดตาม': 'warn', 'ไม่รับสาย': 'mute',
  'ยังไม่เชื่อมต่อ': 'mute', 'วางแผนไว้': 'acc', 'กำลังทดสอบ': 'warn',
  'เพิ่ม': 'ok', 'สร้าง': 'ok', 'แก้ไข': 'acc', 'ลบ': 'crit', 'อนุมัติ': 'ok', 'ส่งกลับ': 'crit', 'กู้คืน': 'acc', 'นำเข้า': 'acc', 'ย้อนกลับ': 'warn',
  'นำเข้าแล้ว': 'ok', 'ย้อนกลับแล้ว': 'mute', 'ข้อมูลตั้งต้น': 'plain',
  'FAQ': 'acc', 'เอกสาร': 'plain', 'รูปภาพ': 'plain',
  'Admin': 'ink', 'Manager': 'acc', 'Marketing': 'plain', 'Call Center': 'plain',
};

const SAMPLE_FILE = 'ราคา_ก.ย.2569.csv';
const SAMPLE_CSV = `ชื่อบริการ,หมวด,S,M,L,XL
ล้างสี + ดูดฝุ่น,ล้างรถ,250,300,350,450
ล้างใต้ท้องรถ,ล้างรถ,300,350,400,500
เคลือบแก้ว 9H,เคลือบแก้ว,4500,4900,5900,6900
ล้างใต้ท้องรถ,ล้างรถ,300,350,400,500
ขัดไฟหน้า,ขัดสี,,,,
ฟอกเบาะหนัง,ดูแลภายใน,1200,15OO,1800,2200
เคลือบกระจกกันน้ำ,กระจก,600,700,800,900
ขัดเคลือบล้อแม็ก,ขัดสี,800,900,1000,1200
ติดฟิล์มกรองแสง,ฟิล์ม,3500,4500,5500,6500`;

function seedData() {
  const base = { updatedAt: at(-14, '09:00'), updatedBy: 'ข้อมูลตั้งต้น' };
  const all = ['b1', 'b2', 'b3', 'b4', 'b5'];
  const S = { v: 1, role: 'admin', audit: [], versions: [] };

  S.users = [
    { id: 'u1', name: 'สมชาย ใจดี', email: 'somchai@wizard.example', role: 'Admin', branch: 'b1', status: 'ใช้งาน', lastLogin: at(0, '08:30') },
    { id: 'u2', name: 'วิภาดา ศรีสุข', email: 'wipada@wizard.example', role: 'Manager', branch: 'b1', status: 'ใช้งาน', lastLogin: at(0, '08:52') },
    { id: 'u3', name: 'ณัฐพล มั่นคง', email: 'nattapon@wizard.example', role: 'Marketing', branch: '', status: 'ใช้งาน', lastLogin: at(0, '09:40') },
    { id: 'u4', name: 'กมลวรรณ แก้วใส', email: 'kamonwan@wizard.example', role: 'Call Center', branch: 'b2', status: 'ใช้งาน', lastLogin: at(0, '08:58') },
    { id: 'u5', name: 'ธีรวัฒน์ บุญมา', email: 'teerawat@wizard.example', role: 'Call Center', branch: 'b1', status: 'ใช้งาน', lastLogin: at(0, '09:01') },
    { id: 'u6', name: 'ปริญญา ทองดี', email: 'parinya@wizard.example', role: 'Marketing', branch: '', status: 'ปิดใช้งาน', lastLogin: at(-40, '17:10') },
  ];
  S.branches = [
    { id: 'b1', code: 'WZ-RAM', name: 'Wizard รามอินทรา', type: BTYPES[0], status: 'เปิดให้บริการ', phone: '02-000-1001', hours: 'ทุกวัน 08:00–19:00', province: 'กรุงเทพฯ', mapUrl: 'https://maps.google.com/?q=13.8686,100.6200', address: 'ถ.รามอินทรา แขวงอนุสาวรีย์ เขตบางเขน (ตัวอย่าง)' },
    { id: 'b2', code: 'WZ-BNA', name: 'Wizard บางนา', type: BTYPES[0], status: 'เปิดให้บริการ', phone: '02-000-1002', hours: 'ทุกวัน 08:00–20:00', province: 'กรุงเทพฯ', mapUrl: 'https://maps.google.com/?q=13.6680,100.6340', address: 'ถ.บางนา-ตราด แขวงบางนา เขตบางนา (ตัวอย่าง)' },
    { id: 'b3', code: 'WZ-RPK', name: 'Wizard ราชพฤกษ์', type: BTYPES[0], status: 'เปิดให้บริการ', phone: '02-000-1003', hours: 'จ.–ส. 08:30–18:30', province: 'นนทบุรี', mapUrl: 'https://maps.google.com/?q=13.8480,100.4480', address: 'ถ.ราชพฤกษ์ อ.เมืองนนทบุรี (ตัวอย่าง)' },
    { id: 'b4', code: 'WZ-MLX', name: 'Wizard Express ในห้าง', type: BTYPES[1], status: 'เปิดให้บริการ', phone: '02-000-1004', hours: 'ตามเวลาห้าง 10:00–21:00', province: 'กรุงเทพฯ', mapUrl: 'https://maps.google.com/?q=13.7460,100.5340', address: 'ชั้น B2 ศูนย์การค้า (ตัวอย่าง)' },
    { id: 'b5', code: 'WZ-CNX', name: 'Wizard เชียงใหม่', type: BTYPES[0], status: 'ปิดปรับปรุง', phone: '053-000-105', hours: 'ทุกวัน 08:30–18:00', province: 'เชียงใหม่', mapUrl: 'https://maps.google.com/?q=18.7960,98.9680', address: 'ถ.นิมมานเหมินท์ อ.เมืองเชียงใหม่ (ตัวอย่าง)' },
  ];
  const svc = (id, name, category, p, duration, branches, summary, extra = {}) =>
    ({ id, name, category, priceS: p[0], priceM: p[1], priceL: p[2], priceXL: p[3], duration, branches, summary, source: '', approval: 'approved', ...base, ...extra });
  S.services = [
    svc('s1', 'ล้างสี + ดูดฝุ่น', 'ล้างรถ', [250, 300, 350, 450], 45, all, 'ล้างภายนอก ดูดฝุ่นภายใน เช็ดกระจก'),
    svc('s2', 'ล้างสี + เคลือบเงา Wax', 'ล้างรถ', [450, 550, 650, 800], 60, ['b1', 'b2', 'b3', 'b4'], 'ล้างสีแล้วเคลือบเงาด้วย Wax'),
    svc('s3', 'ล้างห้องเครื่อง', 'ล้างรถ', [400, 450, 500, 600], 40, ['b1', 'b2', 'b3'], 'ทำความสะอาดห้องเครื่องและเคลือบยาง'),
    svc('s4', 'ขัดสีลบรอย 3 ขั้นตอน', 'ขัดสี', [2500, 3000, 3500, 4500], 240, ['b1', 'b2', 'b3'], 'ลบรอยขนแมวและรอยขีดข่วนเล็ก ต้องประเมินหน้างาน'),
    svc('s5', 'เคลือบแก้ว 9H', 'เคลือบแก้ว', [4500, 5200, 5900, 6900], 360, ['b1', 'b2'], 'เคลือบแก้วความแข็ง 9H รับประกัน 1 ปี', { updatedAt: at(-2, '15:10'), updatedBy: 'วิภาดา ศรีสุข' }),
    svc('s6', 'ฟอกเบาะหนัง', 'ดูแลภายใน', [1200, 1500, 1800, 2200], 120, ['b1', 'b2', 'b4'], 'ทำความสะอาดและบำรุงเบาะหนัง'),
    svc('s7', 'ติดฟิล์มกรองแสง', 'ฟิล์ม', [3500, 4500, 5500, 6500], 180, ['b1', 'b3'], 'ฟิล์มเซรามิกรุ่นมาตรฐาน'),
    svc('s8', 'ขจัดคราบน้ำบนกระจก', 'อื่นๆ', [500, 600, 700, 800], 45, ['b1'], 'ขจัดคราบหินปูนบนกระจกรอบคัน', { approval: 'pending', updatedAt: at(-1, '16:20'), updatedBy: 'ณัฐพล มั่นคง' }),
  ];
  const promo = (id, title, type, discount, start, end, days, services, branches, partner, conditions, extra = {}) =>
    ({ id, title, type, discount, start, end, days, services, branches, partner, conditions, enabled: 'เปิด', approval: 'approved', ...base, ...extra });
  S.promotions = [
    promo('p1', 'ล้างรถลด 20% ทุกวันจันทร์', 'เฉพาะวัน', 'ลด 20%', day(-40), day(50), 'จันทร์', ['s1', 's2'], [], '', 'ไม่ร่วมกับโปรอื่น'),
    promo('p2', 'เคลือบแก้ว ผ่อน 0% 6 เดือน', 'Credit Card', 'ผ่อน 0% 6 เดือน', day(-10), day(19), 'ทุกวัน', ['s5'], [], 'บัตรเครดิตธนาคาร A (ตัวอย่าง)', 'ยอดขั้นต่ำ 5,000 บาท'),
    promo('p3', 'โปรเดือนหน้า: ขัดสีแถมเคลือบเงา', 'รายเดือน', 'แถมเคลือบเงา Wax', day(20), day(50), 'ทุกวัน', ['s4'], [], '', 'จองล่วงหน้าผ่าน LINE'),
    promo('p4', 'เปิดสาขาในห้าง ล้างรถ 199', 'เฉพาะสาขา', 'ราคาพิเศษ ฿199 (ขนาด S)', day(-60), day(-5), 'ทุกวัน', ['s1'], ['b4'], '', 'เฉพาะรถขนาด S'),
    promo('p5', 'ลูกค้าประกันภัย X ลด 10%', 'Partner', 'ลด 10%', day(-3), day(4), 'ทุกวัน', ['s4', 's5', 's7'], [], 'บริษัทประกันภัย X (ตัวอย่าง)', 'แสดงกรมธรรม์ที่ยังไม่หมดอายุ'),
    promo('p6', 'ฟิล์มกรองแสงลด 1,000', 'เฉพาะบริการ', 'ลด ฿1,000', day(1), day(30), 'จันทร์–ศุกร์', ['s7'], ['b1', 'b3'], '', 'เฉพาะฟิล์มรุ่นมาตรฐาน', { approval: 'pending', updatedAt: at(0, '09:45'), updatedBy: 'ณัฐพล มั่นคง' }),
  ];
  const kn = (id, type, title, content, category, service, fileName, extra = {}) =>
    ({ id, type, title, content, category, service, fileName, approval: 'approved', ...base, ...extra });
  S.knowledge = [
    kn('k1', 'FAQ', 'เคลือบแก้วอยู่ได้นานแค่ไหน?', 'โดยทั่วไป 1–3 ปี ขึ้นกับการดูแลและการจอดรถ', 'บริการ', 's5', ''),
    kn('k2', 'FAQ', 'ล้างรถต้องจองล่วงหน้าไหม?', 'วันธรรมดาไม่ต้องจอง วันเสาร์-อาทิตย์แนะนำให้จองผ่าน LINE', 'การจอง', 's1', ''),
    kn('k3', 'FAQ', 'ขนาดรถ S M L XL ต่างกันอย่างไร?', 'S = เก๋งเล็ก/Eco car, M = เก๋งกลาง, L = SUV/กระบะ, XL = รถตู้/7 ที่นั่ง', 'ราคา', '', ''),
    kn('k4', 'FAQ', 'หลังเคลือบแก้วล้างรถได้เมื่อไหร่?', 'แนะนำให้ล้างหลัง 7 วัน', 'บริการ', 's5', ''),
    kn('k5', 'FAQ', 'จ่ายด้วยบัตรเครดิตได้ไหม?', 'ได้ทุกสาขา ยกเว้นสาขา Express บางจุด', 'ทั่วไป', '', '', { approval: 'pending', updatedAt: at(0, '11:05'), updatedBy: 'กมลวรรณ แก้วใส' }),
    kn('k6', 'เอกสาร', 'คู่มือการรับประกันเคลือบแก้ว', 'เงื่อนไขการรับประกันและการเข้ารับตรวจเช็กทุก 6 เดือน', 'การรับประกัน', 's5', 'warranty-ceramic.pdf'),
    kn('k7', 'รูปภาพ', 'ป้ายราคาหน้าร้าน', 'ใช้อ้างอิงเท่านั้น ราคาจริงให้ดูที่ Services & Prices', 'ราคา', '', 'price-board.jpg'),
    kn('k8', 'เอกสาร', 'ขั้นตอนรับรถและส่งรถ', 'SOP สำหรับพนักงานหน้าร้าน', 'ทั่วไป', '', 'sop-handover.docx'),
  ];
  const rule = (id, priority, rule, category, appliesTo, status) => ({ id, priority, rule, category, appliesTo, status, approval: 'approved', ...base });
  S.rules = [
    rule('r1', 1, 'ห้ามยืนยันราคางานขัดสีทางโทรศัพท์ ให้นัดประเมินที่สาขา', 'ราคา', APPLY[0], 'Active'),
    rule('r2', 2, 'ทุกครั้งที่แจ้งโปร Credit Card ต้องบอกเงื่อนไขธนาคารและวันสิ้นสุด', 'โปรโมชั่น', APPLY[0], 'Active'),
    rule('r3', 3, 'ถ้าลูกค้าไม่ทราบขนาดรถ ให้ถามยี่ห้อและรุ่นก่อนแจ้งราคา', 'ราคา', APPLY[0], 'Active'),
    rule('r4', 4, 'ลูกค้าร้องเรียนต้องเปิด Ticket และแจ้ง Manager ภายในวันเดียวกัน', 'ทั่วไป', APPLY[2], 'Active'),
    rule('r5', 5, 'AI ต้องโอนสายให้พนักงานทันทีเมื่อลูกค้าขอคุยกับคน', 'ทั่วไป', APPLY[1], 'Active'),
    rule('r6', 9, 'แนะนำเคลือบแก้วให้ลูกค้าที่ถามเรื่องล้างรถ', 'การขาย', APPLY[0], 'Inactive'),
  ];
  const call = (id, when, customer, phone, direction, topic, service, branch, result, agent, note) =>
    ({ id, at: when, customer, phone, direction, topic, service, branch, result, agent, note, updatedAt: when, updatedBy: agent === 'u4' ? 'กมลวรรณ แก้วใส' : 'ธีรวัฒน์ บุญมา' });
  S.calls = [
    call('c1', at(0, '09:12'), 'คุณสมศักดิ์ (ตัวอย่าง)', '081-555-0101', 'รับสาย', 'สอบถามราคา', 's5', 'b1', 'ตอบแล้ว', 'u4', 'ถามราคาเคลือบแก้ว SUV แจ้งราคา L'),
    call('c2', at(0, '10:05'), 'คุณมาลี (ตัวอย่าง)', '089-555-0102', 'รับสาย', 'จองคิว', 's1', 'b2', 'นัดหมายแล้ว', 'u5', 'นัดวันเสาร์ 10:00'),
    call('c3', at(0, '11:40'), 'คุณอนันต์ (ตัวอย่าง)', '086-555-0103', 'รับสาย', 'ร้องเรียน', 's4', 'b3', 'ต้องติดตาม', 'u4', 'รอยขนแมวยังเห็นหลังขัดสี'),
    call('c4', at(-1, '14:20'), 'คุณปวีณา (ตัวอย่าง)', '092-555-0104', 'โทรออก', 'แจ้งโปรโมชั่น', 's5', '', 'ไม่รับสาย', 'u5', ''),
    call('c5', at(-1, '16:00'), 'คุณวิชัย (ตัวอย่าง)', '081-555-0105', 'รับสาย', 'สอบถามสาขา', '', 'b4', 'ตอบแล้ว', 'u4', 'ถามเวลาเปิดสาขาในห้าง'),
    call('c6', at(-2, '13:30'), 'คุณจิราพร (ตัวอย่าง)', '095-555-0106', 'โทรออก', 'ติดตามหลังบริการ', 's6', 'b1', 'ตอบแล้ว', 'u5', 'พอใจบริการ'),
  ];
  const tk = (id, title, customer, phone, call, priority, status, assignee, due, note) =>
    ({ id, title, customer, phone, call, priority, status, assignee, due, note, ...base, updatedAt: at(0, '11:50'), updatedBy: 'กมลวรรณ แก้วใส' });
  S.tickets = [
    tk('t1', 'ติดตามงานขัดสี รอยยังไม่หาย', 'คุณอนันต์ (ตัวอย่าง)', '086-555-0103', 'c3', 'สูง', 'กำลังดำเนินการ', 'u2', day(1), 'นัดลูกค้าเข้าตรวจที่สาขา'),
    tk('t2', 'โทรกลับเสนอโปรเคลือบแก้ว', 'คุณปวีณา (ตัวอย่าง)', '092-555-0104', 'c4', 'กลาง', 'เปิด', 'u5', day(-1), ''),
    tk('t3', 'ส่งใบเสนอราคาฟิล์มให้บริษัท', 'คุณวิชัย (ตัวอย่าง)', '081-555-0105', 'c5', 'กลาง', 'รอลูกค้า', 'u4', day(3), 'ลูกค้าขอราคารถ 5 คัน'),
    tk('t4', 'ยืนยันนัดล้างรถวันเสาร์', 'คุณมาลี (ตัวอย่าง)', '089-555-0102', 'c2', 'ต่ำ', 'ปิดแล้ว', 'u5', day(-2), ''),
  ];
  const sc = (id, title, purpose, promotion, body, extra = {}) => ({ id, title, purpose, promotion, body, status: 'Active', approval: 'approved', ...base, ...extra });
  S.scripts = [
    sc('sc1', 'แจ้งโปรเคลือบแก้วผ่อน 0%', 'แจ้งโปรโมชั่น', 'p2', 'สวัสดีค่ะ คุณ{ชื่อลูกค้า} ติดต่อจาก Wizard Auto Care นะคะ ตอนนี้มีโปรเคลือบแก้วผ่อน 0% 6 เดือนกับบัตรที่ร่วมรายการ ถึงวันสิ้นเดือนนี้ค่ะ'),
    sc('sc2', 'ติดตามหลังบริการ 3 วัน', 'ติดตามหลังบริการ', '', 'สวัสดีค่ะ คุณ{ชื่อลูกค้า} ขอสอบถามความพึงพอใจหลังรับบริการเมื่อ 3 วันก่อนค่ะ มีจุดไหนที่อยากให้เราดูเพิ่มไหมคะ'),
    sc('sc3', 'เตือนตรวจเช็กเคลือบแก้วครบ 6 เดือน', 'ต่ออายุการรับประกัน', '', 'สวัสดีค่ะ คุณ{ชื่อลูกค้า} รถของคุณเคลือบแก้วครบ 6 เดือนแล้ว เข้ารับการตรวจเช็กฟรีได้ที่ทุกสาขาค่ะ'),
    sc('sc4', 'ชวนลูกค้าเก่ากลับมาล้างรถ', 'แจ้งโปรโมชั่น', 'p1', 'สวัสดีค่ะ คุณ{ชื่อลูกค้า} ทุกวันจันทร์ล้างรถลด 20% ค่ะ',
      { approval: 'rejected', rejectReason: 'ยังไม่ระบุเงื่อนไข “ไม่ร่วมกับโปรอื่น” ในบทพูด', updatedAt: at(-1, '10:00'), updatedBy: 'ณัฐพล มั่นคง' }),
  ];
  S.integrations = [
    { id: 'i1', name: 'LINE OA', category: 'แชท', status: 'ยังไม่เชื่อมต่อ', phase: 'หลังระบบหลักเสร็จ', purpose: 'ตอบลูกค้าด้วยบริการ ราคา โปรโมชั่น สาขา และ FAQ ชุดเดียวกับระบบนี้', ...base },
    { id: 'i2', name: 'AI Voice', category: 'เสียง', status: 'ยังไม่เชื่อมต่อ', phase: 'หลังระบบหลักเสร็จ', purpose: 'รับสายด้วย AI โดยใช้ข้อมูลเดียวกับ Call Center และ Business Rules', ...base },
    { id: 'i3', name: 'Odoo', category: 'ERP', status: 'ยังไม่เชื่อมต่อ', phase: 'ภายหลัง', purpose: 'เชื่อมข้อมูลขายและลูกค้า', ...base },
    { id: 'i4', name: 'SIP / ระบบโทรศัพท์', category: 'โทรศัพท์', status: 'ยังไม่เชื่อมต่อ', phase: 'ภายหลัง', purpose: 'บันทึก Call History อัตโนมัติจากสายเข้าและสายออก', ...base },
    { id: 'i5', name: 'AWS (ฐานข้อมูลและไฟล์)', category: 'Cloud', status: 'วางแผนไว้', phase: 'ตอนขึ้น Production', purpose: 'ย้ายฐานข้อมูลและไฟล์จากเครื่อง Local ขึ้น Cloud', ...base },
  ];
  S.imports = [
    { id: 'i0', file: 'ข้อมูลตั้งต้น.xlsx', target: 'ทุกเมนู', at: at(-14, '09:00'), user: 'สมชาย ใจดี', counts: { new: 43, updated: 0, review: 0, skipped: 0 }, changes: [], status: 'ข้อมูลตั้งต้น' },
  ];
  S.audit = [
    { at: at(0, '11:40'), user: 'กมลวรรณ แก้วใส', role: 'Call Center', action: 'เพิ่ม', module: 'calls', title: 'คุณอนันต์ (ตัวอย่าง)', detail: 'ร้องเรียน · ต้องติดตาม' },
    { at: at(0, '11:50'), user: 'กมลวรรณ แก้วใส', role: 'Call Center', action: 'เพิ่ม', module: 'tickets', title: 'ติดตามงานขัดสี รอยยังไม่หาย', detail: 'เปิดจากการโทร' },
    { at: at(0, '11:05'), user: 'กมลวรรณ แก้วใส', role: 'Call Center', action: 'เพิ่ม', module: 'knowledge', title: 'จ่ายด้วยบัตรเครดิตได้ไหม?', detail: 'ส่งขออนุมัติ' },
    { at: at(0, '09:45'), user: 'ณัฐพล มั่นคง', role: 'Marketing', action: 'เพิ่ม', module: 'promotions', title: 'ฟิล์มกรองแสงลด 1,000', detail: 'ส่งขออนุมัติ' },
    { at: at(-1, '17:30'), user: 'วิภาดา ศรีสุข', role: 'Manager', action: 'ส่งกลับ', module: 'scripts', title: 'ชวนลูกค้าเก่ากลับมาล้างรถ', detail: 'เหตุผล: ยังไม่ระบุเงื่อนไข “ไม่ร่วมกับโปรอื่น” ในบทพูด' },
    { at: at(-1, '16:20'), user: 'ณัฐพล มั่นคง', role: 'Marketing', action: 'เพิ่ม', module: 'services', title: 'ขจัดคราบน้ำบนกระจก', detail: 'ส่งขออนุมัติ' },
    { at: at(-2, '15:10'), user: 'วิภาดา ศรีสุข', role: 'Manager', action: 'แก้ไข', module: 'services', title: 'เคลือบแก้ว 9H', detail: 'ราคา M · เก๋งกลาง: ฿4,900 → ฿5,200' },
    { at: at(-14, '09:00'), user: 'สมชาย ใจดี', role: 'Admin', action: 'นำเข้า', module: 'import', title: 'ข้อมูลตั้งต้น.xlsx', detail: 'สร้างข้อมูลตั้งต้นทุกเมนู' },
  ].map(a => ({ id: uid('a'), ...a }));
  return S;
}
