'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';

interface ABTestContextType {
  getVariant: (testName: string, defaultVal?: string) => string;
  loading: boolean;
}

const ABTestContext = createContext<ABTestContextType | undefined>(undefined);

export function ABTestProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const [variants, setVariants] = useState<{ [testName: string]: string }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let visitorId = '';
    if (typeof window !== 'undefined') {
      visitorId = localStorage.getItem('ab_visitor_id') || '';
      if (!visitorId) {
        visitorId = `v_${Math.random().toString(36).substring(2, 12)}`;
        localStorage.setItem('ab_visitor_id', visitorId);
      }
    }

    const userId = user ? String(user.id) : visitorId;

    async function loadVariants() {
      try {
        const res = await api.get('/ab-tests/active');
        const activeTests = Array.isArray(res.data) ? res.data : [];
        const resultsMap: { [name: string]: string } = {};

        for (const test of activeTests) {
          const varRes = await api.get(`/ab-tests/variant?userId=${userId}&testName=${test.name}`);
          resultsMap[test.name] = varRes.data.variant;
        }

        setVariants(resultsMap);
      } catch (err) {
        console.error('❌ Failed to fetch active A/B tests variants:', err);
      } finally {
        setLoading(false);
      }
    }

    loadVariants();
  }, [user]);

  const getVariant = (testName: string, defaultVal: string = 'A'): string => {
    return variants[testName] || defaultVal;
  };

  return (
    <ABTestContext.Provider value={{ getVariant, loading }}>
      {children}
    </ABTestContext.Provider>
  );
}

export function useABTest(testName: string, defaultVal: string = 'A'): string {
  const context = useContext(ABTestContext);
  if (!context) {
    return defaultVal;
  }
  return context.getVariant(testName, defaultVal);
}
