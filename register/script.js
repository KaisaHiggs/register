// script.js
const PRICE = 300;
const FLAVORS = ['A', 'B', 'C', 'D', 'E'];

let cart = { A: 0, B: 0, C: 0, D: 0, E: 0 };
let currentStep = 1;
let salesLogs = []; // 全取引ログ
let currentEditLogId = null;

// 初期処理
window.onload = () => {
  renderMenuGrid();
  renderCartStep1();
  renderLogsAndStats();
};

// タブ切り替え
function switchTab(tab) {
  document.getElementById('posView').style.display = tab === 'pos' ? 'block' : 'none';
  document.getElementById('logView').style.display = tab === 'log' ? 'block' : 'none';
  document.getElementById('tabPosBtn').classList.toggle('active', tab === 'pos');
  document.getElementById('tabLogBtn').classList.toggle('active', tab === 'log');
}

// 画面ステップ切り替え
function goToStep(step) {
  currentStep = step;
  [1, 2, 3].forEach(i => {
    document.getElementById(`stepPane${i}`).classList.toggle('active', i === step);
    document.getElementById(`stepBadge${i}`).classList.toggle('active', i <= step);
  });

  if (step === 2) renderStep2();
}

// メニュー生成
function renderMenuGrid() {
  const grid = document.getElementById('menuGrid');
  grid.innerHTML = '';
  FLAVORS.forEach(f => {
    const btn = document.createElement('div');
    btn.className = 'menu-btn';
    btn.onclick = () => { cart[f]++; renderCartStep1(); };
    btn.innerHTML = `<div class="name">味 ${f}</div><div class="price">¥${PRICE}</div>`;
    grid.appendChild(btn);
  });
}

// STEP 1 のカート更新
function changeQty(flavor, delta) {
  cart[flavor] = Math.max(0, cart[flavor] + delta);
  renderCartStep1();
}

function resetCart() {
  FLAVORS.forEach(f => cart[f] = 0);
  renderCartStep1();
}

function renderCartStep1() {
  const list = document.getElementById('step1CartList');
  list.innerHTML = '';
  let totalCount = 0;

  FLAVORS.forEach(f => {
    const qty = cart[f];
    if (qty > 0) {
      totalCount += qty;
      const li = document.createElement('li');
      li.className = 'cart-item-row';
      li.innerHTML = `
        <span>味 ${f} (¥${PRICE * qty})</span>
        <div class="qty-ctrl">
          <button class="btn-qty" onclick="changeQty('${f}', -1)">-</button>
          <span>${qty}</span>
          <button class="btn-qty" onclick="changeQty('${f}', 1)">+</button>
        </div>
      `;
      list.appendChild(li);
    }
  });

  if (totalCount === 0) {
    list.innerHTML = '<li style="color:#999; text-align:center; padding:10px;">商品を選択してください</li>';
  }

  document.getElementById('step1Total').textContent = (totalCount * PRICE).toLocaleString();
  document.getElementById('step1Count').textContent = totalCount;
  document.getElementById('btnToStep2').disabled = totalCount === 0;
}

// STEP 2 画面のセットアップ
function renderStep2() {
  const detail = document.getElementById('step2CartDetail');
  detail.innerHTML = '';
  let total = 0;

  FLAVORS.forEach(f => {
    if (cart[f] > 0) {
      total += cart[f] * PRICE;
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.justifyContent = 'space-between';
      row.style.margin = '4px 0';
      row.innerHTML = `<span>味 ${f} × ${cart[f]}本</span><span>¥${cart[f] * PRICE}</span>`;
      detail.appendChild(row);
    }
  });

  document.getElementById('step2Total').textContent = total.toLocaleString();
  document.getElementById('paidAmount').value = '';
  calculateChange();
}

function setPaid(amount) {
  document.getElementById('paidAmount').value = amount;
  calculateChange();
}

function calculateChange() {
  const total = Object.keys(cart).reduce((sum, f) => sum + cart[f] * PRICE, 0);
  const paidInput = document.getElementById('paidAmount').value;
  const paid = parseInt(paidInput, 10) || 0;
  const change = paid - total;

  const changeDisplay = document.getElementById('changeDisplay');
  const btnComplete = document.getElementById('btnComplete');

  if (paidInput !== '' && change >= 0) {
    changeDisplay.textContent = change.toLocaleString();
    changeDisplay.style.color = '#1565c0';
    btnComplete.disabled = false;
  } else {
    changeDisplay.textContent = change < 0 ? `不足 ¥${Math.abs(change)}` : '0';
    changeDisplay.style.color = change < 0 ? '#d32f2f' : '#333';
    btnComplete.disabled = true;
  }
}

// 決済確定（ログ保存・完了画面移動）
function completePayment() {
  const total = Object.keys(cart).reduce((sum, f) => sum + cart[f] * PRICE, 0);
  const paid = parseInt(document.getElementById('paidAmount').value, 10) || 0;
  const now = new Date();

  const logEntry = {
    id: Date.now(),
    time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    items: { ...cart },
    total: total,
    paid: paid,
    change: paid - total
  };

  salesLogs.unshift(logEntry); // 最新を先頭に追加
  renderLogsAndStats();

  // STEP 3 レシート描画
  document.getElementById('receiptTime').textContent = `日時: ${now.toLocaleDateString()} ${logEntry.time}`;
  const receiptItems = document.getElementById('receiptItems');
  receiptItems.innerHTML = '';
  FLAVORS.forEach(f => {
    if (cart[f] > 0) {
      receiptItems.innerHTML += `<div style="display:flex; justify-content:space-between; margin:2px 0;"><span>味 ${f} × ${cart[f]}</span><span>¥${cart[f] * PRICE}</span></div>`;
    }
  });

  document.getElementById('receiptTotal').textContent = total.toLocaleString();
  document.getElementById('receiptPaid').textContent = paid.toLocaleString();
  document.getElementById('receiptChange').textContent = (paid - total).toLocaleString();

  goToStep(3);
}

function startNewOrder() {
  resetCart();
  goToStep(1);
}

// ログ表示 & 集計計算
function renderLogsAndStats() {
  document.getElementById('logBadge').textContent = salesLogs.length;

  // 味別集計
  let flavorTotals = { A: 0, B: 0, C: 0, D: 0, E: 0 };
  let grandTotalCount = 0;

  salesLogs.forEach(log => {
    FLAVORS.forEach(f => {
      flavorTotals[f] += log.items[f] || 0;
      grandTotalCount += log.items[f] || 0;
    });
  });

  const statsGrid = document.getElementById('statsGrid');
  statsGrid.innerHTML = '';
  FLAVORS.forEach(f => {
    statsGrid.innerHTML += `
      <div class="stat-card">
        <div class="title">味 ${f}</div>
        <div class="val">${flavorTotals[f]} 本</div>
      </div>
    `;
  });

  document.getElementById('grandTotalCount').textContent = grandTotalCount;
  document.getElementById('grandTotalAmount').textContent = (grandTotalCount * PRICE).toLocaleString();

  // ログテーブル描画
  const tbody = document.getElementById('logTableBody');
  tbody.innerHTML = '';

  if (salesLogs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="color:#999; padding:15px;">ログはありません</td></tr>';
    return;
  }

  salesLogs.forEach(log => {
    const summaryStr = FLAVORS
      .filter(f => log.items[f] > 0)
      .map(f => `${f}:${log.items[f]}`)
      .join(', ');
    
    const count = Object.values(log.items).reduce((a, b) => a + b, 0);

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>#${String(log.id).slice(-4)}</td>
      <td>${log.time}</td>
      <td>${summaryStr}</td>
      <td>${count}</td>
      <td>¥${log.total.toLocaleString()}</td>
      <td>
        <button class="btn btn-edit" onclick="openEditModal(${log.id})">修正</button>
        <button class="btn btn-danger" onclick="deleteLog(${log.id})">削除</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ログ削除
function deleteLog(id) {
  if (confirm('この注文ログを削除しますか？（売れ筋や合計金額も再計算されます）')) {
    salesLogs = salesLogs.filter(log => log.id !== id);
    renderLogsAndStats();
  }
}

// モーダル編集
function openEditModal(id) {
  currentEditLogId = id;
  const log = salesLogs.find(l => l.id === id);
  if (!log) return;

  document.getElementById('editLogId').textContent = String(log.id).slice(-4);
  const container = document.getElementById('editItemsContainer');
  container.innerHTML = '';

  FLAVORS.forEach(f => {
    const count = log.items[f] || 0;
    container.innerHTML += `
      <div class="edit-row">
        <span style="font-weight:bold;">味 ${f}</span>
        <input type="number" id="editQty_${f}" value="${count}" min="0" style="width:70px; padding:4px; text-align:right;">
      </div>
    `;
  });

  document.getElementById('editModal').classList.add('open');
}

function closeEditModal() {
  document.getElementById('editModal').classList.remove('open');
}

function saveLogEdit() {
  const log = salesLogs.find(l => l.id === currentEditLogId);
  if (!log) return;

  let newTotalCount = 0;
  FLAVORS.forEach(f => {
    const val = parseInt(document.getElementById(`editQty_${f}`).value, 10) || 0;
    log.items[f] = val;
    newTotalCount += val;
  });

  log.total = newTotalCount * PRICE;
  log.change = log.paid - log.total;

  closeEditModal();
  renderLogsAndStats();
}