<script setup lang="ts">
import type { BookWithAuthor, Loan } from '@formation/shared';
import { onMounted, ref } from 'vue';
import { listBooks, listLoans, returnLoan, toError } from '../api';

const emit = defineEmits<{ error: [error: Error] }>();

const loans = ref<Loan[]>([]);
const bookTitleById = ref<Record<number, string>>({});

function indexTitles(books: BookWithAuthor[]): Record<number, string> {
  return Object.fromEntries(books.map((book) => [book.id, book.title]));
}

async function loadLoans(): Promise<void> {
  try {
    const [loadedLoans, books] = await Promise.all([listLoans(), listBooks()]);
    loans.value = loadedLoans;
    bookTitleById.value = indexTitles(books);
  } catch (error) {
    emit('error', toError(error));
  }
}

async function giveBack(loan: Loan): Promise<void> {
  try {
    await returnLoan(loan.id);
    await loadLoans();
  } catch (error) {
    emit('error', toError(error));
  }
}

onMounted(loadLoans);
</script>

<template>
  <p v-if="loans.length === 0">No loans yet.</p>
  <table v-else>
    <thead>
      <tr>
        <th>Book</th>
        <th>Borrower</th>
        <th>Borrowed at</th>
        <th>Returned at</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="loan in loans" :key="loan.id">
        <td>{{ bookTitleById[loan.bookId] }}</td>
        <td>{{ loan.borrower }}</td>
        <td>{{ loan.borrowedAt }}</td>
        <td>{{ loan.returnedAt ?? '—' }}</td>
        <td>
          <button v-if="loan.returnedAt === null" @click="giveBack(loan)">Return</button>
        </td>
      </tr>
    </tbody>
  </table>
</template>
