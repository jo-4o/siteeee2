const seedGames = [
  {id: 1, name: 'Cyber Neon Protocol', platform: 'PS5', category: 'Ação', condition: 'Novo', price: 249.9, stock: 5, icon: 'CNP'},
  {id: 2, name: 'Circuit Breakers', platform: 'PC', category: 'Corrida', condition: 'Novo', price: 89.9, stock: 8, icon: 'CB'},
  {id: 3, name: 'Moon Harbor: Cyber', platform: 'Switch', category: 'Aventura', condition: 'Usado', price: 119.9, stock: 2, icon: 'MHC'},
  {id: 4, name: 'Arcade Archive 92', platform: 'Retro', category: 'RPG', condition: 'Usado', price: 69.9, stock: 3, icon: 'AA'},
  {id: 5, name: 'Crystal Drift X', platform: 'Xbox', category: 'Esporte', condition: 'Novo', price: 199.9, stock: 4, icon: 'CDX'},
];

const read = (key, fallback) => { try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; } catch { return fallback; } };
const write = (key, value) => { localStorage.setItem(key, JSON.stringify(value)); };
const money = value => Number(value).toLocaleString('pt-BR', {style:'currency', currency:'BRL'});

let state = {
  user: read('fg_user', null),
  games: read('fg_games', seedGames),
  cart: read('fg_cart', []),
  orders: read('fg_orders', []),
  view: 'store',
  platformFilter: 'Todos',
  categoryFilter: 'Todos',
  adminForm: { name: '', platform: 'PS5', category: 'Ação', condition: 'Novo', price: '', stock: '1', icon: 'NOVO', image: '' },
  cartForm: { address: '', phone: '' },
  loginForm: { mode: 'client', name: '', email: '', password: '', error: '' }
};

function setState(updates) {
  state = { ...state, ...updates };
  write('fg_user', state.user);
  write('fg_games', state.games);
  write('fg_cart', state.cart);
  write('fg_orders', state.orders);
  render();
}

function showNotice(msg) {
  const old = document.getElementById('notice-msg');
  if (old) old.remove();
  const notice = document.createElement('div');
  notice.id = 'notice-msg';
  notice.className = 'notice';
  notice.textContent = msg;
  document.body.appendChild(notice);
  setTimeout(() => { if(notice.parentElement) notice.remove(); }, 3000);
}

const root = document.getElementById('root');

function render() {
  if (!state.user) {
    renderLogin();
  } else {
    root.innerHTML = '';
    root.appendChild(createHeader());
    const main = document.createElement('main');
    if (state.view === 'store') main.appendChild(createStore());
    if (state.view === 'cart') main.appendChild(createCart());
    if (state.view === 'admin' && state.user.role === 'admin') main.appendChild(createAdmin());
    if (state.view === 'sales' && state.user.role === 'admin') main.appendChild(createSales());
    root.appendChild(main);
  }
}

// ---------------- LOGIN ----------------
function renderLogin() {
  const form = state.loginForm;
  root.innerHTML = `
    <div class="login">
      <div class="loginart">
        <p>FOZGAMES</p>
        <h1>A NOVA ERA<br/><em>CYBER GAMER.</em></h1>
        <span>Sua loja de jogos local<br/>agora no ciberespaço</span>
      </div>
      <form id="login-form">
        <div class="loginbrand">FG <b>FOZGAMES</b></div>
        <p class="kicker">BOAS-VINDAS, JOGADOR</p>
        <h2>${form.mode === 'admin' ? 'Acesso ao Sistema (Admin)' : 'Faça o link de conexão'}</h2>
        
        <div class="switch">
          <button type="button" class="${form.mode === 'client' ? 'on' : ''}" id="btn-mode-client">Jogador</button>
          <button type="button" class="${form.mode === 'admin' ? 'on' : ''}" id="btn-mode-admin">Admin</button>
        </div>

        ${form.mode === 'client' ? `<input id="log-name" placeholder="Seu nome (Nickname)" value="${form.name}"/>` : ''}
        <input id="log-email" type="email" placeholder="E-mail" value="${form.email}"/>
        ${form.mode === 'admin' ? `<input id="log-pass" type="password" placeholder="Senha de acesso" value="${form.password}"/>` : ''}
        
        ${form.error ? `<p class="error">${form.error}</p>` : ''}
        
        <button class="action" type="submit">${form.mode === 'admin' ? 'INICIAR SISTEMA' : 'START'}</button>
        ${form.mode === 'admin' ? `<small class="help">Credenciais: admin@fozgames.com / admin123</small>` : ''}
      </form>
    </div>
  `;

  document.getElementById('btn-mode-client').onclick = () => setState({ loginForm: { ...form, mode: 'client', error: '' } });
  document.getElementById('btn-mode-admin').onclick = () => setState({ loginForm: { ...form, mode: 'admin', error: '' } });

  const updateInput = (id, field) => {
    const el = document.getElementById(id);
    if(el) el.oninput = (e) => state.loginForm[field] = e.target.value;
  };
  updateInput('log-name', 'name');
  updateInput('log-email', 'email');
  updateInput('log-pass', 'password');

  document.getElementById('login-form').onsubmit = (e) => {
    e.preventDefault();
    if (form.mode === 'admin' && (form.email !== 'admin@fozgames.com' || form.password !== 'admin123')) {
      setState({ loginForm: { ...form, error: 'Credenciais negadas pelo sistema.' } });
      return;
    }
    if (form.mode === 'client' && (!form.name.trim() || !form.email.trim())) {
      setState({ loginForm: { ...form, error: 'Nickname e e-mail são obrigatórios para jogar.' } });
      return;
    }
    setState({
      user: {
        name: form.mode === 'admin' ? 'Administrador Supremo' : form.name,
        email: form.email,
        role: form.mode
      },
      loginForm: { mode: 'client', name: '', email: '', password: '', error: '' }
    });
  };
}

// ---------------- HEADER ----------------
function createHeader() {
  const header = document.createElement('header');
  const cartCount = state.cart.reduce((sum, item) => sum + item.qty, 0);
  
  header.innerHTML = `
    <button class="wordmark" id="nav-brand"><span>FG</span><b>FOZ<span>GAMES</span></b></button>
    <nav>
      <button class="${state.view === 'store' ? 'on' : ''}" id="nav-store">Explorar</button>
      <button class="${state.view === 'cart' ? 'on' : ''}" id="nav-cart">Carrinho <i>${cartCount}</i></button>
      ${state.user.role === 'admin' ? `
        <button class="${state.view === 'admin' ? 'on' : ''}" id="nav-admin">Estoque</button>
        <button class="${state.view === 'sales' ? 'on' : ''}" id="nav-sales">Pedidos</button>
      ` : ''}
      <button class="profile">
        <strong>${state.user.name.slice(0,1).toUpperCase()}</strong>
        ${state.user.name}
        <small>${state.user.role === 'admin' ? 'Administrador' : 'Jogador'}</small>
      </button>
      <button class="signout" id="nav-logout">Sair do Sistema</button>
    </nav>
  `;
  
  header.querySelector('#nav-brand').onclick = () => setState({view: 'store'});
  header.querySelector('#nav-store').onclick = () => setState({view: 'store'});
  header.querySelector('#nav-cart').onclick = () => setState({view: 'cart'});
  if (state.user.role === 'admin') {
    header.querySelector('#nav-admin').onclick = () => setState({view: 'admin'});
    header.querySelector('#nav-sales').onclick = () => setState({view: 'sales'});
  }
  header.querySelector('#nav-logout').onclick = () => {
    setState({ user: null, cart: [], view: 'store' });
  };
  return header;
}

// ---------------- STORE ----------------
function createStore() {
  const sec = document.createElement('section');
  sec.className = 'container store';
  
  const platforms = ['Todos', 'PS5', 'PC', 'Switch', 'Xbox', 'Retro'];
  const categories = ['Todos', 'Ação', 'Corrida', 'Aventura', 'RPG', 'Esporte'];
  
  const filtered = state.games.filter(g => 
    (state.platformFilter === 'Todos' || g.platform === state.platformFilter) &&
    (state.categoryFilter === 'Todos' || g.category === state.categoryFilter)
  );

  sec.innerHTML = `
    <div class="hero">
      <div>
        <p>FOZGAMES / CATÁLOGO</p>
        <h1>Equipe-se.<br/><em>Domine.</em></h1>
      </div>
      <span>O melhor arsenal para sua próxima aventura.</span>
    </div>
    <div class="filterbar">
      <div>
        <label>Plataforma</label>
        <div id="filter-platforms">
          ${platforms.map(p => `<button class="${state.platformFilter === p ? 'picked' : ''}" data-val="${p}">${p}</button>`).join('')}
        </div>
      </div>
      <div>
        <label>Gênero</label>
        <div id="filter-categories">
          ${categories.map(c => `<button class="${state.categoryFilter === c ? 'picked' : ''}" data-val="${c}">${c}</button>`).join('')}
        </div>
      </div>
    </div>
    <div class="results">
      <span>${filtered.length} jogos carregados no radar</span>
      <b>Novos drops toda semana</b>
    </div>
    <div class="grid" id="store-grid"></div>
  `;

  sec.querySelectorAll('#filter-platforms button').forEach(btn => {
    btn.onclick = () => setState({ platformFilter: btn.getAttribute('data-val') });
  });
  sec.querySelectorAll('#filter-categories button').forEach(btn => {
    btn.onclick = () => setState({ categoryFilter: btn.getAttribute('data-val') });
  });

  const grid = sec.querySelector('#store-grid');
  filtered.forEach(game => {
    const article = document.createElement('article');
    article.className = 'tile';
    article.innerHTML = `
      <div class="cover">
        ${game.image ? `<img src="${game.image}" alt="Capa de ${game.name}"/>` : `<span>${game.icon}</span>`}
        <small>${game.platform}</small>
      </div>
      <div class="tilecopy">
        <p>${game.category} / ${game.condition}</p>
        <h2>${game.name}</h2>
        <span>${game.stock} em estoque no momento</span>
        <strong>${money(game.price)}</strong>
        <button id="add-${game.id}">ADICIONAR +</button>
      </div>
    `;
    article.querySelector(`#add-${game.id}`).onclick = () => {
      let cart = [...state.cart];
      const idx = cart.findIndex(i => i.id === game.id);
      if (idx > -1) {
        cart[idx].qty = Math.min(cart[idx].qty + 1, game.stock);
      } else {
        cart.push({...game, qty: 1});
      }
      setState({cart});
      showNotice('Item adicionado ao seu inventário.');
    };
    grid.appendChild(article);
  });

  return sec;
}

// ---------------- CART ----------------
function createCart() {
  const sec = document.createElement('section');
  sec.className = 'container bag';
  
  const cartTotal = state.cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  if (state.cart.length === 0) {
    sec.innerHTML = `
      <p class="kicker">SEU INVENTÁRIO (CARRINHO)</p>
      <h1>Quase pronto.</h1>
      <div class="empty">
        <h2>Seu inventário está vazio.</h2>
        <button id="btn-back-store">Voltar para o catálogo</button>
      </div>
    `;
    setTimeout(() => { document.getElementById('btn-back-store').onclick = () => setState({view:'store'}); }, 0);
    return sec;
  }

  sec.innerHTML = `
    <p class="kicker">SEU INVENTÁRIO (CARRINHO)</p>
    <h1>Quase pronto.</h1>
    <div class="baglist" id="bag-list"></div>
    <div class="checkout">
      <h2>Total dos Créditos <b>${money(cartTotal)}</b></h2>
      <div class="fields">
        <input id="chk-address" placeholder="Coordenadas para entrega ou retirada" value="${state.cartForm.address}"/>
        <input id="chk-phone" placeholder="Frequência de contato (Telefone)" value="${state.cartForm.phone}"/>
      </div>
      <button class="action" id="btn-finish">CONFIRMAR MISSÃO (RESERVAR)</button>
      <small>Nenhuma transação online requerida agora. Usaremos os dados para combinar a entrega.</small>
    </div>
  `;

  const list = sec.querySelector('#bag-list');
  state.cart.forEach(item => {
    const row = document.createElement('div');
    row.className = 'bagitem';
    row.innerHTML = `
      <div class="minicard">${item.image ? `<img src="${item.image}"/>` : item.icon}</div>
      <div>
        <b>${item.name}</b>
        <small>${item.platform} / ${item.condition}</small>
        <div class="stepper">
          <button class="btn-sub">-</button> ${item.qty} <button class="btn-add">+</button>
        </div>
      </div>
      <strong>${money(item.price * item.qty)}</strong>
      <button class="remove">Remover item</button>
    `;
    row.querySelector('.btn-sub').onclick = () => {
      setState({cart: state.cart.map(x => x.id === item.id ? {...x, qty: Math.max(1, Math.min(x.qty-1, x.stock))} : x)});
    };
    row.querySelector('.btn-add').onclick = () => {
      setState({cart: state.cart.map(x => x.id === item.id ? {...x, qty: Math.max(1, Math.min(x.qty+1, x.stock))} : x)});
    };
    row.querySelector('.remove').onclick = () => {
      setState({cart: state.cart.filter(x => x.id !== item.id)});
    };
    list.appendChild(row);
  });

  const address = sec.querySelector('#chk-address');
  const phone = sec.querySelector('#chk-phone');
  address.oninput = (e) => state.cartForm.address = e.target.value;
  phone.oninput = (e) => state.cartForm.phone = e.target.value;

  sec.querySelector('#btn-finish').onclick = () => {
    if (!state.cartForm.address.trim() || !state.cartForm.phone.trim()) {
      showNotice('Informe as coordenadas (Endereço) e contato (Telefone).');
      return;
    }
    const order = {
      id: Date.now(),
      number: \`FG-\${String(Date.now()).slice(-5)}\`,
      customer: state.user.name,
      email: state.user.email,
      address: state.cartForm.address,
      phone: state.cartForm.phone,
      date: new Date().toLocaleString('pt-BR'),
      items: state.cart,
      total: cartTotal
    };
    setState({
      orders: [order, ...state.orders],
      cart: [],
      cartForm: {address:'', phone:''},
      view: 'store'
    });
    showNotice(\`Missão cumprida! Pedido \${order.number} reservado.\`);
  };

  return sec;
}

// ---------------- ADMIN ----------------
function createAdmin() {
  const sec = document.createElement('section');
  sec.className = 'container admin';
  const form = state.adminForm;
  
  sec.innerHTML = `
    <p class="kicker">ADMIN / ARSENAL DA LOJA</p>
    <h1>Estoque Central.</h1>
    <div class="adminlayout">
      <form id="add-game-form">
        <h2>Adicionar Novo Jogo</h2>
        <input id="frm-name" placeholder="Nome do jogo" value="${form.name}"/>
        <input id="frm-icon" placeholder="TAG da capa (máx 4)" maxlength="4" value="${form.icon}"/>
        
        <label class="upload">
          ${form.image ? `<img src="${form.image}" alt="Prévia"/>` : `<span>Enviar arte da capa<br/><small>JPG, PNG, WEBP - max 1.5MB</small></span>`}
          <input type="file" id="frm-img" accept="image/png,image/jpeg,image/webp"/>
        </label>
        
        <div class="pair">
          <select id="frm-plat">
            ${['PS5','PC','Switch','Xbox','Retro'].map(x => `<option ${form.platform===x?'selected':''}>${x}</option>`).join('')}
          </select>
          <select id="frm-cat">
            ${['Ação','Corrida','Aventura','RPG','Esporte'].map(x => `<option ${form.category===x?'selected':''}>${x}</option>`).join('')}
          </select>
        </div>
        
        <div class="pair">
          <select id="frm-cond">
            <option ${form.condition==='Novo'?'selected':''}>Novo</option>
            <option ${form.condition==='Usado'?'selected':''}>Usado</option>
          </select>
          <input type="number" min="1" id="frm-stock" value="${form.stock}" placeholder="Qtd. Estoque"/>
        </div>
        
        <input type="number" step="0.01" id="frm-price" placeholder="Preço (R$)" value="${form.price}"/>
        <button class="action" type="submit">CADASTRAR NO ARSENAL</button>
      </form>
      
      <div class="inventory">
        <h2>Estoque Atual <span>${state.games.length} itens</span></h2>
        <div id="inventory-list"></div>
      </div>
    </div>
  `;

  // Bind forms
  const updateF = (id, field) => {
    const el = sec.querySelector('#'+id);
    if(el) el.onchange = el.oninput = (e) => state.adminForm[field] = e.target.value.toUpperCase && id==='frm-icon' ? e.target.value.toUpperCase() : e.target.value;
  };
  updateF('frm-name', 'name');
  updateF('frm-icon', 'icon');
  updateF('frm-plat', 'platform');
  updateF('frm-cat', 'category');
  updateF('frm-cond', 'condition');
  updateF('frm-stock', 'stock');
  updateF('frm-price', 'price');

  sec.querySelector('#frm-img').onchange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1500000) {
      showNotice('A arte excede o limite de memória (1.5 MB).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setState({ adminForm: { ...state.adminForm, image: reader.result } });
    reader.readAsDataURL(file);
  };

  sec.querySelector('#add-game-form').onsubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.price) return;
    setState({
      games: [...state.games, {
        ...form,
        id: Date.now(),
        price: Number(form.price),
        stock: Number(form.stock)
      }],
      adminForm: { ...form, name: '', price: '', image: '', icon: 'NOVO' }
    });
    showNotice('Novo jogo adicionado ao banco de dados.');
  };

  const invList = sec.querySelector('#inventory-list');
  state.games.forEach(game => {
    const row = document.createElement('div');
    row.innerHTML = `
      ${game.image ? `<img src="${game.image}"/>` : `<i>${game.icon}</i>`}
      <b>${game.name}<small>${game.platform} / ${game.category} / ${game.condition}</small></b>
      <em>${money(game.price)}</em>
      <button>✖</button>
    `;
    row.querySelector('button').onclick = () => {
      setState({ games: state.games.filter(g => g.id !== game.id) });
    };
    invList.appendChild(row);
  });

  return sec;
}

// ---------------- SALES ----------------
function createSales() {
  const sec = document.createElement('section');
  sec.className = 'container admin';
  const total = state.orders.reduce((sum, order) => sum + order.total, 0);

  if (!state.orders.length) {
    sec.innerHTML = `
      <p class="kicker">ADMIN / INTELIGÊNCIA DE PEDIDOS</p>
      <h1>Pedidos Registrados.</h1>
      <div class="statrow">
        <div><small>PEDIDOS TOTAIS</small><b>0</b></div>
        <div><small>LUCRO BRUTO</small><b>${money(0)}</b></div>
      </div>
      <div class="empty">
        <h2>O painel de pedidos está vazio.</h2>
        <p>Aguarde os jogadores concluírem suas missões (reservas).</p>
      </div>
    `;
    return sec;
  }

  sec.innerHTML = `
    <p class="kicker">ADMIN / INTELIGÊNCIA DE PEDIDOS</p>
    <h1>Pedidos Registrados.</h1>
    <div class="statrow">
      <div><small>PEDIDOS TOTAIS</small><b>${state.orders.length}</b></div>
      <div><small>LUCRO BRUTO ESTIMADO</small><b>${money(total)}</b></div>
    </div>
    <div class="orders" id="orders-list"></div>
  `;

  const list = sec.querySelector('#orders-list');
  state.orders.forEach(order => {
    const article = document.createElement('article');
    article.innerHTML = `
      <header>
        <b>${order.number}</b>
        <span>${order.date}</span>
        <strong>${money(order.total)}</strong>
      </header>
      <div>
        <p>
          <small>INFORMAÇÕES DO JOGADOR</small>
          ${order.customer}<br/>
          ${order.email}<br/>
          ${order.phone}<br/>
          ${order.address}
        </p>
        <p>
          <small>ITENS SOLICITADOS</small>
          ${order.items.map(item => `<span>${item.qty}x ${item.name} - ${money(item.price * item.qty)}<br/></span>`).join('')}
        </p>
      </div>
    `;
    list.appendChild(article);
  });

  return sec;
}

// Inicialização
render();
