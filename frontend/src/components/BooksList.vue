<script setup lang="ts">
import type { BookWithAuthor } from '@formation/shared';
import { onMounted, ref } from 'vue';
import { borrowBook, listBooks, toError } from '../api';

const emit = defineEmits<{ error: [error: Error] }>();

const books = ref<BookWithAuthor[]>([]);
const borrowerByBookId = ref<Record<number, string>>({});

async function loadBooks(): Promise<void> {
  try {
    books.value = await listBooks();
  } catch (error) {
    emit('error', toError(error));
  }
}

async function borrow(book: BookWithAuthor): Promise<void> {
  try {
    await borrowBook(book.id, borrowerByBookId.value[book.id] ?? '');
    borrowerByBookId.value[book.id] = '';
    await loadBooks();
  } catch (error) {
    emit('error', toError(error));
  }
}

onMounted(loadBooks);
</script>

<template>
  <table>
    <thead>
      <tr>
        <th>Title</th>
        <th>Author</th>
        <th>ISBN</th>
        <th>Available</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="book in books" :key="book.id">
        <td>{{ book.title }}</td>
        <td>{{ book.authorName }}</td>
        <td>{{ book.isbn }}</td>
        <td>{{ book.isAvailable ? 'Yes' : 'No' }}</td>
        <td>
          <form v-if="book.isAvailable" @submit.prevent="borrow(book)">
            <input v-model="borrowerByBookId[book.id]" placeholder="Borrower" />
            <button type="submit">Borrow</button>
          </form>
        </td>
      </tr>
    </tbody>
  </table>
</template>
