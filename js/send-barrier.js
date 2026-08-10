// ===== 跨扩展发送屏障协议 v1（Kaleidoscope / SoulLink 共用，两边实现必须保持一致）=====
// 背景：宿主（TauriTavern）的 eventSource.emit 会按注册顺序逐个 await messageSent
// 监听器，主模型请求要等全部监听器 resolve 后才发出。多个扩展各自阻塞发送时，
// 若各跑各的，发送前耗时 = 各 Gate 之和（串行）。本屏障把已注册任务并发执行，
// 耗时 = max(各任务耗时)，并保持「所有注入都在主请求发出前完成」的既有保证。
//
// 协议：
//   getPreSendBarrier()          取全局屏障，不存在或协议不匹配时重建（幂等自愈）
//   barrier.register(name, task) 注册发送前任务；task: (ctx, payload) => Promise<void>
//   barrier.waitAll(ctx, payload, timeoutMs)
//                                并发执行本轮所有任务；同一轮共享同一 Promise
//
// 关键语义：
//   - 轮次签名取 ctx.chat 末条消息（id 优先，否则文本）：宿主串行 emit 下，后一个
//     扩展的监听器总是晚于本轮完成才被调用，同签名直接复用本轮结果，绝不重复执行
//     （否则每次发送都会跑两遍 Gate，重复注入）；
//   - 新签名（新发送产生新消息 → 新 id）开启新轮并替换旧轮；
//   - 任务内部自行处理开关 / 载荷校验 / 超时 / 失败降级；任何失败都不会让
//     waitAll reject（allSettled + 整轮硬截止兜底）；
//   - 屏障挂在 globalThis，宿主重建事件源后由各自看门狗重挂监听器时自动复用；
//   - 调用方必须把全部守卫放进任务（本轮可能由任一扩展的监听器先行启动）。
const SEND_BARRIER_KEY = '__preSendInjectionBarrier__';
const SEND_BARRIER_VERSION = 1;

// 轮次签名：优先消息 ID（TauriTavern / SillyTavern 消息均有），缺失时回退文本。
function computeSendBarrierSignature(ctx) {
  const chat = Array.isArray(ctx?.chat) ? ctx.chat : [];
  const last = chat[chat.length - 1];
  if (!last) return '';
  const id = last.id;
  if (id !== undefined && id !== null && String(id).trim() !== '') return 'id:' + String(id);
  return 'text:' + String(last.mes || '');
}

function getPreSendBarrier() {
  try {
    const existing = globalThis[SEND_BARRIER_KEY];
    if (existing && typeof existing.register === 'function' && typeof existing.waitAll === 'function') {
      return existing;
    }
    const barrier = {
      version: SEND_BARRIER_VERSION,
      tasks: new Map(),
      round: null, // { signature, promise }：完成后的轮次保留，供级联监听器复用
      register(name, task) {
        if (typeof task !== 'function') return;
        this.tasks.set(String(name || 'task'), task);
      },
      waitAll(ctx, payload, timeoutMs) {
        const signature = computeSendBarrierSignature(ctx);
        if (signature === '') return Promise.resolve();
        // 同签名复用本轮（在途或已完成）：宿主逐个 await 监听器，后到的监听器
        // 必然晚于本轮结束，复用结果即可，绝不能重跑一轮造成重复注入。
        if (this.round && this.round.signature === signature) {
          return this.round.promise;
        }
        const names = Array.from(this.tasks.keys());
        const tasks = Array.from(this.tasks.values());
        const startedAt = Date.now();
        console.debug('[SendBarrier] 本轮并发执行 ' + tasks.length + ' 个发送前任务', names);
        let deadlineTimer = null;
        let settle;
        const done = () => {
          if (deadlineTimer) {
            clearTimeout(deadlineTimer);
            deadlineTimer = null;
          }
          console.debug('[SendBarrier] 本轮发送前任务完成', (Date.now() - startedAt) + 'ms', names);
          settle();
        };
        const promise = new Promise((resolve) => { settle = resolve; });
        Promise.allSettled(tasks.map((task) => {
          try {
            return Promise.resolve(task(ctx, payload));
          } catch (error) {
            return Promise.reject(error);
          }
        })).then(done, done);
        const limit = Number(timeoutMs);
        if (limit > 0) {
          deadlineTimer = setTimeout(done, limit);
        }
        this.round = { signature, promise };
        return promise;
      },
    };
    globalThis[SEND_BARRIER_KEY] = barrier;
    return barrier;
  } catch (error) {
    console.warn('[SendBarrier] 屏障不可用，回退为直接阻塞', error);
    return null;
  }
}
