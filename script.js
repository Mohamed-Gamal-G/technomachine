import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, onSnapshot, addDoc, setDoc, doc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const machinesCol = collection(db, "machines");

let machines = [];
let isLoggedIn = false;

const $ = (id) => document.getElementById(id);
const machinesGrid = $('machinesGrid');
const machineCount = $('machineCount');
const searchInput = $('searchInput');
const navAdminBtn = $('navAdminBtn');
const loginModal = $('loginModal');
const loginForm = $('loginForm');
const loginError = $('loginError');
const adminModal = $('adminModal');
const machineForm = $('machineForm');
const adminMachinesTable = $('adminMachinesTable');
const specModal = $('specModal');
const specModalContent = $('specModalContent');
const saveMachineBtn = $('saveMachineBtn');
const cancelEditBtn = $('cancelEditBtn');

const PLACEHOLDER = 'https://via.placeholder.com/600x400?text=Machinery';

// حماية من إدخال أكواد ضارة في النصوص
function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}
function safeUrl(url) {
  const u = String(url || '').trim();
  return (/^https?:\/\//i.test(u) || /^data:image\//i.test(u)) ? esc(u) : PLACEHOLDER;
}
function cleanPhone(p) { return String(p || '').replace(/\D/g, ''); }

// ===== التحديث الحي: أي تغيير في قاعدة البيانات يظهر فوراً على كل الأجهزة =====
onSnapshot(machinesCol, (snap) => {
  machines = snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  renderCatalog(searchInput.value.trim());
  renderAdminTable();
}, (err) => {
  console.error(err);
  machinesGrid.innerHTML = '<div style="text-align:center; grid-column:1/-1; padding:2rem; color:#ef4444;">تعذر تحميل الماكينات. تأكد من إعدادات Firebase (راجع README).</div>';
});

onAuthStateChanged(auth, (user) => {
  isLoggedIn = !!user;
  if (!isLoggedIn) adminModal.classList.remove('active');
});

function renderCatalog(filterText = '') {
  machinesGrid.innerHTML = '';
  const q = filterText.toLowerCase();
  const filtered = machines.filter(m =>
    (m.title || '').toLowerCase().includes(q) || (m.specs || '').toLowerCase().includes(q)
  );
  machineCount.innerText = filtered.length;

  if (filtered.length === 0) {
    machinesGrid.innerHTML = '<div style="text-align:center; grid-column:1/-1; padding:2rem; color:var(--text-muted);">لا توجد ماكينات متاحة حالياً.</div>';
    return;
  }

  filtered.forEach(m => {
    const card = document.createElement('div');
    card.className = 'machine-card';
    const msg = encodeURIComponent(`مرحباً، أود الاستفسار عن ${m.title} بسعر ${m.price}`);
    const specs = m.specs || '';
    card.innerHTML = `
      <div class="machine-img-wrapper"><img src="${safeUrl(m.image)}" alt="${esc(m.title)}"></div>
      <div class="machine-info">
        <h3 class="machine-title">${esc(m.title)}</h3>
        <div class="machine-price">${esc(m.price)}</div>
        <p class="machine-specs-preview">${esc(specs.substring(0, 75))}${specs.length > 75 ? '...' : ''}</p>
        <div class="card-actions">
          <button class="btn btn-secondary btn-sm" type="button" onclick="openSpecs('${esc(m.id)}')">التفاصيل</button>
          <a href="https://wa.me/${cleanPhone(m.phone)}?text=${msg}" target="_blank" rel="noopener noreferrer" class="btn btn-success btn-sm">
            <i class="fa-brands fa-whatsapp"></i> طلب الماكينة
          </a>
        </div>
      </div>`;
    machinesGrid.appendChild(card);
  });
}

searchInput.addEventListener('input', (e) => renderCatalog(e.target.value.trim()));

window.openSpecs = function (id) {
  const m = machines.find(x => x.id === id);
  if (!m) return;
  const msg = encodeURIComponent(`مرحباً، أود الاستفسار عن ${m.title} بسعر ${m.price}`);
  specModalContent.innerHTML = `
    <h2>${esc(m.title)}</h2>
    <img src="${safeUrl(m.image)}" style="width:100%; max-height:280px; object-fit:cover; border-radius:8px; margin:1rem 0;" />
    <h3 style="color:var(--accent-amber); margin-bottom:10px;">السعر: ${esc(m.price)}</h3>
    <p><strong>المواصفات الفنية:</strong></p>
    <p style="white-space:pre-line; margin-bottom:1.5rem; color:var(--text-muted);">${esc(m.specs)}</p>
    <a href="https://wa.me/${cleanPhone(m.phone)}?text=${msg}" target="_blank" rel="noopener noreferrer" class="btn btn-success btn-block">
      <i class="fa-brands fa-whatsapp"></i> تواصل للطلب عبر الواتساب
    </a>`;
  specModal.classList.add('active');
};

navAdminBtn.addEventListener('click', () => {
  if (isLoggedIn) openAdminDashboard();
  else loginModal.classList.add('active');
});
$('closeLoginModal').addEventListener('click', () => loginModal.classList.remove('active'));
$('closeAdminModal').addEventListener('click', () => adminModal.classList.remove('active'));
$('closeSpecModal').addEventListener('click', () => specModal.classList.remove('active'));

// ===== تسجيل الدخول (Firebase Authentication) =====
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = $('username').value.trim();
  const pass = $('password').value;
  try {
    await signInWithEmailAndPassword(auth, email, pass);
    loginError.style.display = 'none';
    loginModal.classList.remove('active');
    loginForm.reset();
    openAdminDashboard();
  } catch (err) {
    console.error(err);
    loginError.style.display = 'block';
  }
});

function openAdminDashboard() {
  renderAdminTable();
  adminModal.classList.add('active');
}

$('logoutBtn').addEventListener('click', async () => {
  await signOut(auth);
  adminModal.classList.remove('active');
});

function renderAdminTable() {
  adminMachinesTable.innerHTML = '';
  machines.forEach(m => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><img src="${safeUrl(m.image)}"></td>
      <td>${esc(m.title)}</td>
      <td>${esc(m.price)}</td>
      <td>${esc(m.phone)}</td>
      <td>
        <button class="btn btn-primary btn-sm" type="button" onclick="editMachine('${esc(m.id)}')"><i class="fa-solid fa-pen"></i></button>
        <button class="btn btn-danger btn-sm" type="button" onclick="deleteMachine('${esc(m.id)}')"><i class="fa-solid fa-trash"></i></button>
      </td>`;
    adminMachinesTable.appendChild(tr);
  });
}

// ضغط الصورة وتحويلها لنص صغير يُحفظ في قاعدة البيانات
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxWidth = 600;
        let w = img.width, h = img.height;
        if (w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth; }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

machineForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = $('machineId').value;
  const data = {
    title: $('machineTitle').value.trim(),
    price: $('machinePrice').value.trim(),
    phone: cleanPhone($('machinePhone').value),
    specs: $('machineSpecs').value.trim()
  };
  const file = $('machineImageFile').files[0];
  const url = $('machineImageUrl').value.trim();

  saveMachineBtn.disabled = true;
  const oldText = saveMachineBtn.innerText;
  saveMachineBtn.innerText = 'جاري الحفظ...';

  try {
    if (file) data.image = await compressImage(file);
    else if (url) data.image = url;
    else data.image = $('machineImage').value || PLACEHOLDER;

    if (id) {
      const old = machines.find(m => m.id === id);
      await setDoc(doc(db, "machines", id), { ...data, createdAt: old?.createdAt || Date.now() });
    } else {
      await addDoc(machinesCol, { ...data, createdAt: Date.now() });
    }
    resetForm();
    alert('تم حفظ ونشر الماكينة بنجاح!');
  } catch (err) {
    console.error(err);
    alert('حدث خطأ أثناء الحفظ. تأكد من تسجيل الدخول ومن إعدادات Firebase.');
  } finally {
    saveMachineBtn.disabled = false;
    saveMachineBtn.innerText = oldText;
  }
});

window.editMachine = function (id) {
  const m = machines.find(x => x.id === id);
  if (!m) return;
  $('machineId').value = m.id;
  $('machineTitle').value = m.title;
  $('machinePrice').value = m.price;
  $('machinePhone').value = m.phone;
  $('machineImage').value = m.image || '';
  $('machineSpecs').value = m.specs;
  $('formTitle').innerText = 'تعديل بيانات الماكينة';
  cancelEditBtn.style.display = 'inline-block';
};

cancelEditBtn.addEventListener('click', resetForm);

function resetForm() {
  machineForm.reset();
  $('machineId').value = '';
  $('machineImage').value = '';
  $('machineImageFile').value = '';
  $('machineImageUrl').value = '';
  $('formTitle').innerText = 'إضافة ماكينة جديدة';
  cancelEditBtn.style.display = 'none';
}

window.deleteMachine = async function (id) {
  if (!confirm('هل أنت متأكد من حذف هذه الماكينة؟')) return;
  try {
    await deleteDoc(doc(db, "machines", id));
  } catch (err) {
    console.error(err);
    alert('تعذر الحذف. تأكد من تسجيل الدخول.');
  }
};
