<template>
  <div class="p-4 space-y-6">
    <ConnectWallet />
    <!-- keep your existing screens -->
    <Suspense>
      <template #default>
        <BetsScreen />
      </template>
      <template #fallback>
        <div class="flex items-center justify-center h-screen">
          <div class="spinner">Loading...</div>
        </div>
      </template>
    </Suspense>
  </div>
</template>

<script setup>
import ConnectWallet from "./components/ConnectWallet.vue";
import BetsScreen from "./components/BetsScreen.vue";
</script>
