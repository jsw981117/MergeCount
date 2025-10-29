// UI 렌더링 및 입력 처리

const UI = {
  canvas: null,
  ctx: null,

  // 드래그 상태
  dragState: {
    dragging: false,
    objectId: null,
    offsetX: 0,
    offsetY: 0,
    lastX: 0,
    lastY: 0,
    lastTime: 0
  },

  // UI 모드
  showUpgradeMenu: false,
  showSettingsMenu: false,

  // 초기화
  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // 이벤트 리스너 - 전역으로 변경 (캔버스 스케일링 대응)
    document.addEventListener('mousedown', this.onMouseDown.bind(this));
    document.addEventListener('mousemove', this.onMouseMove.bind(this));
    document.addEventListener('mouseup', this.onMouseUp.bind(this));

    // 터치 이벤트
    document.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
    document.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    document.addEventListener('touchend', this.onTouchEnd.bind(this), { passive: false });

    // 버튼 이벤트
    document.getElementById('gachaBtn').addEventListener('click', this.onGachaClick.bind(this));
    document.getElementById('upgradeBtn').addEventListener('click', this.toggleUpgradeMenu.bind(this));
    document.getElementById('closeUpgradeBtn').addEventListener('click', this.toggleUpgradeMenu.bind(this));

    // 설정 버튼
    document.getElementById('settingsBtn').addEventListener('click', this.toggleSettingsMenu.bind(this));
    document.getElementById('closeSettingsBtn').addEventListener('click', this.toggleSettingsMenu.bind(this));
    document.getElementById('resetSettingsBtn').addEventListener('click', this.resetSettings.bind(this));

    // 업그레이드 버튼들
    document.getElementById('upgradeCooldown').addEventListener('click', () => this.onUpgrade('cooldown'));
    document.getElementById('upgradeMoney').addEventListener('click', () => this.onUpgrade('money'));
    document.getElementById('upgradeGacha').addEventListener('click', () => this.onUpgrade('gacha'));

    // 설정 입력 이벤트
    this.initSettingsInputs();
  },

  // 렌더링
  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 전체 배경
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 상단바 영역 (100px)
    this.ctx.fillStyle = '#667eea';
    this.ctx.fillRect(0, 0, this.canvas.width, 100);

    // 게임 영역 배경 (100px ~ 1720px)
    this.ctx.fillStyle = '#2C3E50';
    this.ctx.fillRect(0, 100, this.canvas.width, CONFIG.GAME_AREA_HEIGHT);

    // 하단바 영역 (1720px ~ 1920px)
    this.ctx.fillStyle = '#667eea';
    this.ctx.fillRect(0, CONFIG.CANVAS_HEIGHT - 200, this.canvas.width, 200);

    // 오브젝트 렌더링
    Game.state.objects.forEach(obj => {
      this.drawObject(obj);
    });

    // UI 렌더링
    this.renderUI();

    // 업그레이드 메뉴
    if (this.showUpgradeMenu) {
      this.renderUpgradeMenu();
    }
  },

  // 오브젝트 그리기
  drawObject(obj) {
    const tier = CONFIG.TIERS[obj.tier];
    const size = CONFIG.OBJECT_SIZE / 2;

    this.ctx.save();
    this.ctx.translate(obj.x, obj.y);

    // 도형 그리기
    this.ctx.fillStyle = tier.color;
    this.ctx.strokeStyle = '#FFF';
    this.ctx.lineWidth = 2;

    if (tier.sides === 0) {
      // 원
      this.ctx.beginPath();
      this.ctx.arc(0, 0, size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
    } else {
      // 다각형
      this.ctx.beginPath();
      for (let i = 0; i <= tier.sides; i++) {
        const angle = (i / tier.sides) * Math.PI * 2 - Math.PI / 2;
        const x = Math.cos(angle) * size;
        const y = Math.sin(angle) * size;
        if (i === 0) this.ctx.moveTo(x, y);
        else this.ctx.lineTo(x, y);
      }
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
    }

    // 등급 표시
    this.ctx.fillStyle = '#FFF';
    const fontSize = Math.floor(16 * Settings.values.textScale);
    this.ctx.font = `bold ${fontSize}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(obj.tier + 1, 0, 0);

    this.ctx.restore();
  },

  // UI 요소 렌더링
  renderUI() {
    // 골드 표시 (HTML 요소 업데이트)
    document.getElementById('goldAmount').textContent = Math.floor(Game.state.gold);

    // 뽑기 버튼 비용
    document.getElementById('gachaCost').textContent = CONFIG.GACHA.BASE_COST;
  },

  // 업그레이드 메뉴 렌더링
  renderUpgradeMenu() {
    const types = ['cooldown', 'money', 'gacha'];
    const names = ['쿨타임 감소', '수익 증가', '뽑기 레벨'];

    types.forEach((type, index) => {
      const info = Economy.getUpgradeInfo(type);
      document.getElementById(`${type}Level`).textContent = `Lv.${info.level}`;
      document.getElementById(`${type}Effect`).textContent = info.effect;
      document.getElementById(`${type}Cost`).textContent = info.cost;
    });
  },

  // 마우스/터치 이벤트 처리
  getMousePos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

    // 스케일 비율 계산
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  },

  findObjectAt(x, y) {
    // 역순으로 검색 (위에 있는 오브젝트 우선)
    for (let i = Game.state.objects.length - 1; i >= 0; i--) {
      const obj = Game.state.objects[i];
      const dist = Math.hypot(obj.x - x, obj.y - y);
      if (dist < CONFIG.OBJECT_SIZE / 2) {
        return obj;
      }
    }
    return null;
  },

  onMouseDown(e) {
    // 캔버스 밖 클릭 무시
    const rect = this.canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

    if (clientX < rect.left || clientX > rect.right ||
        clientY < rect.top || clientY > rect.bottom) {
      return;
    }

    const pos = this.getMousePos(e);
    const obj = this.findObjectAt(pos.x, pos.y);

    if (obj) {
      e.preventDefault();
      this.dragState.dragging = true;
      this.dragState.objectId = obj.id;
      this.dragState.offsetX = pos.x - obj.x;
      this.dragState.offsetY = pos.y - obj.y;
      this.dragState.lastX = pos.x;
      this.dragState.lastY = pos.y;
      this.dragState.lastTime = Date.now();

      // 속도 초기화 + 슬립 해제
      obj.vx = 0;
      obj.vy = 0;
      obj.sleeping = false;
    }
  },

  onMouseMove(e) {
    if (!this.dragState.dragging) return;
    e.preventDefault();

    const pos = this.getMousePos(e);
    const obj = Game.state.objects.find(o => o.id === this.dragState.objectId);

    if (obj) {
      obj.x = pos.x - this.dragState.offsetX;
      obj.y = pos.y - this.dragState.offsetY;

      // 게임 영역 안에서만 이동 (상단 100px, 하단 200px 제외)
      const minY = 100 + CONFIG.OBJECT_SIZE / 2;
      const maxY = CONFIG.CANVAS_HEIGHT - 200 - CONFIG.OBJECT_SIZE / 2;

      obj.x = Math.max(CONFIG.OBJECT_SIZE / 2, Math.min(CONFIG.CANVAS_WIDTH - CONFIG.OBJECT_SIZE / 2, obj.x));
      obj.y = Math.max(minY, Math.min(maxY, obj.y));

      // 속도 계산을 위한 위치 추적
      this.dragState.lastX = pos.x;
      this.dragState.lastY = pos.y;
      this.dragState.lastTime = Date.now();

      // 드래그 중 머지 체크
      const target = Physics.checkDragCollision(obj);
      if (target) {
        Game.merge(obj, target);
        this.dragState.dragging = false;
        this.dragState.objectId = null;
      }
    }
  },

  onMouseUp(e) {
    if (!this.dragState.dragging) return;
    e.preventDefault();

    const obj = Game.state.objects.find(o => o.id === this.dragState.objectId);
    if (obj) {
      // 속도 계산
      const now = Date.now();
      const dt = (now - this.dragState.lastTime) / 1000;
      const pos = this.getMousePos(e);

      if (dt > 0) {
        const dx = pos.x - this.dragState.lastX;
        const dy = pos.y - this.dragState.lastY;

        obj.vx = dx / dt;
        obj.vy = dy / dt;

        // 최대 속도 제한
        const speed = Math.hypot(obj.vx, obj.vy);
        if (speed > Physics.MAX_SPEED) {
          obj.vx = (obj.vx / speed) * Physics.MAX_SPEED;
          obj.vy = (obj.vy / speed) * Physics.MAX_SPEED;
        }
      }
    }

    this.dragState.dragging = false;
    this.dragState.objectId = null;
  },

  onTouchStart(e) {
    e.preventDefault();
    this.onMouseDown(e);
  },

  onTouchMove(e) {
    e.preventDefault();
    this.onMouseMove(e);
  },

  onTouchEnd(e) {
    e.preventDefault();
    this.onMouseUp(e);
  },

  // 버튼 이벤트
  onGachaClick() {
    const result = Economy.doGacha();
    if (result.success) {
      console.log(result.message);
    } else {
      alert(result.message);
    }
  },

  toggleUpgradeMenu() {
    this.showUpgradeMenu = !this.showUpgradeMenu;
    document.getElementById('upgradeMenu').style.display = this.showUpgradeMenu ? 'block' : 'none';
  },

  onUpgrade(type) {
    const result = Economy.upgrade(type);
    if (result.success) {
      console.log(result.message);
      this.renderUpgradeMenu();
    } else {
      alert(result.message);
    }
  },

  // 설정 메뉴
  toggleSettingsMenu() {
    this.showSettingsMenu = !this.showSettingsMenu;
    document.getElementById('settingsMenu').style.display = this.showSettingsMenu ? 'block' : 'none';

    if (this.showSettingsMenu) {
      this.updateSettingsDisplay();
    }
  },

  initSettingsInputs() {
    const settings = ['baseIncome', 'tierMultiplier', 'baseCooldown', 'gachaCost', 'objectSize', 'upgradeCostMultiplier', 'textScale'];

    settings.forEach(key => {
      const input = document.getElementById(`setting_${key}`);
      if (input) {
        input.addEventListener('input', (e) => {
          const value = parseFloat(e.target.value);
          if (!isNaN(value) && value > 0) {
            Settings.set(key, value);
          }
        });
      }
    });
  },

  updateSettingsDisplay() {
    Object.keys(Settings.values).forEach(key => {
      const input = document.getElementById(`setting_${key}`);
      if (input) {
        input.value = Settings.values[key];
      }
    });
  },

  resetSettings() {
    if (confirm('모든 설정을 초기화하시겠습니까?')) {
      Settings.reset();
      this.updateSettingsDisplay();
      alert('설정이 초기화되었습니다.');
    }
  }
};
