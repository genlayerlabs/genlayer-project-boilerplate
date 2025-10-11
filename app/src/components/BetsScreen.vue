<template>
  <div class="min-h-screen bg-gray-100 text-gray-900">
    <header class="bg-white shadow flex justify-between">
      <div class="max-w-7xl py-6 px-4 sm:px-6 lg:px-8">
        <h1 class="text-3xl font-bold text-gray-900">GenLayer Football Bets</h1>
      </div>
      <div class="max-w-7xl py-6 px-4 sm:px-6 lg:px-8 text-right">
        <div v-if="userAddress">
          <p class="text-lg">Your address: <Address :address="userAddress" /></p>
          <p class="text-lg">Your points: {{ userPoints }}</p>
        </div>
        <div v-else>
          <p class="text-lg text-gray-600">Please connect your wallet to start betting</p>
          <p class="text-xs text-gray-500 mt-1">
            You can browse bets and leaderboard without a wallet. Connect to create or resolve.
          </p>
        </div>
      </div>
    </header>
    <main class="mx-auto py-6 sm:px-6 lg:px-8">
      <!-- Account Section -->

      <div class="grid grid-cols-1 md:grid-cols-10 gap-8">
        <!-- Bets List -->
        <div class="bg-white shadow overflow-hidden sm:rounded-lg col-span-7">
          <div class="px-4 py-5 sm:px-6 flex justify-between items-center">
            <h2 class="text-lg leading-6 font-medium text-gray-900">Bets</h2>
            <button
              @click="openCreateModal"
              class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm"
            >
              Create Bet
            </button>
          </div>
          <div class="border-t border-gray-200">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    User
                  </th>
                  <th
                    scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Game Date
                  </th>
                  <th
                    scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Team 1
                  </th>
                  <th
                    scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Team 2
                  </th>
                  <th
                    scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Predicted Winner
                  </th>
                  <th
                    scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Result
                  </th>
                  <th
                    scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Action
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="bet in bets" :key="bet.id">
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <Address :address="bet.owner" />
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ bet.game_date }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ bet.team1 }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ bet.team2 }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ bet.predicted_winner === "0" ? "Draw" : (bet.predicted_winner === "1" ? bet.team1 : bet.team2) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span :class="bet.has_resolved ? 'text-green-600' : 'text-yellow-600'">
                      {{ bet.has_resolved ? "Resolved" : "Unresolved" }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span v-if="bet.has_resolved" :class="bet.predicted_winner === String(bet.real_winner) ? 'text-green-600' : 'text-red-600'">
                      {{ bet.predicted_winner === String(bet.real_winner) ? "Success" : "Failure" }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div v-if="resolvingBet !== bet.id">
                      <!-- DEBUG: Log bet data -->
                      <div v-if="bet.owner === userAddress" style="display: none;">
                        {{ console.log("DEBUG: Bet owner matches userAddress:", bet.owner, "===", userAddress) }}
                      </div>
                      <div v-if="!bet.has_resolved" style="display: none;">
                        {{ console.log("DEBUG: Bet not resolved:", bet.has_resolved) }}
                      </div>
                      <div v-if="bet.owner === userAddress && !bet.has_resolved" style="display: none;">
                        {{ console.log("DEBUG: Showing resolve button for bet:", bet.id) }}
                      </div>
                      
                      <button
                        v-if="bet.owner === userAddress && !bet.has_resolved"
                        :disabled="!isConnected"
                        @click="onResolve(bet.id)"
                        class="text-indigo-600 hover:text-indigo-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                        Resolve
                      </button>
                      <span v-else-if="bet.owner !== userAddress" class="text-gray-400">
                        Not your bet
                      </span>
                      <span v-else-if="bet.has_resolved" class="text-green-600">
                        Already resolved
                      </span>
                    </div>
                    <div v-else>Resolving bet</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Leaderboard -->
        <div class="bg-white shadow overflow-hidden sm:rounded-lg col-span-3">
          <div class="px-4 py-5 sm:px-6">
            <h2 class="text-lg leading-6 font-medium text-gray-900">Leaderboard</h2>
          </div>
          <div class="border-t border-gray-200">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Rank
                  </th>
                  <th
                    scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Address
                  </th>
                  <th
                    scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Points
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="(user, index) in leaderboard" :key="user.address">
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ index + 1 }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <Address :address="user.address" />
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ user.points }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Create Bet Modal -->
      <div
        v-if="showCreateModal"
        class="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full flex items-center justify-center"
      >
        <div class="relative p-5 border w-96 shadow-lg rounded-md bg-white">
          <h3 class="text-lg font-medium leading-6 text-gray-900 mb-2">Create Bet</h3>
          <input
            v-model="form.date"
            type="date"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 mb-2"
            placeholder="Game Date (YYYY-MM-DD)"
          />
          <p v-if="formErrors.date" class="text-red-500 text-xs mb-2">{{ formErrors.date }}</p>
          <input
            v-model="form.team1"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 mb-2"
            placeholder="Team 1"
          />
          <p v-if="formErrors.team1" class="text-red-500 text-xs mb-2">{{ formErrors.team1 }}</p>
          <input
            v-model="form.team2"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 mb-2"
            placeholder="Team 2"
          />
          <p v-if="formErrors.team2" class="text-red-500 text-xs mb-2">{{ formErrors.team2 }}</p>
          <select
            v-model="form.predicted"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 mb-2"
          >
            <option value="" disabled selected>Select Predicted Winner</option>
            <option value="1">Team 1</option>
            <option value="2">Team 2</option>
          </select>
          <p v-if="formErrors.predicted" class="text-red-500 text-xs mb-2">{{ formErrors.predicted }}</p>
          <div class="mt-4">
            <div v-if="!creatingBet">
              <button
                :disabled="!isConnected"
                @click="submitCreate"
                class="bg-blue-500 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded mr-2"
              >
                Create
              </button>
              <button
                @click="showCreateModal = false"
                class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
              >
                Cancel
              </button>
            </div>
            <div v-else>
              <div class="spinner">Creating...</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { getAccount, onAccountChanged } from "../services/genlayer";
import FootballBets from "../logic/FootballBets";
import { validateBet, computeBetId } from "../lib/betValidation";
import Address from "./Address.vue";

// State
const form = ref({ date: "", team1: "", team2: "", predicted: "" });
const formErrors = ref({});
const creatingBet = ref(false);
const resolvingBet = ref(0);
const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || "0x2146690DCB6b857e375cA51D449e4400570e7c76";
const studioUrl = import.meta.env.VITE_STUDIO_URL;

// Initialize FootballBets with dynamic client
let fb = null;
const userAccount = ref(getAccount());
const userPoints = ref(0);
const userAddress = computed(() => userAccount.value?.address);
const bets = ref([]);
const leaderboard = ref([]);
const showCreateModal = ref(false);
const isConnected = computed(() => !!userAccount.value);

// Subscribe to account changes and auto-refresh data

const openCreateModal = () => {
  showCreateModal.value = true;
};

const refreshAll = async () => {
  try {
    bets.value = await fb.getBets();
    leaderboard.value = await fb.getLeaderboard();
    userPoints.value = userAccount.value ? await fb.getPlayerPoints(userAccount.value.address) : 0;
  } catch (error) {
    console.error("Failed to refresh data:", error);
    bets.value = [];
    leaderboard.value = [];
    userPoints.value = 0;
  }
};

const existingIds = computed(() => new Set(
  bets.value.map(b => (b.id || computeBetId(b.game_date, b.team1, b.team2)).toLowerCase())
));

// Create with validation + duplicate guard
const submitCreate = async () => {
  const { ok, errors, date } = validateBet({
    date: form.value.date,
    team1: form.value.team1,
    team2: form.value.team2,
    predicted: form.value.predicted,
  });
  formErrors.value = errors;
  if (!ok) return;

  const id = computeBetId(date, form.value.team1, form.value.team2);
  if (existingIds.value.has(id)) {
    return toast("Bet already exists for this date/teams.", "error");
  }
  if (!isConnected.value) return toast("Connect your wallet to create a bet.", "error");

  try {
    creatingBet.value = true;
    // accepted-only: không treo UI
    const hash = await fb.createBetTx(
      date,
      form.value.team1.trim(),
      form.value.team2.trim(),
      form.value.predicted
    );
    toast(`Submitted: ${short(hash)}`, "info");
    await refreshAll();
    // Reset form fields
    form.value = { date: "", team1: "", team2: "", predicted: "" };
    formErrors.value = {};
    showCreateModal.value = false;
  } catch (e) {
    toast(String(e?.message || e), "error");
  } finally {
    creatingBet.value = false;
  }
};

function short(h) { return h ? `${h.slice(0,10)}…${h.slice(-6)}` : ""; }
function toast(t, type="info"){ (window.$toast?.push || alert)(t); } // dùng toast hệ thống của bạn

// Resolve: tương tự — bạn có thể dùng fb.resolveBetTx(betId) để nhận hash nhanh
const onResolve = async (betId) => {
  console.log("DEBUG: onResolve called with betId:", betId);
  console.log("DEBUG: userAddress:", userAddress.value);
  console.log("DEBUG: isConnected:", isConnected.value);
  
  if (!isConnected.value) return toast("Connect your wallet", "error");
  try {
    resolvingBet.value = betId;
    console.log("DEBUG: Calling fb.resolveBetTx with:", betId);
    const hash = await fb.resolveBetTx(betId);
    console.log("DEBUG: Resolve successful, hash:", hash);
    toast(`Submitted: ${short(hash)}`, "info");
    await refreshAll();
  } catch (e) {
    console.error("DEBUG: Resolve failed:", e);
    toast(String(e?.message || e), "error");
  } finally {
    resolvingBet.value = 0;
  }
};


// Initialize data on mount and set up account change subscription
let unsubscribeAccount = null;

// Register lifecycle hooks before any async operations
onBeforeUnmount(() => {
  if (unsubscribeAccount) {
    unsubscribeAccount();
  }
});

onMounted(async () => {
  // READ-ONLY: init không account để xem dữ liệu ngay
  fb = new FootballBets(contractAddress, null, studioUrl);
  await refreshAll();

  unsubscribeAccount = onAccountChanged(async (acc) => {
    userAccount.value = acc || null;
    fb.updateAccount(acc || null);
    await refreshAll();
  });
});
</script>
