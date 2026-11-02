<script setup lang="ts">
import type { Author } from '@formation/shared';
import { onMounted, ref } from 'vue';
import { createAuthor, listAuthors, toError } from '../api';

const emit = defineEmits<{ error: [error: Error] }>();

const authors = ref<Author[]>([]);
const newAuthorName = ref('');

async function loadAuthors(): Promise<void> {
  try {
    authors.value = await listAuthors();
  } catch (error) {
    emit('error', toError(error));
  }
}

async function addAuthor(): Promise<void> {
  try {
    await createAuthor(newAuthorName.value);
    newAuthorName.value = '';
    await loadAuthors();
  } catch (error) {
    emit('error', toError(error));
  }
}

onMounted(loadAuthors);
</script>

<template>
  <ul>
    <li v-for="author in authors" :key="author.id">{{ author.name }}</li>
  </ul>
  <form @submit.prevent="addAuthor">
    <input v-model="newAuthorName" placeholder="Author name" />
    <button type="submit">Add author</button>
  </form>
</template>
