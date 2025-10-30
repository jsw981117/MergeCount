// 게임 상태 및 로직 관리

const Game = {
  state: {
    gold: 0,
    objects: [], // { id, tier, x, y, lastIncome }
    upgrades: {
      cooldown: 0,
      money: 0,
      gacha: 0
    }
  },

  nextObjectId: 0,

  // 게임 초기화
  init() {
    // 저장된 데이터 불러오기
    const savedData = Storage.load();

    if (savedData) {
      this.state.gold = savedData.gold;
      this.state.upgrades = savedData.upgrades;
      this.state.objects = savedData.objects.map(obj => ({
        ...obj,
        lastIncome: Date.now()
      }));
      this.nextObjectId = Math.max(...this.state.objects.map(o => o.id), 0) + 1;

      // 오프라인 수익 알림
      if (savedData.offlineIncome > 0) {
        console.log(`오프라인 수익: ${savedData.offlineIncome} 골드`);
      }
    } else {
      // 초기 상태
      this.state.gold = CONFIG.INITIAL_STATE.gold;
      this.state.upgrades = { ...CONFIG.INITIAL_STATE.upgrades };
      this.state.objects = [];
    }
  },

  // 오브젝트 추가
  addObject(tier, x = null, y = null) {
    // 랜덤 위치 (x, y가 null인 경우)
    if (x === null || y === null) {
      x = Math.random() * (CONFIG.CANVAS_WIDTH - CONFIG.OBJECT_SIZE * 2) + CONFIG.OBJECT_SIZE;
      y = Math.random() * (CONFIG.CANVAS_HEIGHT - 200 - CONFIG.OBJECT_SIZE * 2) + CONFIG.OBJECT_SIZE;
    }

    // 소환 위치 근처의 오브젝트 밀어내기
    const pushRadius = CONFIG.OBJECT_SIZE * 0.8; // 충돌 감지 범위
    this.state.objects.forEach(existingObj => {
      const dx = existingObj.x - x;
      const dy = existingObj.y - y;
      const dist = Math.hypot(dx, dy);

      if (dist < pushRadius && dist > 0) {
        // 밀어내기
        const angle = Math.atan2(dy, dx);
        const pushForce = 400; // 밀어내는 힘

        existingObj.vx += Math.cos(angle) * pushForce;
        existingObj.vy += Math.sin(angle) * pushForce;

        // 최대 속도 제한 (Physics.MAX_SPEED와 동일)
        const speed = Math.hypot(existingObj.vx, existingObj.vy);
        const maxSpeed = 800;
        if (speed > maxSpeed) {
          existingObj.vx = (existingObj.vx / speed) * maxSpeed;
          existingObj.vy = (existingObj.vy / speed) * maxSpeed;
        }

        existingObj.sleeping = false;
      }
    });

    const obj = {
      id: this.nextObjectId++,
      tier: tier,
      x: x,
      y: y,
      vx: 0,           // 속도 X
      vy: 0,           // 속도 Y
      sleeping: false, // 정지 상태
      lastIncome: Date.now()
    };

    this.state.objects.push(obj);
    return obj;
  },

  // 오브젝트 제거
  removeObject(id) {
    const index = this.state.objects.findIndex(obj => obj.id === id);
    if (index !== -1) {
      this.state.objects.splice(index, 1);
    }
  },

  // 머지 가능 여부 확인
  canMerge(obj1, obj2) {
    if (!obj1 || !obj2) return false;
    if (obj1.id === obj2.id) return false;
    if (obj1.tier !== obj2.tier) return false;
    if (obj1.tier >= CONFIG.TIERS.length - 1) return false; // 최대 등급

    // 거리 체크
    const dist = Math.hypot(obj1.x - obj2.x, obj1.y - obj2.y);
    return dist < CONFIG.OBJECT_SIZE * 2;
  },

  // 머지 실행
  merge(obj1, obj2) {
    if (!this.canMerge(obj1, obj2)) return null;

    // 중간 위치 계산
    const newX = (obj1.x + obj2.x) / 2;
    const newY = (obj1.y + obj2.y) / 2;
    const newTier = obj1.tier + 1;

    // 기존 오브젝트 제거
    this.removeObject(obj1.id);
    this.removeObject(obj2.id);

    // 새 오브젝트 생성
    return this.addObject(newTier, newX, newY);
  },

  // 충돌 감지 (드래그 중인 오브젝트와 다른 오브젝트)
  findMergeTarget(draggedObj) {
    return this.state.objects.find(obj => {
      if (obj.id === draggedObj.id) return false;
      if (obj.tier !== draggedObj.tier) return false;
      const dist = Math.hypot(obj.x - draggedObj.x, obj.y - draggedObj.y);
      return dist < CONFIG.OBJECT_SIZE * 1.5;
    });
  },

  // 골드 추가
  addGold(amount) {
    this.state.gold += amount;
  },

  // 골드 사용
  spendGold(amount) {
    if (this.state.gold >= amount) {
      this.state.gold -= amount;
      return true;
    }
    return false;
  },

  // 게임 저장
  save() {
    Storage.save(this.state);
  },

  // 업데이트 (매 프레임)
  update(deltaTime) {
    // 자동 저장 (5초마다)
    if (!this.lastSaveTime) this.lastSaveTime = Date.now();
    if (Date.now() - this.lastSaveTime > 5000) {
      this.save();
      this.lastSaveTime = Date.now();
    }
  }
};
