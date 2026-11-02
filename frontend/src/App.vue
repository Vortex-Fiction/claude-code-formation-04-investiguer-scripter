<script setup lang="ts">
import { ref } from 'vue';
import AuthorsList from './components/AuthorsList.vue';
import BooksList from './components/BooksList.vue';
import LoansList from './components/LoansList.vue';

type Tab = 'books' | 'loans' | 'authors';

const TABS: Tab[] = ['books', 'loans', 'authors'];

const activeTab = ref<Tab>('books');
const errorMessage = ref<string>();

function showError(error: Error): void {
  errorMessage.value = error.message;
}

function selectTab(tab: Tab): void {
  errorMessage.value = undefined;
  activeTab.value = tab;
}
</script>

<template>
  <main>
    <h1>Library</h1>
    <nav>
      <button
        v-for="tab in TABS"
        :key="tab"
        :class="{ active: tab === activeTab }"
        @click="selectTab(tab)"
      >
        {{ tab }}
      </button>
    </nav>
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    <BooksList v-if="activeTab === 'books'" @error="showError" />
    <LoansList v-if="activeTab === 'loans'" @error="showError" />
    <AuthorsList v-if="activeTab === 'authors'" @error="showError" />
  </main>
</template>

<style>
body {
  font-family: system-ui, sans-serif;
  margin: 2rem;
}
nav button {
  margin-right: 0.5rem;
  text-transform: capitalize;
}
nav button.active {
  font-weight: bold;
}
.error {
  color: #b00020;
}
table {
  border-collapse: collapse;
  margin-top: 1rem;
}
th,
td {
  border-bottom: 1px solid #ddd;
  padding: 0.4rem 0.8rem;
  text-align: left;
}
</style>
