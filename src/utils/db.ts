// src/utils/db.ts
import { 
    FireIcon, 
    ShoppingBagIcon, 
    BuildingStorefrontIcon, 
    TruckIcon 
} from '@heroicons/vue/24/outline';

// Due to IndexedDB's limitation, we can't store component objects directly.
// We store the component's name as a string and map it back upon retrieval.
const iconMap: { [key: string]: any } = {
  FireIcon,
  ShoppingBagIcon,
  BuildingStorefrontIcon,
  TruckIcon,
};

// Define the structure of a bill for database storage.
export interface BillInDB {
  id: number;
  description: string;
  amount: number;
  iconName: string; // We store the icon's name, not the component object.
  payer: 'me' | 'them';
}

const DB_NAME = 'CoupleAccountDB';
const STORE_NAME = 'bills';
const DB_VERSION = 1;

let db: IDBDatabase | null = null;

/**
 * Initializes the IndexedDB database and creates the object store if needed.
 * @returns {Promise<boolean>} A promise that resolves to true if the DB is opened successfully.
 */
export function initDB(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    console.log('正在初始化数据库...');

    // 检查浏览器是否支持 IndexedDB
    if (!window.indexedDB) {
      console.error('浏览器不支持 IndexedDB');
      reject(false);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('数据库打开失败:', request.error);
      reject(false);
    };

    // This event is triggered only when the DB version changes or数据库首次创建
    request.onupgradeneeded = (event) => {
      console.log('数据库需要升级，创建对象存储...');
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
        dbInstance.createObjectStore(STORE_NAME, { keyPath: 'id' });
        console.log('对象存储创建成功');
      }
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      console.log('数据库打开成功，当前版本:', db.version);
      resolve(true);
    };
  });
}

/**
 * Adds a new bill to the database.
 * @param {BillInDB} bill - The bill object to add.
 * @returns {Promise<void>}
 */
export function addBillToDB(bill: BillInDB): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!db) {
        console.error('添加失败：数据库未初始化');
        reject('DB is not initialized.');
        return;
    }

    console.log('正在添加账单到数据库:', bill);
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(bill);

    request.onsuccess = () => {
      console.log('账单添加成功:', bill.id);
      resolve();
    };
    request.onerror = () => {
      console.error('添加账单失败:', request.error);
      reject(request.error);
    };

    transaction.onerror = () => {
      console.error('事务错误:', transaction.error);
    };
  });
}

/**
 * Retrieves all bills from the database.
 * @returns {Promise<any[]>} A promise that resolves to an array of all bills.
 */
export function getAllBillsFromDB(): Promise<any[]> {
    return new Promise((resolve, reject) => {
        if (!db) {
            console.error('读取失败：数据库未初始化');
            reject('DB is not initialized.');
            return;
        }

        console.log('正在从数据库读取所有账单...');
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            console.log('读取到原始数据:', request.result);
            // Map the stored icon name back to the actual icon component.
            const billsWithIcons = request.result.map(bill => ({
                ...bill,
                icon: iconMap[bill.iconName]
            })).sort((a, b) => b.id - a.id); // Sort by newest first.
            console.log('处理后的账单数据:', billsWithIcons);
            resolve(billsWithIcons);
        };

        request.onerror = () => {
            console.error('读取账单失败:', request.error);
            reject(request.error);
        };
    });
}

export function updateBillInDB(bill: BillInDB): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!db) {
      console.error('更新失败：数据库未初始化');
      reject('DB is not initialized.');
      return;
    }

    console.log('正在更新账单:', bill);
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(bill); // put() will update if key exists

    request.onsuccess = () => {
      console.log('账单更新成功:', bill.id);
      resolve();
    };
    request.onerror = () => {
      console.error('更新账单失败:', request.error);
      reject(request.error);
    };
  });
}

export function deleteBillFromDB(id: number): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!db) {
      console.error('删除失败：数据库未初始化');
      reject('DB is not initialized.');
      return;
    }

    console.log('正在删除账单:', id);
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      console.log('账单删除成功:', id);
      resolve();
    };
    request.onerror = () => {
      console.error('删除账单失败:', request.error);
      reject(request.error);
    };
  });
}

