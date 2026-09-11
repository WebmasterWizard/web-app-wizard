// Wizard Hub Demo: menus, generic list/form engine, approval, audit, versions, import.
const KEY = 'wizard-hub-demo-v1';

const promoState = p => p.enabled && p.enabled !== 'เปิด' ? 'Inactive' : p.start && TODAY < p.start ? 'Scheduled' : p.end && TODAY > p.end ? 'Expired' : 'Active';
const overdue = t => t.status !== 'ปิดแล้ว' && t.due && t.due < TODAY;
const chip = (v, title) => v == null || v === '' ? '<span class="muted">—</span>' : `<span class="chip t-${TONE[v] || 'plain'}"${title ? ` title="${esc(title)}"` : ''}>${esc(v)}</span>`;
const apprChip = r => chip(APPR[r.approval], r.approval === 'rejected' ? 'เหตุผล: ' + (r.rejectReason || '') : '');
const apprFilter = { l: 'สถานะอนุมัติ', get: r => APPR[r.approval], o: Object.values(APPR) };
const byUpdated = (a, b) => String(b.updatedAt || b.at || '').localeCompare(String(a.updatedAt || a.at || ''));

const MOD = {
  dashboard: { label: 'Dashboard', desc: 'ภาพรวมงานวันนี้ งานรออนุมัติ และสิ่งที่ต้องติดตาม', page: () => renderDashboard() },

  services: {
    label: 'Services & Prices', desc: 'บริการ ราคาตามขนาดรถ FAQ ของบริการ และสาขาที่ให้บริการ', noun: 'บริการ',
    src: 'services', approval: true, versioned: true, title: r => r.name,
    fields: [
      { k: 'name', l: 'ชื่อบริการ', t: 'text', req: 1 },
      { k: 'category', l: 'หมวด', t: 'select', o: CATS, req: 1 },
      { k: 'priceS', l: 'ราคา S · เก๋งเล็ก', t: 'money', lock: ['marketing'] },
      { k: 'priceM', l: 'ราคา M · เก๋งกลาง', t: 'money', lock: ['marketing'] },
      { k: 'priceL', l: 'ราคา L · SUV / กระบะ', t: 'money', lock: ['marketing'] },
      { k: 'priceXL', l: 'ราคา XL · รถตู้', t: 'money', lock: ['marketing'] },
      { k: 'duration', l: 'เวลาที่ใช้ (นาที)', t: 'number' },
      { k: 'branches', l: 'สาขาที่ให้บริการ', t: 'refs', ref: 'branches', full: 1 },
      { k: 'summary', l: 'รายละเอียดสั้น', t: 'textarea', full: 1 },
      { k: '_faq', l: 'FAQ ของบริการนี้', t: 'calc', full: 1, get: r => state.knowledge.filter(k => k.service === r.id && k.type === 'FAQ').map(k => '• ' + k.title).join('\n'), help: 'เพิ่มหรือแก้ FAQ ได้ที่เมนู FAQ / Knowledge' },
      { k: 'source', l: 'ที่มาของข้อมูล', t: 'info', full: 1 },
    ],
    cols: [{ k: 'name' }, { k: 'category' }, { k: 'priceS', l: 'S', n: 1 }, { k: 'priceM', l: 'M', n: 1 }, { k: 'priceL', l: 'L', n: 1 }, { k: 'priceXL', l: 'XL', n: 1 },
      { l: 'สาขา', r: r => `${(r.branches || []).length} สาขา` }, { l: 'FAQ', n: 1, r: r => state.knowledge.filter(k => k.service === r.id).length || '—' }, { l: 'สถานะ', r: apprChip }],
    filters: [{ k: 'category' }, apprFilter],
  },

  branches: {
    label: 'Branches', desc: 'ข้อมูลสาขา เวลาเปิด แผนที่ และบริการที่รองรับ', noun: 'สาขา',
    src: 'branches', versioned: true, title: r => r.name,
    fields: [
      { k: 'code', l: 'รหัสสาขา', t: 'text', req: 1 }, { k: 'name', l: 'ชื่อสาขา', t: 'text', req: 1 },
      { k: 'type', l: 'รูปแบบสาขา', t: 'select', o: BTYPES, req: 1 }, { k: 'status', l: 'สถานะ', t: 'select', o: BSTAT, req: 1 },
      { k: 'phone', l: 'เบอร์โทร', t: 'text' }, { k: 'hours', l: 'เวลาเปิด', t: 'text' },
      { k: 'province', l: 'จังหวัด', t: 'text' }, { k: 'mapUrl', l: 'Google Maps (ลิงก์)', t: 'url' },
      { k: 'address', l: 'ที่อยู่', t: 'textarea', full: 1 },
      { k: '_svc', l: 'บริการที่สาขารองรับ', t: 'calc', full: 1, get: r => state.services.filter(s => (s.branches || []).includes(r.id)).map(s => s.name).join(', '), help: 'กำหนดที่หน้า Services & Prices เพื่อให้ข้อมูลอยู่ที่เดียว' },
    ],
    cols: [{ k: 'code', r: r => `<span class="mono">${esc(r.code)}</span>` }, { k: 'name' }, { k: 'type' }, { k: 'province' }, { k: 'phone', c: 'nw' }, { k: 'hours', c: 'nw' },
      { l: 'บริการ', n: 1, r: r => state.services.filter(s => (s.branches || []).includes(r.id)).length }, { k: 'status', chip: 1 },
      { l: 'แผนที่', r: r => r.mapUrl ? `<a href="${esc(r.mapUrl)}" target="_blank" rel="noopener">เปิดแผนที่</a>` : '—' }],
    filters: [{ k: 'type' }, { k: 'status' }, { k: 'province' }],
  },

  promotions: {
    label: 'Promotions', desc: 'โปรโมชั่นทุกประเภท สถานะ Active / Scheduled / Expired เปลี่ยนเองตามวันที่', noun: 'โปรโมชั่น',
    src: 'promotions', approval: true, versioned: true, title: r => r.title,
    fields: [
      { k: 'title', l: 'ชื่อโปรโมชั่น', t: 'text', req: 1, full: 1 },
      { k: 'type', l: 'ประเภท', t: 'select', o: PTYPES, req: 1 }, { k: 'discount', l: 'ส่วนลด / สิทธิพิเศษ', t: 'text', req: 1 },
      { k: 'start', l: 'วันที่เริ่ม', t: 'date', req: 1 }, { k: 'end', l: 'วันที่สิ้นสุด', t: 'date', req: 1 },
      { k: 'days', l: 'วันที่ใช้ได้', t: 'text', help: 'เช่น ทุกวัน, จันทร์–ศุกร์' }, { k: 'enabled', l: 'เปิดใช้งาน', t: 'select', o: ['เปิด', 'ปิด (Inactive)'], req: 1 },
      { k: 'partner', l: 'ธนาคาร / พาร์ทเนอร์', t: 'text', full: 1, help: 'สำหรับโปร Credit Card และ Partner' },
      { k: 'services', l: 'บริการที่ร่วมรายการ', t: 'refs', ref: 'services', full: 1 },
      { k: 'branches', l: 'สาขาที่ร่วมรายการ', t: 'refs', ref: 'branches', full: 1, help: 'ไม่เลือก = ใช้ได้ทุกสาขา' },
      { k: 'conditions', l: 'เงื่อนไข', t: 'textarea', full: 1 },
    ],
    onNew: () => ({ enabled: 'เปิด', start: TODAY, end: day(30), days: 'ทุกวัน' }),
    validate: v => v.end < v.start ? 'วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่ม' : '',
    cols: [{ k: 'title', c: 'w' }, { k: 'type' }, { k: 'discount' }, { l: 'ช่วงเวลา', c: 'nw', r: r => `${fmtDate(r.start)} – ${fmtDate(r.end)}` },
      { l: 'สาขา', r: r => (r.branches || []).length ? `${r.branches.length} สาขา` : 'ทุกสาขา' }, { l: 'สถานะเวลา', r: r => chip(promoState(r)) }, { l: 'อนุมัติ', r: apprChip }],
    filters: [{ k: 'type' }, { l: 'สถานะเวลา', get: promoState, o: ['Active', 'Scheduled', 'Expired', 'Inactive'] }, apprFilter],
    sort: (a, b) => String(b.start).localeCompare(String(a.start)),
  },

  knowledge: {
    label: 'FAQ / Knowledge', desc: 'FAQ เอกสาร และรูปภาพที่ใช้อ้างอิง (ราคาจริงยึดตาม Services & Prices)', noun: 'รายการ',
    src: 'knowledge', approval: true, versioned: true, title: r => r.title,
    fields: [
      { k: 'type', l: 'ประเภท', t: 'select', o: KTYPES, req: 1 }, { k: 'category', l: 'หมวด', t: 'select', o: KCATS },
      { k: 'title', l: 'คำถาม / ชื่อเอกสาร', t: 'text', req: 1, full: 1 },
      { k: 'content', l: 'คำตอบ / สรุปเนื้อหา', t: 'textarea', full: 1, rows: 4 },
      { k: 'service', l: 'บริการที่เกี่ยวข้อง', t: 'ref', ref: 'services' }, { k: 'fileName', l: 'ชื่อไฟล์', t: 'text', help: 'เดโมเก็บเฉพาะชื่อไฟล์' },
    ],
    onNew: () => ({ type: 'FAQ', category: 'ทั่วไป' }),
    cols: [{ k: 'type', chip: 1 }, { k: 'title', c: 'w' }, { k: 'category' }, { k: 'service' }, { k: 'fileName', r: r => r.fileName ? `<span class="mono">${esc(r.fileName)}</span>` : '—' }, { l: 'อนุมัติ', r: apprChip }],
    filters: [{ k: 'type' }, { k: 'category' }, apprFilter],
    tools: () => canAdd(MOD.knowledge) ? '<label class="btn">อัปโหลดหลายไฟล์<input type="file" id="upl" multiple></label>' : '',
    bind: () => $('#upl')?.addEventListener('change', e => uploadFiles(e.target.files)),
  },

  rules: {
    label: 'Business Rules', desc: 'กฎที่ AI และทีมงานต้องใช้ เรียงตาม Priority (1 = สำคัญที่สุด)', noun: 'กฎ',
    src: 'rules', approval: true, versioned: true, title: r => short(r.rule, 50),
    fields: [
      { k: 'priority', l: 'Priority', t: 'number', req: 1, help: '1 = สำคัญที่สุด ถ้ากฎขัดกันให้ใช้เลขน้อยกว่า' }, { k: 'status', l: 'สถานะ', t: 'select', o: ONOFF, req: 1 },
      { k: 'category', l: 'หมวด', t: 'select', o: RCATS }, { k: 'appliesTo', l: 'ใช้กับ', t: 'select', o: APPLY, req: 1 },
      { k: 'rule', l: 'กฎ', t: 'textarea', req: 1, full: 1 },
    ],
    onNew: () => ({ status: 'Active', appliesTo: APPLY[0], priority: Math.max(0, ...state.rules.map(r => r.priority || 0)) + 1 }),
    cols: [{ k: 'priority', l: 'Priority', n: 1 }, { k: 'rule', c: 'w' }, { k: 'category' }, { k: 'appliesTo', c: 'nw' }, { k: 'status', chip: 1 }, { l: 'อนุมัติ', r: apprChip }],
    filters: [{ k: 'category' }, { k: 'appliesTo' }, { k: 'status' }, apprFilter],
    sort: (a, b) => (a.priority || 0) - (b.priority || 0),
  },

  calls: {
    label: 'Call History', desc: 'บันทึกสายเข้าและสายออก (ยังไม่เชื่อม SIP จึงบันทึกด้วยมือ)', noun: 'บันทึกการโทร',
    src: 'calls', versioned: true, title: r => `${r.customer} · ${fmtDT(r.at)}`,
    fields: [
      { k: 'at', l: 'วันเวลา', t: 'datetime', req: 1 }, { k: 'direction', l: 'ประเภทสาย', t: 'select', o: ['รับสาย', 'โทรออก'], req: 1 },
      { k: 'customer', l: 'ชื่อลูกค้า', t: 'text', req: 1 }, { k: 'phone', l: 'เบอร์โทร', t: 'text' },
      { k: 'topic', l: 'เรื่อง', t: 'select', o: TOPICS, req: 1 }, { k: 'result', l: 'ผลการโทร', t: 'select', o: RESULTS, req: 1 },
      { k: 'service', l: 'บริการที่เกี่ยวข้อง', t: 'ref', ref: 'services' }, { k: 'branch', l: 'สาขา', t: 'ref', ref: 'branches' },
      { k: 'agent', l: 'พนักงาน', t: 'ref', ref: 'users' }, { k: 'note', l: 'บันทึก', t: 'textarea', full: 1 },
    ],
    onNew: () => ({ at: nowISO(), direction: 'รับสาย', agent: me().id }),
    cols: [{ k: 'at', c: 'nw' }, { k: 'direction' }, { k: 'customer' }, { k: 'phone', r: r => `<span class="mono">${esc(r.phone)}</span>` }, { k: 'topic' }, { k: 'service' }, { k: 'result', chip: 1 }, { k: 'agent' }],
    filters: [{ l: 'วัน', get: r => String(r.at).slice(0, 10) === TODAY ? 'วันนี้' : 'ก่อนหน้า', o: ['วันนี้', 'ก่อนหน้า'] }, { k: 'direction' }, { k: 'topic' }, { k: 'result' }],
    sort: (a, b) => String(b.at).localeCompare(String(a.at)),
    rowActions: () => canAdd(MOD.tickets) ? [{ a: 'ticket', l: 'เปิด Ticket' }] : [],
    acts: {
      ticket: r => openForm(MOD.tickets, null, { title: `ติดตาม: ${r.topic} · ${r.customer}`, customer: r.customer, phone: r.phone, call: r.id, priority: r.topic === 'ร้องเรียน' ? 'สูง' : 'กลาง' }),
    },
  },

  tickets: {
    label: 'Follow-up / Tickets', desc: 'งานที่ต้องติดตาม ผู้รับผิดชอบ และกำหนดวัน', noun: 'Ticket',
    src: 'tickets', versioned: true, title: r => r.title,
    fields: [
      { k: 'title', l: 'เรื่อง', t: 'text', req: 1, full: 1 },
      { k: 'customer', l: 'ลูกค้า', t: 'text' }, { k: 'phone', l: 'เบอร์โทร', t: 'text' },
      { k: 'priority', l: 'ความสำคัญ', t: 'select', o: TPRI, req: 1 }, { k: 'status', l: 'สถานะ', t: 'select', o: TSTAT, req: 1 },
      { k: 'assignee', l: 'ผู้รับผิดชอบ', t: 'ref', ref: 'users' }, { k: 'due', l: 'กำหนดเสร็จ', t: 'date' },
      { k: 'call', l: 'มาจากการโทร', t: 'ref', ref: 'calls', full: 1 }, { k: 'note', l: 'บันทึก', t: 'textarea', full: 1 },
    ],
    onNew: () => ({ status: 'เปิด', priority: 'กลาง', due: day(1), assignee: me().id }),
    cols: [{ k: 'title', c: 'w' }, { k: 'customer' }, { k: 'priority', chip: 1 }, { k: 'status', chip: 1 }, { k: 'assignee' },
      { l: 'กำหนด', c: 'nw', r: r => `${fmtDate(r.due) || '—'} ${overdue(r) ? chip('เกินกำหนด') : ''}` }],
    filters: [{ k: 'status' }, { k: 'priority' }, { k: 'assignee' }, { l: 'กำหนด', get: r => overdue(r) ? 'เกินกำหนด' : 'ปกติ', o: ['เกินกำหนด', 'ปกติ'] }],
    sort: (a, b) => (a.status === 'ปิดแล้ว') - (b.status === 'ปิดแล้ว') || String(a.due).localeCompare(String(b.due)),
  },

  scripts: {
    label: 'Outbound Scripts', desc: 'บทพูดสำหรับโทรออก อ้างอิงโปรโมชั่นจากระบบ', noun: 'Script',
    src: 'scripts', approval: true, versioned: true, title: r => r.title,
    fields: [
      { k: 'title', l: 'ชื่อ Script', t: 'text', req: 1, full: 1 },
      { k: 'purpose', l: 'วัตถุประสงค์', t: 'select', o: PURP, req: 1 }, { k: 'status', l: 'สถานะ', t: 'select', o: ONOFF, req: 1 },
      { k: 'promotion', l: 'โปรโมชั่นที่เกี่ยวข้อง', t: 'ref', ref: 'promotions', full: 1 },
      { k: 'body', l: 'บทพูด', t: 'textarea', req: 1, full: 1, rows: 5, help: 'ใช้ {ชื่อลูกค้า} แทนชื่อจริง' },
    ],
    onNew: () => ({ status: 'Active' }),
    cols: [{ k: 'title', c: 'w' }, { k: 'purpose' }, { k: 'promotion' }, { k: 'status', chip: 1 }, { l: 'อนุมัติ', r: apprChip }],
    filters: [{ k: 'purpose' }, { k: 'status' }, apprFilter],
  },

  users: {
    label: 'Users & Roles', desc: 'บัญชีพนักงาน บทบาท และสิทธิ์ของแต่ละบทบาท', noun: 'ผู้ใช้',
    src: 'users', versioned: true, title: r => r.name,
    fields: [
      { k: 'name', l: 'ชื่อ-นามสกุล', t: 'text', req: 1 }, { k: 'email', l: 'อีเมล', t: 'email', req: 1 },
      { k: 'role', l: 'บทบาท', t: 'select', o: Object.values(ROLES), req: 1 }, { k: 'status', l: 'สถานะ', t: 'select', o: USTAT, req: 1 },
      { k: 'branch', l: 'สาขาประจำ', t: 'ref', ref: 'branches' }, { k: 'lastLogin', l: 'เข้าระบบล่าสุด', t: 'info' },
    ],
    onNew: () => ({ status: 'ใช้งาน' }),
    cols: [{ k: 'name' }, { k: 'email', r: r => `<span class="mono">${esc(r.email)}</span>` }, { k: 'role', chip: 1 }, { k: 'branch' }, { k: 'status', chip: 1 }, { l: 'เข้าระบบล่าสุด', c: 'nw', r: r => fmtDT(r.lastLogin) || '—' }],
    filters: [{ k: 'role' }, { k: 'status' }],
    after: () => roleMatrix(),
  },

  audit: {
    label: 'Audit Log', desc: 'ใครทำอะไร กับข้อมูลไหน เมื่อไหร่ (แก้ไขหรือลบไม่ได้)',
    src: 'audit', readonly: true, title: r => r.title,
    cols: [{ l: 'เวลา', c: 'nw', r: r => fmtDT(r.at) }, { l: 'ผู้ใช้', r: r => esc(r.user) }, { l: 'บทบาท', r: r => chip(r.role) }, { l: 'การกระทำ', r: r => chip(r.action) },
      { l: 'เมนู', r: r => esc(MOD[r.module]?.label || r.module) }, { l: 'รายการ', r: r => esc(r.title) }, { l: 'รายละเอียด', c: 'w', r: r => esc(r.detail) || '—' }],
    filters: [{ l: 'การกระทำ', get: r => r.action }, { l: 'เมนู', get: r => MOD[r.module]?.label }, { l: 'ผู้ใช้', get: r => r.user }],
    sort: (a, b) => String(b.at).localeCompare(String(a.at)),
  },

  versions: {
    label: 'Version History', desc: 'ดูข้อมูลเวอร์ชันเก่า เทียบกับปัจจุบัน และกู้คืน',
    src: 'versions', readonly: true, title: r => r.title,
    cols: [{ l: 'เวลา', c: 'nw', r: r => fmtDT(r.at) }, { l: 'เมนู', r: r => esc(MOD[r.module]?.label) }, { l: 'รายการ', c: 'w', r: r => esc(r.title) },
      { l: 'เวอร์ชัน', n: 1, r: r => 'v' + r.no }, { l: 'การกระทำ', r: r => chip(r.action) }, { l: 'ผู้แก้', r: r => esc(r.user) },
      { l: 'ช่องที่เปลี่ยน', c: 'w', r: r => esc((r.changed || []).join(', ')) || '—' }],
    filters: [{ l: 'เมนู', get: r => MOD[r.module]?.label }, { l: 'การกระทำ', get: r => r.action }],
    sort: (a, b) => String(b.at).localeCompare(String(a.at)) || b.no - a.no,
    rowOpen: r => viewVersion(r),
    rowActions: () => [{ a: 'view', l: 'ดู' }, ...(lvl('versions') === 'full' ? [{ a: 'restore', l: 'กู้คืน' }] : [])],
    tools: () => ui.rec ? `<button class="pill" data-act="clearrec">เฉพาะ: ${esc(short(ui.rec.title, 30))} ✕</button>` : '',
    acts: {
      view: r => viewVersion(r),
      restore: async r => { if (await ask({ title: 'กู้คืนเวอร์ชันนี้?', msg: `“${esc(r.title)}” จะกลับไปเป็นข้อมูลของเวอร์ชัน ${r.no} และบันทึกเป็นเวอร์ชันใหม่`, ok: 'กู้คืน' })) restore(r); },
      clearrec: () => { ui.rec = null; render(); },
    },
  },

  import: {
    label: 'Data Import', desc: 'นำเข้าไฟล์ ตรวจข้อมูลซ้ำและขัดแย้งก่อนบันทึก และย้อนกลับได้ทั้งชุด',
    src: 'imports', readonly: true, title: r => r.file,
    cols: [{ l: 'ไฟล์', r: r => `<span class="mono">${esc(r.file)}</span>` }, { l: 'เวลา', c: 'nw', r: r => fmtDT(r.at) }, { l: 'ผู้นำเข้า', r: r => esc(r.user) }, { l: 'ปลายทาง', r: r => esc(r.target) },
      { l: 'สรุป', c: 'w', r: r => esc(`ใหม่ ${r.counts.new} · อัปเดต ${r.counts.updated} · รอตรวจ ${r.counts.review} · ข้าม ${r.counts.skipped}`) }, { l: 'สถานะ', r: r => chip(r.status) }],
    filters: [{ l: 'สถานะ', get: r => r.status }],
    sort: (a, b) => String(b.at).localeCompare(String(a.at)),
    rowActions: r => lvl('import') === 'full' && r.status === 'นำเข้าแล้ว' ? [{ a: 'rollback', l: 'ย้อนกลับชุดนี้' }] : [],
    top: () => importTop(), bind: () => importBind(),
    acts: {
      sample: () => analyze(SAMPLE_CSV, SAMPLE_FILE),
      paste: () => analyze($('#impText').value, 'ข้อความที่วาง'),
      impconfirm: () => applyImport(),
      impcancel: () => { ui.imp = { step: 0 }; render(); },
      rollback: r => rollback(r),
    },
  },

  settings: {
    label: 'Settings / Integrations', desc: 'ระบบภายนอกที่จะเชื่อมในอนาคต (ตอนนี้ยังไม่เชื่อมจริง)', noun: 'ระบบเชื่อมต่อ',
    src: 'integrations', versioned: true, title: r => r.name,
    fields: [
      { k: 'name', l: 'ชื่อระบบ', t: 'text', req: 1 }, { k: 'category', l: 'ประเภท', t: 'select', o: ICAT },
      { k: 'status', l: 'สถานะ', t: 'select', o: ISTAT, req: 1 }, { k: 'phase', l: 'ช่วงที่จะเชื่อม', t: 'text' },
      { k: 'purpose', l: 'ใช้ทำอะไร', t: 'textarea', full: 1 },
    ],
    onNew: () => ({ status: 'ยังไม่เชื่อมต่อ' }),
    cols: [{ k: 'name' }, { k: 'category' }, { k: 'status', chip: 1 }, { k: 'purpose', c: 'w' }, { k: 'phase' }],
    filters: [{ k: 'category' }, { k: 'status' }],
    top: () => '<div class="notice mute">โหมดทดลอง: ยังไม่มีการเชื่อมต่อจริงกับระบบใด หน้านี้จึงไม่มีช่องให้ใส่รหัสผ่านหรือ API Key</div>',
    rowActions: () => [{ a: 'test', l: 'ทดสอบการเชื่อมต่อ' }],
    acts: { test: r => toast(`โหมดทดลอง: ${r.name} ยังไม่ได้เชื่อมต่อจริง`) },
  },
};
for (const [k, m] of Object.entries(MOD)) { m.key = k; m.title ||= r => r.name; }
const BYSRC = Object.fromEntries(Object.values(MOD).filter(m => m.src).map(m => [m.src, m]));
const NAV = [
  ['ภาพรวม', ['dashboard']],
  ['ข้อมูลธุรกิจ', ['services', 'branches', 'promotions', 'knowledge', 'rules']],
  ['งาน Call Center', ['calls', 'tickets', 'scripts']],
  ['ระบบ', ['users', 'audit', 'versions', 'import', 'settings']],
];
const APPROVAL_MODS = Object.values(MOD).filter(m => m.approval);

// ---------- state ----------
function seedState() {
  const S = seedData();
  for (const m of Object.values(MOD)) if (m.versioned) for (const r of S[m.src]) {
    const first = r.updatedBy === 'ข้อมูลตั้งต้น' || !r.updatedBy;
    S.versions.push({ id: uid('v'), at: first ? at(-14, '09:00') : r.updatedAt, user: first ? 'ข้อมูลตั้งต้น' : r.updatedBy, action: first ? 'สร้าง' : 'เพิ่ม', module: m.key, recId: r.id, title: m.title(r), no: 1, snapshot: clone(r), changed: [] });
  }
  // s5 had a real price change two days ago: v1 = old price, v2 = current.
  const v1 = S.versions.find(v => v.recId === 's5');
  v1.snapshot.priceM = 4900; v1.action = 'สร้าง'; v1.user = 'ข้อมูลตั้งต้น'; v1.at = at(-14, '09:00');
  const s5 = S.services.find(s => s.id === 's5');
  S.versions.push({ id: uid('v'), at: s5.updatedAt, user: s5.updatedBy, action: 'แก้ไข', module: 'services', recId: 's5', title: s5.name, no: 2, snapshot: clone(s5), changed: ['ราคา M · เก๋งกลาง'] });
  return S;
}
function load() { try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.v === 1) return s; } catch { } return seedState(); }
function persist() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { } }
let state = load();
let ui = { q: {}, f: {}, rec: null, imp: { step: 0 } };

// ---------- permissions ----------
const lvl = k => (P[k] || {})[state.role];
const canAdd = m => !m.readonly && ['full', 'propose', 'work'].includes(lvl(m.key));
const canEdit = canAdd;
const canDelete = m => !m.readonly && state.role === 'admin';
const canApprove = m => m.approval && lvl(m.key) === 'full';
const userFor = k => state.users.find(u => u.role === ROLES[k] && u.status === 'ใช้งาน');
const me = () => userFor(state.role) || { id: '', name: ROLES[state.role] };

// ---------- display helpers ----------
const titleOf = (src, r) => BYSRC[src] ? BYSRC[src].title(r) : r.name;
const refName = (src, id) => { const r = id && state[src]?.find(x => x.id === id); return r ? titleOf(src, r) : ''; };
function disp(f, v) {
  switch (f.t) {
    case 'money': return money(v);
    case 'date': return fmtDate(v);
    case 'datetime': return fmtDT(v);
    case 'ref': return refName(f.ref, v);
    case 'refs': return (v || []).map(id => refName(f.ref, id)).filter(Boolean).join(', ');
    default: return v == null ? '' : String(v);
  }
}
function cell(m, c, r) {
  if (c.r) return c.r(r);
  const f = m.fields?.find(x => x.k === c.k);
  if (c.chip) return chip(r[c.k]);
  const s = f ? disp(f, r[c.k]) : r[c.k];
  return s === '' || s == null ? '<span class="muted">—</span>' : esc(s);
}
const colLabel = (m, c) => c.l || m.fields?.find(f => f.k === c.k)?.l || c.k;

// ---------- history ----------
function diffFields(m, a, b) {
  return (m.fields || []).filter(f => !['info', 'calc'].includes(f.t) && JSON.stringify(a?.[f.k] ?? '') !== JSON.stringify(b?.[f.k] ?? ''));
}
function diffDetail(m, a, b) {
  return diffFields(m, a, b).slice(0, 3).map(f => ['textarea', 'refs'].includes(f.t) ? f.l : `${f.l}: ${short(disp(f, a[f.k]), 28) || '—'} → ${short(disp(f, b[f.k]), 28) || '—'}`).join(' · ');
}
function commit(key, action, before, after, detail) {
  const m = MOD[key], r = after || before, t = nowISO(), u = me();
  const changed = before && after ? diffFields(m, before, after).map(f => f.l) : [];
  state.audit.unshift({ id: uid('a'), at: t, user: u.name, role: ROLES[state.role], action, module: key, title: m.title(r), detail: detail ?? (before && after ? diffDetail(m, before, after) : '') });
  if (m.versioned) state.versions.unshift({ id: uid('v'), at: t, user: u.name, action, module: key, recId: r.id, title: m.title(r),
    no: state.versions.filter(v => v.module === key && v.recId === r.id).length + 1, snapshot: clone(r), deleted: !after, changed });
}

// ---------- actions ----------
function done(msg) { persist(); toast(msg); render(); }
function save(m, rec, vals) {
  const L = lvl(m.key), before = rec ? clone(rec) : null;
  const after = { ...(rec || { id: uid(m.key.slice(0, 2)) }), ...vals, updatedAt: nowISO(), updatedBy: me().name };
  if (m.approval) { after.approval = L === 'propose' ? 'pending' : 'approved'; delete after.rejectReason; }
  const arr = state[m.src];
  if (rec) arr[arr.indexOf(rec)] = after; else arr.unshift(after);
  commit(m.key, rec ? 'แก้ไข' : 'เพิ่ม', before, after, m.approval && L === 'propose' ? ((before ? diffDetail(m, before, after) + ' · ' : '') + 'ส่งขออนุมัติ') : undefined);
  dlg.close();
  done(m.approval && L === 'propose' ? 'บันทึกแล้ว · ส่งให้ Manager อนุมัติ' : rec ? 'บันทึกการแก้ไขแล้ว' : `เพิ่ม${m.noun || 'รายการ'}แล้ว`);
}
function approve(m, r) {
  const before = clone(r);
  Object.assign(r, { approval: 'approved', updatedAt: nowISO() }); delete r.rejectReason;
  commit(m.key, 'อนุมัติ', before, r, 'รออนุมัติ → เผยแพร่แล้ว');
  done(`อนุมัติ “${short(m.title(r), 40)}” แล้ว`);
}
async function reject(m, r) {
  const reason = await ask({ title: 'ส่งกลับให้แก้ไข', msg: `“${esc(m.title(r))}” จะกลับไปที่ผู้เสนอพร้อมเหตุผล`, ok: 'ส่งกลับ', reason: true });
  if (!reason) return;
  const before = clone(r);
  Object.assign(r, { approval: 'rejected', rejectReason: reason, updatedAt: nowISO() });
  commit(m.key, 'ส่งกลับ', before, r, 'เหตุผล: ' + reason);
  done('ส่งกลับให้ผู้เสนอแล้ว');
}
async function del(m, r) {
  if (!await ask({ title: 'ลบรายการนี้?', msg: `“${esc(m.title(r))}” จะถูกลบ แต่ยังกู้คืนได้จาก Version History`, ok: 'ลบ', danger: true })) return;
  state[m.src].splice(state[m.src].indexOf(r), 1);
  commit(m.key, 'ลบ', r, null, '');
  done('ลบแล้ว · กู้คืนได้ที่ Version History');
}
function restore(v) {
  const m = MOD[v.module], arr = state[m.src], i = arr.findIndex(r => r.id === v.recId);
  const before = i >= 0 ? clone(arr[i]) : null;
  const after = { ...clone(v.snapshot), updatedAt: nowISO(), updatedBy: me().name };
  if (m.approval) { after.approval = 'approved'; delete after.rejectReason; }
  if (i >= 0) arr[i] = after; else arr.unshift(after);
  commit(m.key, 'กู้คืน', before, after, `กู้คืนจากเวอร์ชัน ${v.no}` + (before ? '' : ' (รายการที่ถูกลบ)'));
  done(`กู้คืน “${short(v.title, 40)}” จากเวอร์ชัน ${v.no} แล้ว`);
}
function uploadFiles(files) {
  const L = lvl('knowledge');
  for (const f of files) {
    const rec = { id: uid('k'), type: f.type.startsWith('image/') ? 'รูปภาพ' : 'เอกสาร', title: f.name.replace(/\.[^.]+$/, ''), content: '', category: 'ทั่วไป', service: '',
      fileName: `${f.name} (${Math.max(1, Math.round(f.size / 1024))} KB)`, approval: L === 'propose' ? 'pending' : 'approved', updatedAt: nowISO(), updatedBy: me().name };
    state.knowledge.unshift(rec);
    commit('knowledge', 'เพิ่ม', null, rec, 'อัปโหลดไฟล์');
  }
  done(`อัปโหลด ${files.length} ไฟล์แล้ว (เดโมเก็บเฉพาะชื่อไฟล์)`);
}

// ---------- dialogs ----------
const dlg = $('#dlg'), dlgBody = $('#dlgBody');
dlg.addEventListener('click', e => { if (e.target.closest('[data-close]')) dlg.close(); });
function ask({ title, msg, ok = 'ยืนยัน', danger = false, reason = false }) {
  return new Promise(res => {
    let settled = false;
    dlgBody.innerHTML = `<form class="dlg" id="askF"><h2>${esc(title)}</h2><p style="margin:0">${msg}</p>
      ${reason ? '<label class="fld full"><span>เหตุผล <em>*</em></span><textarea name="reason" rows="3" required></textarea></label>' : ''}
      <div class="dlg-act"><button type="button" class="btn" data-close>ยกเลิก</button><button class="btn ${danger ? 'danger' : 'pri'}">${esc(ok)}</button></div></form>`;
    const f = $('#askF');
    f.onsubmit = e => { e.preventDefault(); settled = true; const v = reason ? f.reason.value.trim() : true; dlg.close(); res(v); };
    dlg.addEventListener('close', () => { if (!settled) res(false); }, { once: true });
    dlg.showModal();
  });
}
function fieldHtml(f, v, d, editable) {
  const dis = !editable || f.lock?.includes(state.role) ? 'disabled' : '';
  const req = f.req && !dis ? 'required' : '';
  const lab = `<span>${esc(f.l)}${req ? ' <em>*</em>' : ''}</span>`;
  const help = f.help ? `<small>${esc(f.help)}</small>` : '';
  const cls = `fld${f.full ? ' full' : ''}`;
  switch (f.t) {
    case 'info': return v ? `<div class="${cls}">${lab}<div class="info">${esc(f.k === 'lastLogin' ? fmtDT(v) : v)}</div></div>` : '';
    case 'calc': return d.id ? `<div class="${cls}">${lab}<div class="info" style="white-space:pre-line">${esc(f.get(d)) || '—'}</div>${help}</div>` : '';
    case 'textarea': return `<label class="${cls}">${lab}<textarea name="${f.k}" rows="${f.rows || 3}" ${req} ${dis}>${esc(v)}</textarea>${help}</label>`;
    case 'select': case 'ref': {
      const opts = f.t === 'ref' ? state[f.ref].map(r => [r.id, titleOf(f.ref, r)]) : f.o.map(o => [o, o]);
      return `<label class="${cls}">${lab}<select name="${f.k}" ${req} ${dis}><option value="">— เลือก —</option>${opts.map(([val, t]) => `<option value="${esc(val)}"${String(v ?? '') === String(val) ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select>${help}</label>`;
    }
    case 'refs': {
      const set = new Set(v || []);
      return `<fieldset class="${cls}" ${dis}><legend>${esc(f.l)}</legend><div class="checks">${state[f.ref].map(r => `<label><input type="checkbox" name="${f.k}" value="${esc(r.id)}"${set.has(r.id) ? ' checked' : ''}> ${esc(titleOf(f.ref, r))}</label>`).join('')}</div>${help}</fieldset>`;
    }
    default: {
      const type = { money: 'number', number: 'number', date: 'date', datetime: 'datetime-local', email: 'email', url: 'url' }[f.t] || 'text';
      return `<label class="${cls}">${lab}<input name="${f.k}" type="${type}" value="${esc(v)}"${f.t === 'money' ? ' min="0" step="1"' : ''} ${req} ${dis}>${help}</label>`;
    }
  }
}
function openForm(m, rec, preset) {
  const L = lvl(m.key), editable = rec ? canEdit(m) : canAdd(m);
  const d = rec || { ...(m.onNew ? m.onNew() : {}), ...(preset || {}) };
  const notes = [];
  if (rec) notes.push(`<div class="meta">${m.approval ? apprChip(rec) + ' · ' : ''}แก้ไขล่าสุดโดย ${esc(rec.updatedBy || '—')} · ${fmtDT(rec.updatedAt) || '—'}</div>`);
  if (rec?.approval === 'rejected') notes.push(`<div class="notice crit">ส่งกลับให้แก้ไข: ${esc(rec.rejectReason)}</div>`);
  if (editable && m.approval && L === 'propose') notes.push('<div class="notice acc">เมื่อบันทึก รายการนี้จะเป็น “รออนุมัติ” และส่งให้ Manager ตรวจก่อนเผยแพร่</div>');
  if (editable && m.fields.some(f => f.lock?.includes(state.role))) notes.push(`<div class="notice mute">ช่องสีเทา (เช่น ราคา) แก้ไม่ได้ในบทบาท ${ROLES[state.role]}</div>`);
  if (!editable) notes.push(`<div class="notice mute">บทบาท ${ROLES[state.role]} ดูข้อมูลนี้ได้อย่างเดียว</div>`);
  const hist = rec && m.versioned && lvl('versions');
  dlgBody.innerHTML = `<form class="dlg" id="frm" novalidate>
    <h2>${rec ? (editable ? 'แก้ไข' : 'ข้อมูล') : 'เพิ่ม'}${esc(m.noun || '')}${rec ? ` · ${esc(short(m.title(rec), 40))}` : ''}</h2>
    ${notes.join('')}
    <div class="grid2">${m.fields.map(f => fieldHtml(f, d[f.k], d, editable)).join('')}</div>
    <div class="notice crit" id="ferr" hidden></div>
    <div class="dlg-act">${hist ? '<button type="button" class="lnk" id="hist">ดูประวัติของรายการนี้</button>' : ''}
      <button type="button" class="btn" data-close>${editable ? 'ยกเลิก' : 'ปิด'}</button>${editable ? '<button class="btn pri">บันทึก</button>' : ''}</div></form>`;
  const form = $('#frm');
  $('#hist')?.addEventListener('click', () => { ui.rec = { id: rec.id, title: m.title(rec) }; dlg.close(); go('versions'); });
  form.onsubmit = e => {
    e.preventDefault();
    const err = $('#ferr');
    if (!form.checkValidity()) { err.textContent = 'กรอกช่องที่มีเครื่องหมาย * ให้ครบ และตรวจรูปแบบข้อมูล'; err.hidden = false; form.reportValidity(); return; }
    const fd = new FormData(form), vals = {};
    for (const f of m.fields) {
      if (['info', 'calc'].includes(f.t) || f.lock?.includes(state.role)) continue;
      if (f.t === 'refs') { vals[f.k] = fd.getAll(f.k); continue; }
      let v = String(fd.get(f.k) ?? '').trim();
      if ((f.t === 'money' || f.t === 'number') && v !== '') v = Number(v);
      vals[f.k] = v;
    }
    const msg = m.validate?.(vals);
    if (msg) { err.textContent = msg; err.hidden = false; return; }
    save(m, rec, vals);
  };
  dlg.showModal();
}
function viewVersion(v) {
  const m = MOD[v.module], cur = state[m.src].find(r => r.id === v.recId);
  const rows = m.fields.filter(f => f.t !== 'calc').map(f => ({ l: f.l, a: disp(f, v.snapshot[f.k]), b: cur ? disp(f, cur[f.k]) : '' }));
  if (m.approval) rows.push({ l: 'สถานะอนุมัติ', a: APPR[v.snapshot.approval] || '', b: cur ? APPR[cur.approval] : '' });
  const canRestore = lvl('versions') === 'full';
  dlgBody.innerHTML = `<div class="dlg"><h2>${esc(v.title)} <span class="muted">· เวอร์ชัน ${v.no}</span></h2>
    <div class="meta">${chip(v.action)} โดย ${esc(v.user)} · ${fmtDT(v.at)} · ${esc(m.label)}</div>
    ${cur ? '' : '<div class="notice crit">รายการนี้ถูกลบไปแล้ว กู้คืนเวอร์ชันนี้เพื่อนำกลับมา</div>'}
    <div class="tbl-wrap"><table><thead><tr><th>ช่องข้อมูล</th><th>เวอร์ชัน ${v.no}</th><th>ปัจจุบัน</th></tr></thead><tbody>
    ${rows.map(x => `<tr class="${cur && x.a !== x.b ? 'chg' : ''}"><td>${esc(x.l)}</td><td>${esc(x.a) || '—'}</td><td>${cur ? esc(x.b) || '—' : '<span class="muted">ถูกลบ</span>'}</td></tr>`).join('')}
    </tbody></table></div><p class="hint">แถวที่ไฮไลต์คือช่องที่ต่างจากข้อมูลปัจจุบัน</p>
    <div class="dlg-act"><button type="button" class="btn" data-close>ปิด</button>${canRestore ? '<button type="button" class="btn pri" id="doRestore">กู้คืนเวอร์ชันนี้</button>' : ''}</div></div>`;
  $('#doRestore')?.addEventListener('click', () => { dlg.close(); restore(v); });
  dlg.showModal();
}
let toastTimer;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => t.hidden = true, 2800); }

// ---------- list pages ----------
function filtersOf(m) {
  return (m.filters || []).map(f => {
    const fd = f.k && m.fields?.find(x => x.k === f.k);
    const get = f.get || (fd?.t === 'ref' ? r => refName(fd.ref, r[f.k]) : r => r[f.k]);
    const o = f.o || fd?.o || [...new Set(state[m.src].map(get).filter(Boolean))].sort();
    return { l: f.l || fd?.l || f.k, get, o };
  });
}
const strip = s => String(s).replace(/<[^>]*>/g, ' ');
const searchText = (m, r) => [...m.cols.map(c => strip(cell(m, c, r))), ...Object.values(r).filter(v => typeof v === 'string')].join(' ').toLowerCase();
function rowsOf(m) {
  let rows = [...state[m.src]];
  if (m.key === 'versions' && ui.rec) rows = rows.filter(v => v.recId === ui.rec.id);
  const q = (ui.q[m.key] || '').trim().toLowerCase();
  if (q) rows = rows.filter(r => searchText(m, r).includes(q));
  const fs = ui.f[m.key] || {};
  filtersOf(m).forEach((f, i) => { if (fs[i]) rows = rows.filter(r => String(f.get(r) ?? '') === fs[i]); });
  return rows.sort(m.sort || byUpdated); // ponytail: no pagination; the real app pages and searches on the server
}
function actionsHtml(m, r) {
  const b = (a, l, cls = '') => `<button type="button" class="lnk ${cls}" data-act="${a}" data-mod="${m.key}" data-id="${esc(r.id)}">${l}</button>`;
  const out = [];
  if (canApprove(m) && r.approval === 'pending') out.push(b('approve', 'อนุมัติ', 'ok'), b('reject', 'ส่งกลับ', 'crit'));
  (m.rowActions?.(r) || []).forEach(x => out.push(b(x.a, x.l)));
  if (!m.readonly) out.push(b('open', canEdit(m) ? 'แก้ไข' : 'ดู'));
  if (canDelete(m)) out.push(b('del', 'ลบ', 'crit'));
  return out.join('');
}
function renderTable(m) {
  const rows = rowsOf(m), openable = !m.readonly || m.rowOpen;
  $('#tbl').innerHTML = `<div class="tbl-wrap"><table>
    <thead><tr>${m.cols.map(c => `<th class="${c.n ? 'n' : ''}">${esc(colLabel(m, c))}</th>`).join('')}<th></th></tr></thead>
    <tbody>${rows.map(r => `<tr${openable ? ` data-id="${esc(r.id)}" tabindex="0"` : ''}>${m.cols.map(c => `<td class="${c.n ? 'n' : ''} ${c.c || ''}">${cell(m, c, r)}</td>`).join('')}<td class="acts">${actionsHtml(m, r)}</td></tr>`).join('')}</tbody>
    </table>${rows.length ? '' : '<div class="empty">ไม่พบรายการที่ตรงกับการค้นหาหรือตัวกรอง</div>'}</div>
    <div class="count">แสดง ${rows.length} จาก ${state[m.src].length} รายการ</div>`;
}
function permLine(m) {
  const L = lvl(m.key);
  if (m.readonly) return m.key === 'audit' ? 'บันทึกนี้แก้ไขหรือลบไม่ได้ เพื่อให้ตรวจสอบย้อนหลังได้เสมอ' : '';
  if (L === 'view') return `บทบาท ${ROLES[state.role]} ดูได้อย่างเดียว`;
  if (L === 'propose') return 'สิ่งที่คุณเพิ่มหรือแก้จะรอ Manager อนุมัติก่อนเผยแพร่';
  if (state.role !== 'admin') return 'การลบทำได้เฉพาะ Admin';
  return '';
}
function renderModule(m) {
  const fs = ui.f[m.key] ||= {};
  $('#view').innerHTML = `${m.top ? m.top() : ''}
    <div class="toolbar">
      <input type="search" id="q" placeholder="ค้นหาใน ${esc(m.label)}…" value="${esc(ui.q[m.key] || '')}" aria-label="ค้นหา">
      ${filtersOf(m).map((f, i) => `<select data-f="${i}" aria-label="${esc(f.l)}"><option value="">${esc(f.l)}: ทั้งหมด</option>${f.o.map(o => `<option${fs[i] === o ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select>`).join('')}
      <span class="grow"></span>${m.tools ? m.tools() : ''}
      ${canAdd(m) ? `<button type="button" class="btn pri" data-act="add">+ เพิ่ม${esc(m.noun || '')}</button>` : ''}
    </div>
    ${permLine(m) ? `<div class="perm">${permLine(m)}</div>` : ''}
    <div id="tbl"></div>${m.after ? m.after() : ''}`;
  $('#q').addEventListener('input', e => { ui.q[m.key] = e.target.value; renderTable(m); });
  document.querySelectorAll('select[data-f]').forEach(s => s.addEventListener('change', () => { fs[s.dataset.f] = s.value; renderTable(m); }));
  m.bind?.();
  renderTable(m);
}
function roleMatrix() {
  const keys = NAV.flatMap(g => g[1]);
  const tone = { full: 'ink', propose: 'acc', work: 'acc', view: 'ok' };
  return `<h3 class="sub">สิทธิ์ของแต่ละบทบาท</h3><div class="tbl-wrap"><table><thead><tr><th>เมนู</th>${Object.values(ROLES).map(r => `<th>${r}</th>`).join('')}</tr></thead><tbody>
    ${keys.map(k => `<tr><td>${esc(MOD[k].label)}</td>${Object.keys(ROLES).map(r => { const l = P[k][r]; return `<td>${l ? `<span class="chip t-${tone[l]}">${LV[l]}</span>` : '<span class="muted">—</span>'}</td>`; }).join('')}</tr>`).join('')}
    </tbody></table></div><p class="hint">จัดการ = สร้าง แก้ และอนุมัติ · เสนอแก้ = ต้องรอ Manager อนุมัติ · ลบได้เฉพาะ Admin · ในระบบจริงสิทธิ์จะตรวจที่ Server ด้วย ไม่ใช่แค่ซ่อนปุ่ม</p>`;
}

// ---------- dashboard ----------
function renderDashboard() {
  const can = k => !!lvl(k);
  const queue = APPROVAL_MODS.filter(m => can(m.key)).flatMap(m => state[m.src].filter(r => r.approval === 'pending' || r.approval === 'rejected').map(r => ({ m, r }))).sort((a, b) => byUpdated(a.r, b.r));
  const pend = queue.filter(x => x.r.approval === 'pending');
  const active = state.promotions.filter(p => p.approval === 'approved' && promoState(p) === 'Active');
  const soon = active.filter(p => p.end <= day(7)).sort((a, b) => a.end.localeCompare(b.end));
  const openT = state.tickets.filter(t => t.status !== 'ปิดแล้ว').sort(MOD.tickets.sort), od = openT.filter(overdue);
  const today = state.calls.filter(c => String(c.at).slice(0, 10) === TODAY);
  const tile = (l, v, go, sub = '', warn = false) => `<button type="button" class="tile${warn ? ' warn' : ''}" ${go ? `data-go="${go}"` : ''}><span>${l}</span><b>${v}</b>${sub ? `<small>${sub}</small>` : ''}</button>`;
  const tiles = [
    can('services') && tile('บริการที่เผยแพร่', state.services.filter(s => s.approval === 'approved').length, 'services'),
    can('branches') && tile('สาขาที่เปิดให้บริการ', state.branches.filter(b => b.status === 'เปิดให้บริการ').length, 'branches', `จากทั้งหมด ${state.branches.length} สาขา`),
    can('promotions') && tile('โปรโมชั่น Active', active.length, 'promotions', soon.length ? `${soon.length} รายการหมดภายใน 7 วัน` : ''),
    tile('รออนุมัติ', pend.length, '', pend.length ? (APPROVAL_MODS.some(canApprove) ? 'ตรวจได้ในกล่องด้านล่าง' : 'รอ Manager ตรวจ') : 'ไม่มีงานค้าง', pend.length > 0),
    can('tickets') && tile('Ticket ที่ยังไม่ปิด', openT.length, 'tickets', od.length ? `เกินกำหนด ${od.length} รายการ` : 'ไม่มีงานเกินกำหนด', od.length > 0),
    can('calls') && tile('สายวันนี้', today.length, 'calls', `ต้องติดตาม ${today.filter(c => c.result === 'ต้องติดตาม').length} สาย`),
  ].filter(Boolean).join('');
  const li = (x, right) => `<li><div class="t"><button type="button" class="lnk" style="padding:0;text-align:left" data-act="open" data-mod="${x.m.key}" data-id="${esc(x.r.id)}">${esc(short(x.m.title(x.r), 48))}</button><small>${esc(x.m.label)} · ${esc(x.r.updatedBy || '')} · ${fmtDT(x.r.updatedAt)}</small></div><div>${right}</div></li>`;
  const qItems = queue.map(x => {
    const b = (a, l, c) => `<button type="button" class="lnk ${c}" data-act="${a}" data-mod="${x.m.key}" data-id="${esc(x.r.id)}">${l}</button>`;
    return li(x, x.r.approval === 'rejected' ? apprChip(x.r) : canApprove(x.m) ? b('approve', 'อนุมัติ', 'ok') + b('reject', 'ส่งกลับ', 'crit') : apprChip(x.r));
  }).join('');
  const panel = (title, body, extra = '') => `<section class="panel${extra}"><h3>${title}</h3>${body}</section>`;
  const list = (items, empty) => items ? `<ul>${items}</ul>` : `<div class="empty">${empty}</div>`;
  $('#view').innerHTML = `<div class="tiles">${tiles}</div><div class="panels">
    ${panel('ลองทดสอบ Workflow', `<ol>
      <li>สลับบทบาทมุมขวาบนเป็น <b>Marketing</b> แล้วเพิ่มหรือแก้โปรโมชั่น</li>
      <li>สลับเป็น <b>Manager</b> แล้วกดอนุมัติหรือส่งกลับในกล่อง “รออนุมัติ”</li>
      <li>เปิด <b>Version History</b> ดูว่าใครแก้อะไร แล้วลองกู้คืนเวอร์ชันเก่า</li>
      <li>สลับเป็น <b>Call Center</b> บันทึกการโทร แล้วกด “เปิด Ticket”</li>
      <li>ลอง <b>Data Import</b> ด้วยไฟล์ตัวอย่างที่มีข้อมูลซ้ำ ขัดแย้ง และ NEED_REVIEW</li></ol>`, ' guide')}
    ${panel(`รออนุมัติ / ส่งกลับ <span class="chip t-warn">${pend.length}</span>`, list(qItems, 'ไม่มีรายการรออนุมัติ'))}
    ${can('promotions') ? panel('โปรโมชั่นที่จะหมดภายใน 7 วัน', list(soon.map(p => li({ m: MOD.promotions, r: p }, `<span class="muted">ถึง ${fmtDate(p.end)}</span>`)).join(''), 'ไม่มีโปรโมชั่นใกล้หมด')) : ''}
    ${can('tickets') ? panel('Ticket ที่ต้องติดตาม', list(openT.slice(0, 6).map(t => li({ m: MOD.tickets, r: t }, overdue(t) ? chip('เกินกำหนด') : chip(t.status))).join(''), 'ไม่มี Ticket ค้าง')) : ''}
    ${can('audit') ? panel('การเปลี่ยนแปลงล่าสุด', list([...state.audit].sort(MOD.audit.sort).slice(0, 6).map(a => `<li><div class="t"><span>${esc(short(a.title, 44))}</span><small>${esc(a.user)} · ${esc(MOD[a.module]?.label || '')} · ${fmtDT(a.at)}</small></div>${chip(a.action)}</li>`).join(''), 'ยังไม่มีการเปลี่ยนแปลง')) : ''}
  </div>`;
}

// ---------- data import ----------
const TAGS = { new: ['ใหม่', 'ok'], same: ['ไม่เปลี่ยน', 'mute'], dup: ['ซ้ำ', 'mute'], conflict: ['ขัดแย้ง', 'warn'], review: ['NEED_REVIEW', 'crit'] };
const DECS = { new: [['import', 'นำเข้า'], ['skip', 'ข้าม']], conflict: [['keep', 'คงค่าเดิมในระบบ'], ['update', 'ใช้ค่าจากไฟล์']], review: [['skip', 'ข้าม'], ['draft', 'นำเข้าเป็นรายการรอตรวจ']], dup: [['skip', 'ข้าม']], same: [['skip', 'ข้าม']] };
const SIZES = ['S', 'M', 'L', 'XL'];
function parseCSV(text) {
  const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
    else if (ch === '"') q = true;
    else if (ch === ',') { row.push(cur); cur = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; }
    else cur += ch;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows.filter(r => r.some(c => c.trim()));
}
function analyze(text, file) {
  const rows = parseCSV(String(text || '').replace(/^\uFEFF/, ''));
  if (rows.length < 2) return toast('ไม่พบข้อมูล ต้องมีหัวตารางและข้อมูลอย่างน้อย 1 แถว');
  const head = rows[0].map(h => h.trim()), need = ['ชื่อบริการ', 'หมวด', ...SIZES];
  const miss = need.filter(n => !head.includes(n));
  if (miss.length) return toast('ไม่พบคอลัมน์: ' + miss.join(', '));
  const seen = new Map();
  const out = rows.slice(1).map((c, i) => {
    const row = i + 2, g = n => (c[head.indexOf(n)] ?? '').trim();
    const name = g('ชื่อบริการ'), category = g('หมวด'), raw = Object.fromEntries(SIZES.map(s => [s, g(s)]));
    const issues = [], prices = {};
    if (!name) issues.push('ไม่มีชื่อบริการ');
    if (!category) issues.push('ไม่มีหมวด'); else if (!CATS.includes(category)) issues.push(`หมวด “${category}” ไม่มีในระบบ`);
    if (SIZES.every(s => !raw[s])) issues.push('ไม่มีราคา');
    else SIZES.forEach(s => { const v = raw[s].replace(/[,\s฿]/g, ''); if (!v) issues.push(`ไม่มีราคา ${s}`); else if (!/^\d+$/.test(v)) issues.push(`ราคา ${s} “${raw[s]}” ไม่ใช่ตัวเลข`); else prices['price' + s] = Number(v); });
    const k = name.toLowerCase(); let tag, reason, ex;
    if (issues.length) { tag = 'review'; reason = issues.join(' · '); }
    else if (seen.has(k)) { tag = 'dup'; reason = `ซ้ำกับแถว ${seen.get(k)} ในไฟล์`; }
    else {
      ex = state.services.find(s => s.name.trim().toLowerCase() === k);
      if (!ex) { tag = 'new'; reason = 'ยังไม่มีในระบบ'; }
      else {
        const diffs = SIZES.filter(s => Number(ex['price' + s]) !== prices['price' + s]).map(s => `${s}: ในระบบ ${money(ex['price' + s]) || '—'} → ไฟล์ ${money(prices['price' + s])}`);
        if (ex.category !== category) diffs.push(`หมวด: ${ex.category} → ${category}`);
        [tag, reason] = diffs.length ? ['conflict', diffs.join(' · ')] : ['same', 'ตรงกับข้อมูลในระบบ'];
      }
    }
    if (name && !seen.has(k)) seen.set(k, row);
    return { row, name, category, raw, prices, tag, reason, exId: ex?.id, dec: DECS[tag][0][0] };
  });
  ui.imp = { step: 1, file, rows: out };
  render();
}
function applyImport() {
  const { file, rows } = ui.imp, appr = lvl('import') === 'full' ? 'approved' : 'pending', by = me().name;
  const changes = [], cnt = { new: 0, updated: 0, review: 0, skipped: 0 };
  for (const x of rows) {
    const src = `${file} · แถว ${x.row}`;
    if (x.dec === 'import' || x.dec === 'draft') {
      const draft = x.dec === 'draft';
      const rec = { id: uid('s'), name: x.name || `(ไม่มีชื่อ) แถว ${x.row}`, category: CATS.includes(x.category) ? x.category : 'อื่นๆ',
        ...Object.fromEntries(SIZES.map(s => ['price' + s, x.prices['price' + s] ?? ''])), duration: '', branches: [],
        summary: draft ? 'NEED_REVIEW: ' + x.reason : '', source: src, approval: draft ? 'pending' : appr, updatedAt: nowISO(), updatedBy: by };
      state.services.unshift(rec);
      commit('services', 'นำเข้า', null, rec, 'จาก ' + src);
      changes.push({ id: rec.id, before: null }); draft ? cnt.review++ : cnt.new++;
    } else if (x.dec === 'update') {
      const cur = state.services.find(s => s.id === x.exId);
      if (!cur) { cnt.skipped++; continue; }
      const before = clone(cur);
      Object.assign(cur, x.prices, { category: x.category, source: src, approval: appr, updatedAt: nowISO(), updatedBy: by });
      commit('services', 'นำเข้า', before, cur, diffDetail(MOD.services, before, cur) + ' · จาก ' + src);
      changes.push({ id: cur.id, before }); cnt.updated++;
    } else cnt.skipped++;
  }
  const batch = { id: uid('i'), file, target: 'Services & Prices', at: nowISO(), user: by, counts: cnt, changes, status: 'นำเข้าแล้ว' };
  state.imports.unshift(batch);
  commit('import', 'นำเข้า', null, batch, `ใหม่ ${cnt.new} · อัปเดต ${cnt.updated} · รอตรวจ ${cnt.review} · ข้าม ${cnt.skipped}`);
  ui.imp = { step: 2, batch, pending: appr === 'pending' || cnt.review > 0 };
  done('นำเข้าข้อมูลแล้ว');
}
async function rollback(b) {
  if (!await ask({ title: 'ย้อนกลับชุดนำเข้านี้?', msg: `ทุกรายการที่มาจาก “${esc(b.file)}” จะกลับเป็นข้อมูลก่อนนำเข้า รายการที่สร้างใหม่จะถูกลบ (ยังกู้คืนได้จาก Version History)`, ok: 'ย้อนกลับ', danger: true })) return;
  const arr = state.services;
  for (const c of [...b.changes].reverse()) {
    const i = arr.findIndex(s => s.id === c.id);
    if (i < 0) continue;
    const cur = arr[i];
    if (!c.before) { arr.splice(i, 1); commit('services', 'ลบ', cur, null, `ย้อนกลับการนำเข้า ${b.file}`); }
    else { arr[i] = clone(c.before); commit('services', 'กู้คืน', cur, arr[i], `ย้อนกลับการนำเข้า ${b.file}`); }
  }
  b.status = 'ย้อนกลับแล้ว';
  commit('import', 'ย้อนกลับ', null, b, 'ย้อนกลับทั้งชุด');
  done('ย้อนกลับชุดนำเข้าแล้ว');
}
function importTop() {
  const s = ui.imp;
  if (!canAdd({ key: 'import' })) return '';
  if (s.step === 1) {
    const n = t => s.rows.filter(r => r.tag === t).length;
    const willDo = s.rows.filter(r => ['import', 'update', 'draft'].includes(r.dec)).length;
    return `<div class="imp"><h2>ตรวจข้อมูลก่อนนำเข้า · <span class="mono">${esc(s.file)}</span></h2>
      <div class="sumline">${Object.entries(TAGS).map(([k, [l, t]]) => `<span class="chip t-${t}">${l} ${n(k)}</span>`).join('')}</div>
      <div class="tbl-wrap"><table><thead><tr><th class="n">แถว</th><th>ชื่อบริการ</th><th>หมวด</th>${SIZES.map(z => `<th class="n">${z}</th>`).join('')}<th>ผลตรวจ</th><th>เหตุผล</th><th>ทำอย่างไร</th></tr></thead><tbody>
      ${s.rows.map((r, i) => `<tr><td class="n">${r.row}</td><td>${esc(r.name) || '—'}</td><td>${esc(r.category) || '—'}</td>${SIZES.map(z => `<td class="n">${esc(r.raw[z]) || '—'}</td>`).join('')}
        <td><span class="chip t-${TAGS[r.tag][1]}">${TAGS[r.tag][0]}</span></td><td class="w">${esc(r.reason)}</td>
        <td><select data-i="${i}" ${DECS[r.tag].length < 2 ? 'disabled' : ''} aria-label="การดำเนินการแถว ${r.row}">${DECS[r.tag].map(([v, l]) => `<option value="${v}"${r.dec === v ? ' selected' : ''}>${l}</option>`).join('')}</select></td></tr>`).join('')}
      </tbody></table></div>
      <p class="hint">ทุกรายการที่นำเข้าจะจำที่มาไว้ (ไฟล์ + แถว) และย้อนกลับได้ทั้งชุด${lvl('import') === 'propose' ? ' · บทบาทของคุณ: รายการที่นำเข้าจะรอ Manager อนุมัติ' : ''}</p>
      <div class="dlg-act"><button type="button" class="btn" data-act="impcancel">ยกเลิก</button><button type="button" class="btn pri" data-act="impconfirm" id="impGo">ยืนยันนำเข้า ${willDo} รายการ</button></div></div>
      <h3 class="sub">ประวัติการนำเข้า</h3>`;
  }
  const result = s.step === 2 ? `<div class="notice acc">นำเข้า <b>${esc(s.batch.file)}</b> แล้ว: ใหม่ ${s.batch.counts.new} · อัปเดต ${s.batch.counts.updated} · รอตรวจ ${s.batch.counts.review} · ข้าม ${s.batch.counts.skipped}${s.pending ? ' · บางรายการจะแสดงเป็น “รออนุมัติ” จนกว่า Manager จะตรวจ' : ''} · <button type="button" class="lnk" data-go="services">ไปที่ Services & Prices</button></div>` : '';
  return `${result}<div class="imp"><h2>นำเข้าข้อมูลบริการและราคา</h2>
    <p class="hint">ระบบจะตรวจทุกแถวก่อนบันทึก และติดป้าย ใหม่ · ไม่เปลี่ยน · ซ้ำ · ขัดแย้ง · NEED_REVIEW</p>
    <div class="opts">
      <div class="opt"><b>ใช้ไฟล์ตัวอย่าง</b><span>${SAMPLE_FILE} · 9 แถว มีครบทุกกรณีให้ลอง</span><div><button type="button" class="btn pri" data-act="sample">ลองกับไฟล์ตัวอย่าง</button></div></div>
      <div class="opt"><b>เลือกไฟล์ CSV</b><span>คอลัมน์: ชื่อบริการ, หมวด, S, M, L, XL</span><div><label class="btn">เลือกไฟล์<input type="file" id="impFile" accept=".csv,text/csv"></label></div></div>
      <div class="opt wide"><b>หรือวางข้อมูลจาก Excel / Google Sheet (คั่นด้วยจุลภาค)</b><textarea id="impText" rows="3" placeholder="ชื่อบริการ,หมวด,S,M,L,XL&#10;ล้างสี + ดูดฝุ่น,ล้างรถ,250,300,350,450"></textarea><div><button type="button" class="btn" data-act="paste">ตรวจข้อมูล</button></div></div>
    </div>
    <p class="hint">เดโมนี้อ่าน CSV ส่วน Excel, Word, JSON และ TXT จะรองรับในระบบจริง (Phase 3)</p></div>
    <h3 class="sub">ประวัติการนำเข้า</h3>`;
}
function importBind() {
  document.querySelectorAll('select[data-i]').forEach(sel => sel.addEventListener('change', () => {
    ui.imp.rows[sel.dataset.i].dec = sel.value;
    $('#impGo').textContent = `ยืนยันนำเข้า ${ui.imp.rows.filter(r => ['import', 'update', 'draft'].includes(r.dec)).length} รายการ`;
  }));
  $('#impFile')?.addEventListener('change', e => {
    const f = e.target.files[0]; if (!f) return;
    const rd = new FileReader(); rd.onload = () => analyze(rd.result, f.name); rd.readAsText(f, 'utf-8');
  });
}

// ---------- routing & wiring ----------
function route() { const k = location.hash.replace('#/', '') || 'dashboard'; return MOD[k] && lvl(k) ? k : 'dashboard'; }
function go(k) { if (location.hash === '#/' + k) render(); else location.hash = '#/' + k; }
function renderNav(cur) {
  $('#nav').innerHTML = NAV.map(([g, keys]) => {
    const items = keys.filter(k => lvl(k));
    if (!items.length) return '';
    return `<div class="grp"><h6>${g}</h6>${items.map(k => {
      const n = MOD[k].approval && canApprove(MOD[k]) ? state[MOD[k].src].filter(r => r.approval === 'pending').length : 0;
      return `<a href="#/${k}"${k === cur ? ' aria-current="page"' : ''}><span>${esc(MOD[k].label)}</span>${n ? `<span class="badge" title="รออนุมัติ">${n}</span>` : ''}</a>`;
    }).join('')}</div>`;
  }).join('');
}
function renderRole() {
  $('#role').innerHTML = Object.entries(ROLES).map(([k, l]) => { const u = userFor(k); return `<option value="${k}"${k === state.role ? ' selected' : ''}>${l}${u ? ' · ' + esc(u.name) : ''}</option>`; }).join('');
}
function render() {
  const k = route(), m = MOD[k];
  renderNav(k); renderRole();
  $('#pageTitle').textContent = m.label;
  $('#pageDesc').textContent = m.desc;
  m.page ? m.page() : renderModule(m);
}
$('#nav').addEventListener('click', e => { if (e.target.closest('a')) ui.rec = null; });
$('#role').addEventListener('change', e => { state.role = e.target.value; persist(); render(); toast(`สลับเป็น ${ROLES[state.role]} · ${me().name}`); });
$('#reset').addEventListener('click', async () => {
  if (!await ask({ title: 'รีเซ็ตข้อมูลตัวอย่าง?', msg: 'ทุกอย่างที่คุณเพิ่มหรือแก้ในเดโมนี้จะหายไป และกลับเป็นข้อมูลตั้งต้น', ok: 'รีเซ็ต', danger: true })) return;
  state = seedState(); ui = { q: {}, f: {}, rec: null, imp: { step: 0 } };
  done('รีเซ็ตข้อมูลตัวอย่างแล้ว');
});
const view = $('#view');
view.addEventListener('click', e => {
  if (e.target.closest('a[href^="http"]')) return;
  const g = e.target.closest('[data-go]');
  if (g) { if (g.dataset.go) go(g.dataset.go); return; }
  const b = e.target.closest('[data-act]');
  if (b) {
    const m = MOD[b.dataset.mod || route()], a = b.dataset.act;
    const r = b.dataset.id && m.src ? state[m.src].find(x => x.id === b.dataset.id) : null;
    if (a === 'add') return openForm(m, null);
    if (a === 'open') return r && (lvl(m.key) ? openForm(m, r) : toast('บทบาทนี้ไม่มีสิทธิ์เปิดเมนูนี้'));
    if (a === 'approve') return r && approve(m, r);
    if (a === 'reject') return r && reject(m, r);
    if (a === 'del') return r && del(m, r);
    return m.acts?.[a]?.(r, b);
  }
  const tr = e.target.closest('tr[data-id]');
  if (tr) { const m = MOD[route()], r = state[m.src].find(x => x.id === tr.dataset.id); if (r) (m.rowOpen || (x => openForm(m, x)))(r); }
});
view.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('tr[data-id]')) e.target.click(); });
window.addEventListener('hashchange', render);
render();
