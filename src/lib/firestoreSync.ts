import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  onSnapshot,
  writeBatch,
  deleteDoc,
  query,
  limit
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Product, CustomerDebt, Transaction, SubscriberAccount } from '../types';

export interface StoreCloudData {
  syncCode: string;
  shopName: string;
  lastUpdated: number;
  devicesCount: number;
}

/**
 * Realtime listener for Store Products in Firestore
 */
export function subscribeToStoreProducts(
  syncCode: string,
  onData: (products: Product[]) => void,
  onError?: (err: any) => void
) {
  const path = `stores/${syncCode}/products`;
  try {
    const productsRef = collection(db, 'stores', syncCode, 'products');
    return onSnapshot(
      productsRef,
      (snapshot) => {
        const productsList: Product[] = [];
        snapshot.forEach((docSnap) => {
          productsList.push(docSnap.data() as Product);
        });
        onData(productsList);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
        if (onError) onError(error);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return () => {};
  }
}

/**
 * Realtime listener for Customer Debts in Firestore
 */
export function subscribeToStoreDebts(
  syncCode: string,
  onData: (debts: CustomerDebt[]) => void,
  onError?: (err: any) => void
) {
  const path = `stores/${syncCode}/debts`;
  try {
    const debtsRef = collection(db, 'stores', syncCode, 'debts');
    return onSnapshot(
      debtsRef,
      (snapshot) => {
        const debtsList: CustomerDebt[] = [];
        snapshot.forEach((docSnap) => {
          debtsList.push(docSnap.data() as CustomerDebt);
        });
        onData(debtsList);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
        if (onError) onError(error);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return () => {};
  }
}

/**
 * Realtime listener for Transactions in Firestore
 */
export function subscribeToStoreTransactions(
  syncCode: string,
  onData: (transactions: Transaction[]) => void,
  onError?: (err: any) => void
) {
  const path = `stores/${syncCode}/transactions`;
  try {
    const txRef = collection(db, 'stores', syncCode, 'transactions');
    return onSnapshot(
      txRef,
      (snapshot) => {
        const txList: Transaction[] = [];
        snapshot.forEach((docSnap) => {
          txList.push(docSnap.data() as Transaction);
        });
        // Sort descending by date
        txList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        onData(txList);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
        if (onError) onError(error);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return () => {};
  }
}

/**
 * Realtime listener for Subscriber accounts list (Admin view)
 */
export function subscribeToSubscribers(
  onData: (subscribers: SubscriberAccount[]) => void,
  onError?: (err: any) => void
) {
  const path = 'subscribers';
  try {
    const subRef = collection(db, 'subscribers');
    return onSnapshot(
      subRef,
      (snapshot) => {
        const subs: SubscriberAccount[] = [];
        snapshot.forEach((docSnap) => {
          subs.push(docSnap.data() as SubscriberAccount);
        });
        onData(subs);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
        if (onError) onError(error);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return () => {};
  }
}

/**
 * Save complete Store state (products, debts, transactions) to Firestore
 */
export async function saveStoreToFirestore(
  syncCode: string,
  shopName: string,
  products: Product[],
  debts: CustomerDebt[],
  transactions: Transaction[]
) {
  const storePath = `stores/${syncCode}`;
  try {
    const storeRef = doc(db, 'stores', syncCode);
    await setDoc(storeRef, {
      syncCode,
      shopName,
      lastUpdated: Date.now(),
      devicesCount: 1
    }, { merge: true });

    // Sync products batch
    if (products.length > 0) {
      const batch = writeBatch(db);
      products.forEach((prod) => {
        const pRef = doc(db, 'stores', syncCode, 'products', prod.id);
        batch.set(pRef, prod, { merge: true });
      });
      await batch.commit();
    }

    // Sync debts batch
    if (debts.length > 0) {
      const batch = writeBatch(db);
      debts.forEach((debt) => {
        const dRef = doc(db, 'stores', syncCode, 'debts', debt.id);
        batch.set(dRef, debt, { merge: true });
      });
      await batch.commit();
    }

    // Sync recent transactions batch (top 200)
    if (transactions.length > 0) {
      const batch = writeBatch(db);
      transactions.slice(0, 200).forEach((tx) => {
        const tRef = doc(db, 'stores', syncCode, 'transactions', tx.id);
        batch.set(tRef, tx, { merge: true });
      });
      await batch.commit();
    }

    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, storePath);
    return false;
  }
}

/**
 * Save or Update a single Product
 */
export async function saveProductToFirestore(syncCode: string, product: Product) {
  const path = `stores/${syncCode}/products/${product.id}`;
  try {
    const pRef = doc(db, 'stores', syncCode, 'products', product.id);
    await setDoc(pRef, product, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete a single Product
 */
export async function deleteProductFromFirestore(syncCode: string, productId: string) {
  const path = `stores/${syncCode}/products/${productId}`;
  try {
    const pRef = doc(db, 'stores', syncCode, 'products', productId);
    await deleteDoc(pRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Save or Update a single Debt record
 */
export async function saveDebtToFirestore(syncCode: string, debt: CustomerDebt) {
  const path = `stores/${syncCode}/debts/${debt.id}`;
  try {
    const dRef = doc(db, 'stores', syncCode, 'debts', debt.id);
    await setDoc(dRef, debt, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Save a single Transaction receipt
 */
export async function saveTransactionToFirestore(syncCode: string, transaction: Transaction) {
  const path = `stores/${syncCode}/transactions/${transaction.id}`;
  try {
    const tRef = doc(db, 'stores', syncCode, 'transactions', transaction.id);
    await setDoc(tRef, transaction, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Save or Update Subscriber Account
 */
export async function saveSubscriberToFirestore(subscriber: SubscriberAccount) {
  const path = `subscribers/${subscriber.syncCode}`;
  try {
    const subRef = doc(db, 'subscribers', subscriber.syncCode);
    await setDoc(subRef, subscriber, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete Subscriber Account
 */
export async function deleteSubscriberFromFirestore(syncCode: string) {
  const path = `subscribers/${syncCode}`;
  try {
    const subRef = doc(db, 'subscribers', syncCode);
    await deleteDoc(subRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
