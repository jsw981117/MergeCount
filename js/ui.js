// UI 렌더링 및 입력 처리

const UI = {
  canvas: null,
  ctx: null,

  // 드래그 상태
  dragState: {
    dragging: false,
    objectId: null,
    offsetX: 0,
    offsetY: 0
  },

  // UI 모드
  showUpgradeMenu: false,

  // 초기화
  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // 이벤트 리스너
    canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    canvas.addEventListener('mouseup', this.onMouseUp.bind(this));

    // 터치 이벤트
    canvas.addEventListener('touchstart', this.onTouchStart.bind(this));
    canvas.addEventListener('touchmove', this.onTouchMove.bind(this));
    canvas.addEventListener('touchend', this.onTouchEnd.bind(this));

    // 버튼 이벤트
    document.getElementById('gachaBtn').addEventListener('click', this.onGachaClick.bind(this));
    document.getElementById('upgradeBtn').addEventListener('click', this.toggleUpgradeMenu.bind(this));
    document.getElementById('closeUpgradeBtn').addEventListener('click', this.toggleUpgradeMenu.bind(this));

    // 업그레이드 버튼들
    document.getElementById('upgradeCooldown').addEventListener('click', () => this.onUpgrade('cooldown'));
    document.getElementById('upgradeMoney').addEventListener('click', () => this.onUpgrade('money'));
    document.getElementById('upgradeGacha').addEventListener('click', () => this.onUpgrade('gacha'));
  },

  // 렌더링
  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 배경
    this.ctx.fillStyle = '#2C3E50';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 게임 영역 배경
    this.ctx.fillStyle = '#34495E';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height - 150);

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
    this.ctx.font = 'bold 16px Arial';
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
    return {
      x: (e.clientX || e.touches[0].clientX) - rect.left,
      y: (e.clientY || e.touches[0].clientY) - rect.top
    };
  },

  findObjectAt(x, y) {
    return Game.state.objects.find(obj => {
      const dist = Math.hypot(obj.x - x, obj.y - y);
      return dist < CONFIG.OBJECT_SIZE / 2;
    });
  },

  onMouseDown(e) {
    const pos = this.getMousePos(e);
    const obj = this.findObjectAt(pos.x, pos.y);

    if (obj) {
      this.dragState.dragging = true;
      this.dragState.objectId = obj.id;
      this.dragState.offsetX = pos.x - obj.x;
      this.dragState.offsetY = pos.y - obj.y;
    }
  },

  onMouseMove(e) {
    if (!this.dragState.dragging) return;

    const pos = this.getMousePos(e);
    const obj = Game.state.objects.find(o => o.id === this.dragState.objectId);

    if (obj) {
      obj.x = pos.x - this.dragState.offsetX;
      obj.y = pos.y - this.dragState.offsetY;

      // 캔버스 밖으로 나가지 않도록
      obj.x = Math.max(CONFIG.OBJECT_SIZE / 2, Math.min(this.canvas.width - CONFIG.OBJECT_SIZE / 2, obj.x));
      obj.y = Math.max(CONFIG.OBJECT_SIZE / 2, Math.min(this.canvas.height - 150 - CONFIG.OBJECT_SIZE / 2, obj.y));
    }
  },

  onMouseUp(e) {
    if (!this.dragState.dragging) return;

    const obj = Game.state.objects.find(o => o.id === this.dragState.objectId);
    if (obj) {
      const target = Game.findMergeTarget(obj);
      if (target) {
        Game.merge(obj, target);
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
  }
};
