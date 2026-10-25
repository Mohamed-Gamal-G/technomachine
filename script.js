// البيانات المبدئية للماكينات
const defaultMachines = [
  {
    id: "1",
    title: "ماكينة قص بالليزر ألياف (Fiber Laser) 3000W",
    price: "450,000 ج.م",
    phone: "201000000000",
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80",
    specs: "قدرة 3000 واط، سرعة قطع عالية للمستندات والحديد حتى 20 مم، نظام تبريد مائي متطور."
  },
  {
    id: "2",
    title: "ماكينة CNC حفر خشب وألومنيوم 3 محاور",
    price: "180,000 ج.م",
    phone: "201000000000",
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80",
    specs: "مساحة عمل 130×250 سم، سبندل 4.5 كيلو واط، تحكم الكمبيوتر بالكامل."
  }
];

// حالات النظام
let machines = JSON.parse(localStorage.getItem('machinery_catalog')) || defaultMachines;
let isLoggedIn = sessionStorage.getItem('admin_logged_in') === 'true';

// Elements
const machinesGrid = document.getElementById('machinesGrid');
const machineCount = document.getElementById('machineCount');
const searchInput = document.getElementById('searchInput');

const navAdminBtn = document.getElementById('navAdminBtn');
const adminBtnText = document.getElementById('adminBtnText');

const loginModal = document.getElementById('loginModal');
const closeLoginModal = document.getElementById('closeLoginModal');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');

const adminModal = document.getElementById('adminModal');
const closeAdminModal = document.getElementById('closeAdminModal');
const logoutBtn = document.getElementById('logoutBtn');
const machineForm = document.getElementById('machineForm');
const adminMachinesTable = document.getElementById('adminMachinesTable');

const specModal = document.getElementById('specModal');
const closeSpecModal = document.getElementById('closeSpecModal');
const specModalContent = document.getElementById('specModalContent');

// 1. Render Catalog & Search Filter
function renderCatalog(filterText = '') {
  machinesGrid.innerHTML = '';
  const filtered = machines.filter(m => 
    m.title.toLowerCase().includes(filterText.toLowerCase()) || 
    m.specs.toLowerCase().includes(filterText.toLowerCase())
  );

  machineCount.innerText = filtered.length;

  filtered.forEach(m => {
    const card = document.createElement('div');
    card.className = 'machine-card';
    const whatsappMsg = encodeURIComponent(`مرحباً، أود الاستفسار عن ${m.title} بسعر ${m.price}`);
    
    card.innerHTML = `
      <div class="machine-img-wrapper">
        <img src="${m.image || 'https://via.placeholder.com/600x400?text=Machinery'}" alt="${m.title}">
      </div>
      <div class="machine-info">
        <h3 class="machine-title">${m.title}</h3>
        <div class="machine-price">${m.price}</div>
        <p class="machine-specs-preview">${m.specs.substring(0, 75)}...</p>
        <div class="card-actions">
          <button class="btn btn-secondary btn-sm" type="button" onclick="openSpecs('${m.id}')">التفاصيل</button>
          <a href="https://wa.me/${m.phone}?text=${whatsappMsg}" target="_blank" class="btn btn-success btn-sm">
            <i class="fa-brands fa-whatsapp"></i> طلب الماكينة
          </a>
        </div>
      </div>
    `;
    machinesGrid.appendChild(card);
  });
}

searchInput.addEventListener('input', (e) => {
  renderCatalog(e.target.value.trim());
});

// 2. Open Specs Modal
window.openSpecs = function(id) {
  const m = machines.find(x => x.id === id);
  if(!m) return;
  const whatsappMsg = encodeURIComponent(`مرحباً، أود الاستفسار عن ${m.title} بسعر ${m.price}`);
  
  specModalContent.innerHTML = `
    <h2>${m.title}</h2>
    <img src="${m.image}" style="width:100%; max-height:280px; object-fit:cover; border-radius:8px; margin:1rem 0;" />
    <h3 style="color:var(--accent-amber); margin-bottom:10px;">السعر: ${m.price}</h3>
    <p><strong>المواصفات الفنية:</strong></p>
    <p style="white-space:pre-line; margin-bottom:1.5rem; color:var(--text-muted);">${m.specs}</p>
    <a href="https://wa.me/${m.phone}?text=${whatsappMsg}" target="_blank" class="btn btn-success btn-block">
      <i class="fa-brands fa-whatsapp"></i> تواصل للطلب عبر الواتساب
    </a>
  `;
  specModal.classList.add('active');
};

// 3. Admin Login Logic
navAdminBtn.addEventListener('click', () => {
  if (isLoggedIn) {
    openAdminDashboard();
  } else {
    loginModal.classList.add('active');
  }
});

closeLoginModal.addEventListener('click', () => loginModal.classList.remove('active'));
closeAdminModal.addEventListener('click', () => adminModal.classList.remove('active'));
closeSpecModal.addEventListener('click', () => specModal.classList.remove('active'));

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const user = document.getElementById('username').value.trim();
  const pass = document.getElementById('password').value.trim();

  if (user === 'ahmed' && pass === 'ahmed12#') {
    isLoggedIn = true;
    sessionStorage.setItem('admin_logged_in', 'true');
    loginError.style.display = 'none';
    loginModal.classList.remove('active');
    loginForm.reset();
    openAdminDashboard();
  } else {
    loginError.style.display = 'block';
  }
});

function openAdminDashboard() {
  renderAdminTable();
  adminModal.classList.add('active');
}

logoutBtn.addEventListener('click', () => {
  isLoggedIn = false;
  sessionStorage.removeItem('admin_logged_in');
  adminModal.classList.remove('active');
});

function renderAdminTable() {
  adminMachinesTable.innerHTML = '';
  machines.forEach(m => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><img src="${m.image}"></td>
      <td>${m.title}</td>
      <td>${m.price}</td>
      <td>${m.phone}</td>
      <td>
        <button class="btn btn-primary btn-sm" type="button" onclick="editMachine('${m.id}')"><i class="fa-solid fa-pen"></i></button>
        <button class="btn btn-danger btn-sm" type="button" onclick="deleteMachine('${m.id}')"><i class="fa-solid fa-trash"></i></button>
      </td>
    `;
    adminMachinesTable.appendChild(tr);
  });
}

// 4. Save & Compress Machine Image
function compressAndSaveImage(file, callback) {
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.src = e.target.result;
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const maxWidth = 600;
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      canvas.width = width; canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      callback(canvas.toDataURL('image/jpeg', 0.7));
    };
  };
  reader.readAsDataURL(file);
}

machineForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const id = document.getElementById('machineId').value;
  const title = document.getElementById('machineTitle').value;
  const price = document.getElementById('machinePrice').value;
  const phone = document.getElementById('machinePhone').value;
  const specs = document.getElementById('machineSpecs').value;
  
  const imageFileInput = document.getElementById('machineImageFile');
  const imageUrlInput = document.getElementById('machineImageUrl');
  let currentImage = document.getElementById('machineImage').value || 'https://via.placeholder.com/600x400';

  if (imageFileInput.files && imageFileInput.files[0]) {
    compressAndSaveImage(imageFileInput.files[0], function(compressedBase64) {
      saveMachineData(id, title, price, phone, compressedBase64, specs);
    });
  } else if (imageUrlInput.value.trim() !== '') {
    saveMachineData(id, title, price, phone, imageUrlInput.value.trim(), specs);
  } else {
    saveMachineData(id, title, price, phone, currentImage, specs);
  }
});

function saveMachineData(id, title, price, phone, image, specs) {
  if (id) {
    const index = machines.findIndex(m => m.id === id);
    if(index !== -1) machines[index] = { id, title, price, phone, image, specs };
  } else {
    machines.push({ id: Date.now().toString(), title, price, phone, image, specs });
  }
  saveAndRefresh();
  resetForm();
}

window.editMachine = function(id) {
  const m = machines.find(x => x.id === id);
  if(!m) return;
  document.getElementById('machineId').value = m.id;
  document.getElementById('machineTitle').value = m.title;
  document.getElementById('machinePrice').value = m.price;
  document.getElementById('machinePhone').value = m.phone;
  document.getElementById('machineImage').value = m.image;
  document.getElementById('machineSpecs').value = m.specs;
  document.getElementById('formTitle').innerText = 'تعديل بيانات الماكينة';
  document.getElementById('cancelEditBtn').style.display = 'inline-block';
};

document.getElementById('cancelEditBtn').addEventListener('click', resetForm);

function resetForm() {
  machineForm.reset();
  document.getElementById('machineId').value = '';
  document.getElementById('machineImageFile').value = '';
  document.getElementById('machineImageUrl').value = '';
  document.getElementById('formTitle').innerText = 'إضافة ماكينة جديدة';
  document.getElementById('cancelEditBtn').style.display = 'none';
}

window.deleteMachine = function(id) {
  if (confirm('هل أنت تأكد من حذف هذه الماكينة؟')) {
    machines = machines.filter(m => m.id !== id);
    saveAndRefresh();
  }
};

function saveAndRefresh() {
  localStorage.setItem('machinery_catalog', JSON.stringify(machines));
  renderCatalog(searchInput.value.trim());
  renderAdminTable();
}

// Initialize
renderCatalog();