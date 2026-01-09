# 钱包连接改进说明

## 改进概览

本次改进针对钱包连接功能进行了全面的优化，提升了用户体验和系统稳定性。

## 主要改进点

### 1. ✅ 网络切换功能增强

**改进内容：**
- 添加了 `switchToCorrectNetwork()` 方法，允许用户一键切换到正确的 GenLayer 网络
- 在 `AccountPanel` 组件中添加了"切换到 GenLayer 网络"按钮
- 当用户在错误网络时，会显示明确的警告和操作按钮

**代码位置：**
- `frontend/lib/genlayer/WalletProvider.tsx` - 新增 `switchToCorrectNetwork` 方法
- `frontend/components/AccountPanel.tsx` - 添加网络切换按钮和 UI

**用户体验：**
- 用户不再需要手动在 MetaMask 中切换网络
- 提供清晰的操作指引和反馈

### 2. ✅ 账户切换后的数据自动刷新

**改进内容：**
- 当用户切换账户时，自动触发所有相关数据的刷新
- 使用自定义事件 `walletAccountChanged` 通知所有组件
- 所有使用钱包数据的 hooks 都会自动响应账户变化

**代码位置：**
- `frontend/lib/genlayer/WalletProvider.tsx` - 在 `switchWalletAccount` 中触发事件
- `frontend/lib/hooks/useFootballBets.ts` - 所有 hooks 监听账户变化事件

**影响的 Hooks：**
- `useBets()` - 自动刷新投注列表
- `usePlayerPoints()` - 自动刷新用户积分
- `useLeaderboard()` - 自动刷新排行榜

### 3. ✅ 连接超时处理

**改进内容：**
- 为 `connectMetaMask()` 函数添加了超时机制（默认 30 秒）
- 使用 `Promise.race()` 实现超时控制
- 超时时会抛出明确的错误信息

**代码位置：**
- `frontend/lib/genlayer/client.ts` - `connectMetaMask` 函数

**好处：**
- 防止连接过程无限等待
- 提供更好的错误反馈

### 4. ✅ 网络状态变化提示

**改进内容：**
- 当网络切换时，显示成功或警告提示
- 在 Navbar 顶部添加网络警告横幅（当用户在错误网络时）
- 网络切换成功时显示确认消息

**代码位置：**
- `frontend/lib/genlayer/WalletProvider.tsx` - `handleChainChanged` 事件处理
- `frontend/components/Navbar.tsx` - 网络警告横幅

**用户体验：**
- 实时反馈网络状态变化
- 顶部横幅提供持续可见的警告

### 5. ✅ 错误处理和用户反馈优化

**改进内容：**
- 改进了错误消息的显示方式
- 区分不同类型的错误（用户拒绝、超时、网络错误等）
- 账户切换成功时显示确认消息

**代码位置：**
- `frontend/lib/genlayer/WalletProvider.tsx` - 所有错误处理逻辑
- `frontend/components/AccountPanel.tsx` - UI 错误显示

## 技术细节

### 自定义事件系统

使用浏览器自定义事件来通知组件账户变化：

```typescript
window.dispatchEvent(new CustomEvent("walletAccountChanged", {
  detail: { address: newAddress }
}));
```

组件监听事件并自动刷新数据：

```typescript
useEffect(() => {
  const handleAccountChange = () => {
    queryClient.invalidateQueries({ queryKey: ["bets"] });
  };
  window.addEventListener("walletAccountChanged", handleAccountChange);
  return () => {
    window.removeEventListener("walletAccountChanged", handleAccountChange);
  };
}, [queryClient]);
```

### 超时机制实现

```typescript
const timeoutPromise = new Promise<never>((_, reject) => {
  setTimeout(() => {
    reject(new Error("Connection timeout. Please try again."));
  }, timeoutMs);
});

return Promise.race([connectPromise, timeoutPromise]);
```

## 使用示例

### 切换网络

```typescript
const { switchToCorrectNetwork } = useWallet();

// 在按钮点击时调用
await switchToCorrectNetwork();
```

### 切换账户

```typescript
const { switchWalletAccount } = useWallet();

// 切换账户，数据会自动刷新
await switchWalletAccount();
```

## 未来可能的改进

1. **重试机制**：连接失败时提供自动重试选项
2. **连接状态持久化**：记住用户偏好（是否自动连接）
3. **多钱包支持**：支持 WalletConnect 等其他钱包
4. **连接历史**：记录连接历史，方便快速切换
5. **网络状态监控**：定期检查网络状态，自动提示切换

## 测试建议

1. 测试在不同网络间切换
2. 测试账户切换后的数据刷新
3. 测试连接超时场景
4. 测试用户拒绝连接/切换的场景
5. 测试网络警告横幅的显示和隐藏

