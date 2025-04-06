import { useState, useEffect } from 'react';

function useLocalStorage(key, initialValue, options = {}) {
  const { disableCache = false } = options;
  // 获取初始值
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  // 监听值的变化并更新到 localStorage
  useEffect(() => {
    if (!disableCache) {
      try {
        window.localStorage.setItem(key, JSON.stringify(storedValue));
      } catch (error) {
        console.error(error);
      }
    }
  }, [key, storedValue, disableCache]);

  return [storedValue, setStoredValue];
}

export default useLocalStorage;