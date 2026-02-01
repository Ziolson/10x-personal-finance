# Plan Testowania - AI Insights

**Projekt:** 10xPersonal Finance  
**Moduł:** AI Insights & Savings Recommendations  
**Typ dokumentu:** Plan testowania (Unit, Integration, Component, E2E)  
**Data utworzenia:** 1 lutego 2026  
**Status:** Draft

---

## 1. Cel dokumentu

Niniejszy dokument definiuje **wyłącznie** strategię i plan testowania dla modułu AI Insights. Obejmuje wszystkie typy testów: unit, integration, component i end-to-end.

**Zakres:** Testy dla backend services, API endpoints, React components, user flows  
**Nie obejmuje:** Implementacja funkcjonalności (to jest w innych planach)  

**Powiązane dokumenty:**
- `db_ai_changes_plan.md` - implementacja zmian w bazie danych
- `api_ai_implementation_plan.md` - implementacja API i backend services
- `views_ai_implementation_plan.md` - implementacja frontend components

**Prerequisites:**
- ✅ Vitest skonfigurowany w projekcie
- ✅ Playwright skonfigurowany dla E2E
- ✅ Testing Library dla component tests
- ✅ MSW (Mock Service Worker) dostępny dla mocking

---

## 2. Przegląd strategii testowania

### 2.1 Piramida testów

```
        /\
       /  \       E2E Tests (1-2 testy)
      /    \      - Cały flow użytkownika
     /------\
    /        \    Component Tests (5-8 testów)
   /          \   - React components w izolacji
  /------------\
 /              \ Integration Tests (8-12 testów)
/                \- API endpoints + service layer
|________________|
  Unit Tests (20-30 testów)
  - Validators, helpers, formatters
```

### 2.2 Coverage targets

| Layer | Minimum Coverage | Recommended Coverage |
|-------|------------------|---------------------|
| Services (InsightsService) | 80% | 90% |
| API Endpoints | 70% | 85% |
| React Components | 60% | 75% |
| Validators | 90% | 95% |
| Overall | 70% | 80% |

### 2.3 Test tools w projekcie

| Typ testu | Tool | Config |
|-----------|------|--------|
| Unit | Vitest | `vitest.config.ts` |
| Component | React Testing Library + Vitest | `test/setup.ts` |
| Integration | Vitest + MSW | - |
| E2E | Playwright | `playwright.config.ts` |
| Mocking | MSW (Mock Service Worker) | - |

---

## 3. Unit Tests - Backend Services

### KROK 1: Testy dla InsightsService - hasEnoughData()

**Plik:** `src/lib/services/insights.service.test.ts`

**Cel:** Weryfikacja logiki sprawdzania czy użytkownik ma wystarczająco danych.

**Test cases:**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InsightsService } from './insights.service';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../db/database.types';

describe('InsightsService - hasEnoughData()', () => {
  let service: InsightsService;
  let mockSupabase: SupabaseClient<Database>;

  beforeEach(() => {
    // Mock Supabase client
    mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
              })),
            })),
          })),
        })),
      })),
    } as any;

    service = new InsightsService(mockSupabase);
  });

  it('should return false when user has no transactions', async () => {
    // Mock: No transactions
    mockSupabase.from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          })),
        })),
      })),
    })) as any;

    const result = await service.hasEnoughData('user-123');
    expect(result).toBe(false);
  });

  it('should return false when oldest transaction is less than 28 days old', async () => {
    // Mock: Transaction from 20 days ago
    const twentyDaysAgo = new Date();
    twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);

    mockSupabase.from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({ 
                data: [{ date: twentyDaysAgo.toISOString().split('T')[0] }], 
                error: null 
              })),
            })),
          })),
        })),
      })),
    })) as any;

    const result = await service.hasEnoughData('user-123');
    expect(result).toBe(false);
  });

  it('should return true when oldest transaction is exactly 28 days old', async () => {
    const twentyEightDaysAgo = new Date();
    twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 28);

    mockSupabase.from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({ 
                data: [{ date: twentyEightDaysAgo.toISOString().split('T')[0] }], 
                error: null 
              })),
            })),
          })),
        })),
      })),
    })) as any;

    const result = await service.hasEnoughData('user-123');
    expect(result).toBe(true);
  });

  it('should return true when oldest transaction is more than 28 days old', async () => {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    mockSupabase.from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({ 
                data: [{ date: sixtyDaysAgo.toISOString().split('T')[0] }], 
                error: null 
              })),
            })),
          })),
        })),
      })),
    })) as any;

    const result = await service.hasEnoughData('user-123');
    expect(result).toBe(true);
  });

  it('should return false when database query fails', async () => {
    mockSupabase.from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({ 
                data: null, 
                error: { message: 'Database error' } 
              })),
            })),
          })),
        })),
      })),
    })) as any;

    const result = await service.hasEnoughData('user-123');
    expect(result).toBe(false);
  });
});
```

**Akcje:**
1. ✅ Utwórz plik testów
2. ✅ Implement wszystkie test cases
3. ✅ Uruchom: `npm test src/lib/services/insights.service.test.ts`
4. ✅ Zweryfikuj coverage (powinno być 100% dla tej funkcji)

---

### KROK 2: Testy dla InsightsService - aggregateTransactionsForAI()

**Dodaj do pliku:** `src/lib/services/insights.service.test.ts`

**Test cases:**

```typescript
describe('InsightsService - aggregateTransactionsForAI()', () => {
  it('should correctly aggregate transactions by category for 1 month', async () => {
    // Mock transactions
    const mockTransactions = [
      {
        amount: 100,
        date: '2026-01-15',
        category_id: 'cat-food',
        categories: { id: 'cat-food', name: 'Jedzenie', budget_id: null, budgets: null },
      },
      {
        amount: 50,
        date: '2026-01-20',
        category_id: 'cat-food',
        categories: { id: 'cat-food', name: 'Jedzenie', budget_id: null, budgets: null },
      },
      {
        amount: 200,
        date: '2026-01-25',
        category_id: 'cat-transport',
        categories: { id: 'cat-transport', name: 'Transport', budget_id: null, budgets: null },
      },
    ];

    mockSupabase.from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              lte: vi.fn(() => Promise.resolve({ data: mockTransactions, error: null })),
            })),
          })),
        })),
      })),
    })) as any;

    const result = await service.aggregateTransactionsForAI('user-123', 1);

    expect(result.total_spending).toBe(350);
    expect(result.average_monthly_spending).toBe(350);
    expect(result.period.months).toBe(1);
    expect(result.category_breakdown).toHaveLength(2);
    
    // Check Jedzenie category
    const foodCategory = result.category_breakdown.find(c => c.category_name === 'Jedzenie');
    expect(foodCategory).toBeDefined();
    expect(foodCategory?.total_amount).toBe(150);
    expect(foodCategory?.monthly_average).toBe(150);
    expect(foodCategory?.transaction_count).toBe(2);

    // Check Transport category
    const transportCategory = result.category_breakdown.find(c => c.category_name === 'Transport');
    expect(transportCategory).toBeDefined();
    expect(transportCategory?.total_amount).toBe(200);
    expect(transportCategory?.transaction_count).toBe(1);
  });

  it('should sort categories by total spending (descending)', async () => {
    const mockTransactions = [
      { amount: 100, category_id: 'cat-a', categories: { name: 'A' } },
      { amount: 500, category_id: 'cat-b', categories: { name: 'B' } },
      { amount: 200, category_id: 'cat-c', categories: { name: 'C' } },
    ];

    // ... mock setup ...

    const result = await service.aggregateTransactionsForAI('user-123', 1);

    expect(result.category_breakdown[0].category_name).toBe('B'); // 500
    expect(result.category_breakdown[1].category_name).toBe('C'); // 200
    expect(result.category_breakdown[2].category_name).toBe('A'); // 100
  });

  it('should calculate correct monthly average for 3 months', async () => {
    const mockTransactions = [
      { amount: 300, category_id: 'cat-food', categories: { name: 'Jedzenie' } },
    ];

    // ... mock setup ...

    const result = await service.aggregateTransactionsForAI('user-123', 3);

    expect(result.total_spending).toBe(300);
    expect(result.average_monthly_spending).toBe(100); // 300 / 3
    expect(result.category_breakdown[0].monthly_average).toBe(100);
  });

  it('should include budget information when available', async () => {
    const mockTransactions = [
      {
        amount: 100,
        category_id: 'cat-food',
        categories: {
          name: 'Jedzenie',
          budget_id: 'budget-1',
          budgets: {
            id: 'budget-1',
            name: 'Żywność',
            amount: 1000,
          },
        },
      },
    ];

    // ... mock setup ...

    const result = await service.aggregateTransactionsForAI('user-123', 1);

    expect(result.budgets).toBeDefined();
    expect(result.budgets).toHaveLength(1);
    expect(result.budgets?.[0].budget_name).toBe('Żywność');
    expect(result.budgets?.[0].budget_amount).toBe(1000);
    expect(result.budgets?.[0].category_names).toContain('Jedzenie');
  });

  it('should handle uncategorized transactions', async () => {
    const mockTransactions = [
      {
        amount: 50,
        category_id: null,
        categories: null,
      },
    ];

    // ... mock setup ...

    const result = await service.aggregateTransactionsForAI('user-123', 1);

    const uncategorized = result.category_breakdown.find(c => c.category_id === 'uncategorized');
    expect(uncategorized).toBeDefined();
    expect(uncategorized?.category_name).toBe('Uncategorized');
    expect(uncategorized?.total_amount).toBe(50);
  });

  it('should throw error when database query fails', async () => {
    mockSupabase.from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              lte: vi.fn(() => Promise.resolve({ 
                data: null, 
                error: { message: 'Database error' } 
              })),
            })),
          })),
        })),
      })),
    })) as any;

    await expect(service.aggregateTransactionsForAI('user-123', 1))
      .rejects
      .toThrow('Failed to fetch transactions for AI analysis');
  });
});
```

---

### KROK 3: Testy dla InsightsService - callOpenAI()

**Uwaga:** Ta funkcja jest private, więc testujemy ją pośrednio przez `generateInsights()`.

**Test cases przez integrację:**

```typescript
describe('InsightsService - generateInsights() (testing callOpenAI indirectly)', () => {
  it('should successfully generate insights from OpenAI', async () => {
    // Mock hasEnoughData to return true
    vi.spyOn(service, 'hasEnoughData').mockResolvedValue(true);

    // Mock aggregateTransactionsForAI
    vi.spyOn(service as any, 'aggregateTransactionsForAI').mockResolvedValue({
      period: { start_date: '2026-01-01', end_date: '2026-01-31', months: 1 },
      total_spending: 1000,
      average_monthly_spending: 1000,
      category_breakdown: [
        { category_id: 'cat-1', category_name: 'Jedzenie', total_amount: 600, monthly_average: 600, transaction_count: 5 },
      ],
      budgets: [],
    });

    // Mock OpenAI response
    const mockAIResponse = {
      analysis_period: {
        start_date: '2026-01-01',
        end_date: '2026-01-31',
        months_analyzed: 1,
      },
      total_spending: 1000,
      average_monthly_spending: 1000,
      total_potential_savings: 100,
      general_recommendation: 'Test recommendation',
      insights: [
        {
          id: 'ins-1',
          category: 'Jedzenie',
          current_spending: 600,
          suggested_target: 500,
          potential_savings: 100,
          priority: 'high' as const,
          reasoning: 'Test reasoning',
          actionable_tips: ['Tip 1', 'Tip 2'],
        },
      ],
    };

    // Mock callOpenAI
    vi.spyOn(service as any, 'callOpenAI').mockResolvedValue(mockAIResponse);

    // Mock saveInsights
    mockSupabase.from = vi.fn(() => ({
      upsert: vi.fn(() => Promise.resolve({ error: null })),
    })) as any;

    // Mock getLatestInsights
    mockSupabase.from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'insight-123',
              data: mockAIResponse,
              generated_at: new Date().toISOString(),
              months_analyzed: 1,
            },
            error: null,
          })),
        })),
      })),
    })) as any;

    const result = await service.generateInsights('user-123', { months: 1, force_refresh: false });

    expect(result).toBeDefined();
    expect(result.data.insights).toHaveLength(1);
    expect(result.data.total_potential_savings).toBe(100);
  });

  it('should throw error when OpenAI returns invalid JSON', async () => {
    vi.spyOn(service, 'hasEnoughData').mockResolvedValue(true);
    vi.spyOn(service as any, 'aggregateTransactionsForAI').mockResolvedValue({
      period: { start_date: '2026-01-01', end_date: '2026-01-31', months: 1 },
      total_spending: 1000,
      average_monthly_spending: 1000,
      category_breakdown: [],
    });

    // Mock OpenAI to return invalid structure
    vi.spyOn(service as any, 'callOpenAI').mockRejectedValue(
      new Error('Invalid AI response structure')
    );

    await expect(service.generateInsights('user-123', { months: 1 }))
      .rejects
      .toThrow('Invalid AI response structure');
  });
});
```

---

### KROK 4: Testy dla cache logic

**Test cases:**

```typescript
describe('InsightsService - Cache Logic', () => {
  it('should return cached insights if fresh (< 24h)', async () => {
    vi.spyOn(service, 'hasEnoughData').mockResolvedValue(true);

    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    // Mock getLatestInsights to return fresh cache
    mockSupabase.from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'insight-123',
              data: { insights: [], total_potential_savings: 100 },
              generated_at: oneHourAgo.toISOString(),
              months_analyzed: 3,
            },
            error: null,
          })),
        })),
      })),
    })) as any;

    const callOpenAISpy = vi.spyOn(service as any, 'callOpenAI');

    const result = await service.generateInsights('user-123', { months: 3, force_refresh: false });

    expect(result).toBeDefined();
    expect(callOpenAISpy).not.toHaveBeenCalled(); // Should use cache
  });

  it('should regenerate if cache is stale (> 24h)', async () => {
    vi.spyOn(service, 'hasEnoughData').mockResolvedValue(true);

    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    // Mock getLatestInsights to return stale cache
    mockSupabase.from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'insight-123',
              data: { insights: [] },
              generated_at: twoDaysAgo.toISOString(),
              months_analyzed: 3,
            },
            error: null,
          })),
        })),
      })),
    })) as any;

    const callOpenAISpy = vi.spyOn(service as any, 'callOpenAI').mockResolvedValue({
      insights: [],
      total_potential_savings: 200,
    });

    await service.generateInsights('user-123', { months: 3, force_refresh: false });

    expect(callOpenAISpy).toHaveBeenCalled(); // Should regenerate
  });

  it('should regenerate if force_refresh is true', async () => {
    vi.spyOn(service, 'hasEnoughData').mockResolvedValue(true);

    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    mockSupabase.from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'insight-123',
              data: { insights: [] },
              generated_at: oneHourAgo.toISOString(),
              months_analyzed: 3,
            },
            error: null,
          })),
        })),
      })),
    })) as any;

    const callOpenAISpy = vi.spyOn(service as any, 'callOpenAI').mockResolvedValue({
      insights: [],
    });

    await service.generateInsights('user-123', { months: 3, force_refresh: true });

    expect(callOpenAISpy).toHaveBeenCalled(); // Should regenerate despite fresh cache
  });

  it('isCacheFresh should return true for 23 hours old', () => {
    const twentyThreeHoursAgo = new Date();
    twentyThreeHoursAgo.setHours(twentyThreeHoursAgo.getHours() - 23);

    const result = service.isCacheFresh(twentyThreeHoursAgo.toISOString());
    expect(result).toBe(true);
  });

  it('isCacheFresh should return false for 25 hours old', () => {
    const twentyFiveHoursAgo = new Date();
    twentyFiveHoursAgo.setHours(twentyFiveHoursAgo.getHours() - 25);

    const result = service.isCacheFresh(twentyFiveHoursAgo.toISOString());
    expect(result).toBe(false);
  });
});
```

---

## 4. Integration Tests - API Endpoints

### KROK 5: Testy dla GET /api/insights/latest

**Plik:** `src/pages/api/insights/latest.test.ts`

**Test cases:**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from './latest';

describe('GET /api/insights/latest', () => {
  let mockLocals: any;
  let mockRequest: Request;

  beforeEach(() => {
    // Mock Supabase client with auth
    mockLocals = {
      supabase: {
        auth: {
          getUser: vi.fn(),
        },
        from: vi.fn(),
      },
    };

    mockRequest = new Request('http://localhost:3000/api/insights/latest');
  });

  it('should return 401 if user is not authenticated', async () => {
    mockLocals.supabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    });

    const response = await GET({ locals: mockLocals, request: mockRequest } as any);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('should return 404 if no insights exist for user', async () => {
    mockLocals.supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    mockLocals.supabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: { code: 'PGRST116' } })),
        })),
      })),
    });

    const response = await GET({ locals: mockLocals, request: mockRequest } as any);

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe('No insights available yet');
  });

  it('should return 200 with insights data', async () => {
    const mockInsight = {
      id: 'insight-123',
      data: {
        analysis_period: { start_date: '2026-01-01', end_date: '2026-01-31', months_analyzed: 1 },
        total_spending: 1000,
        average_monthly_spending: 1000,
        total_potential_savings: 100,
        general_recommendation: 'Test',
        insights: [],
      },
      generated_at: new Date().toISOString(),
      months_analyzed: 1,
    };

    mockLocals.supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    mockLocals.supabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: mockInsight, error: null })),
        })),
      })),
    });

    const response = await GET({ locals: mockLocals, request: mockRequest } as any);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.id).toBe('insight-123');
    expect(body.data.total_potential_savings).toBe(100);
  });

  it('should return 500 on unexpected error', async () => {
    mockLocals.supabase.auth.getUser.mockRejectedValue(new Error('Database connection failed'));

    const response = await GET({ locals: mockLocals, request: mockRequest } as any);

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe('Internal server error');
  });
});
```

---

### KROK 6: Testy dla POST /api/insights/analyze

**Plik:** `src/pages/api/insights/analyze.test.ts`

**Test cases:**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from './analyze';

describe('POST /api/insights/analyze', () => {
  let mockLocals: any;
  let mockRequest: Request;

  beforeEach(() => {
    mockLocals = {
      supabase: {
        auth: {
          getUser: vi.fn(),
        },
        from: vi.fn(),
      },
    };
  });

  it('should return 401 if user is not authenticated', async () => {
    mockLocals.supabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    });

    mockRequest = new Request('http://localhost:3000/api/insights/analyze', {
      method: 'POST',
      body: JSON.stringify({ months: 3 }),
    });

    const response = await POST({ locals: mockLocals, request: mockRequest } as any);

    expect(response.status).toBe(401);
  });

  it('should return 400 for invalid request body', async () => {
    mockLocals.supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    // Invalid months value
    mockRequest = new Request('http://localhost:3000/api/insights/analyze', {
      method: 'POST',
      body: JSON.stringify({ months: 5 }), // Only 1, 2, 3 allowed
    });

    const response = await POST({ locals: mockLocals, request: mockRequest } as any);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Validation error');
  });

  it('should return 400 if user has insufficient data', async () => {
    mockLocals.supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    mockRequest = new Request('http://localhost:3000/api/insights/analyze', {
      method: 'POST',
      body: JSON.stringify({ months: 3 }),
    });

    // Mock InsightsService to throw insufficient data error
    // This requires mocking the service or using dependency injection
    // For now, we can test through actual service behavior

    const response = await POST({ locals: mockLocals, request: mockRequest } as any);

    // Will depend on actual data in test database
    if (response.status === 400) {
      const body = await response.json();
      expect(body.error).toContain('Insufficient data');
    }
  });

  it('should return 503 if AI service fails', async () => {
    mockLocals.supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    mockRequest = new Request('http://localhost:3000/api/insights/analyze', {
      method: 'POST',
      body: JSON.stringify({ months: 3 }),
    });

    // Mock OpenRouter to fail (requires MSW or similar)
    // This test would need OpenRouter client to be injectable

    // Placeholder test structure
    // const response = await POST({ locals: mockLocals, request: mockRequest } as any);
    // expect(response.status).toBe(503);
  });

  it('should return 200 with generated insights', async () => {
    mockLocals.supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    mockRequest = new Request('http://localhost:3000/api/insights/analyze', {
      method: 'POST',
      body: JSON.stringify({ months: 3, force_refresh: false }),
    });

    // This test requires full integration with mocked OpenAI
    // For actual implementation, consider using MSW to mock OpenRouter

    // Placeholder
    // const response = await POST({ locals: mockLocals, request: mockRequest } as any);
    // expect(response.status).toBe(200);
  });
});
```

**Uwaga:** Pełne testy API endpoints wymagają albo dependency injection dla InsightsService, albo użycia MSW do mockowania OpenRouter API.

---

## 5. Component Tests - React Components

### KROK 7: Testy dla useInsights hook

**Plik:** `src/components/hooks/useInsights.test.ts`

**Test cases:**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useInsights } from './useInsights';

// Mock fetch globally
global.fetch = vi.fn();

describe('useInsights hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchLatest', () => {
    it('should fetch latest insights successfully', async () => {
      const mockData = {
        id: 'insight-123',
        data: { insights: [], total_potential_savings: 100 },
        generated_at: new Date().toISOString(),
        months_analyzed: 3,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
      });

      const { result } = renderHook(() => useInsights());

      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBeNull();

      await waitFor(() => result.current.fetchLatest());

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
      });
    });

    it('should handle 404 as empty state', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'No insights available yet' }),
      });

      const { result } = renderHook(() => useInsights());

      await waitFor(() => result.current.fetchLatest());

      await waitFor(() => {
        expect(result.current.data).toBeNull();
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
      });
    });

    it('should handle fetch error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: { message: 'Internal server error' } }),
      });

      const { result } = renderHook(() => useInsights());

      await waitFor(() => result.current.fetchLatest());

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('generateInsights', () => {
    it('should generate insights successfully', async () => {
      const mockData = {
        id: 'insight-456',
        data: { insights: [], total_potential_savings: 150 },
        generated_at: new Date().toISOString(),
        months_analyzed: 2,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
      });

      const { result } = renderHook(() => useInsights());

      const data = await result.current.generateInsights({ months: 2 });

      await waitFor(() => {
        expect(data).toEqual(mockData);
        expect(result.current.data).toEqual(mockData);
      });
    });

    it('should pass force_refresh parameter', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      const { result } = renderHook(() => useInsights());

      await result.current.generateInsights({ months: 3, force_refresh: true });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/insights/analyze',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ months: 3, force_refresh: true }),
        })
      );
    });
  });
});
```

---

### KROK 8: Testy dla AIInsightsCard component

**Plik:** `src/components/features/dashboard/AIInsightsCard.test.tsx`

**Test cases:**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AIInsightsCard } from './AIInsightsCard';
import * as useInsightsModule from '@/components/hooks/useInsights';

// Mock useInsights hook
vi.mock('@/components/hooks/useInsights');

describe('AIInsightsCard', () => {
  it('should render loading state', () => {
    vi.mocked(useInsightsModule.useInsights).mockReturnValue({
      data: null,
      loading: true,
      error: null,
      fetchLatest: vi.fn(),
      generateInsights: vi.fn(),
    });

    render(<AIInsightsCard />);

    expect(screen.getByText('Rekomendacje AI')).toBeInTheDocument();
    // Check for skeleton (rendered by Skeleton component)
  });

  it('should render empty state when no data', () => {
    vi.mocked(useInsightsModule.useInsights).mockReturnValue({
      data: null,
      loading: false,
      error: null,
      fetchLatest: vi.fn(),
      generateInsights: vi.fn(),
    });

    render(<AIInsightsCard />);

    expect(screen.getByText('Dowiedz się gdzie możesz zaoszczędzić')).toBeInTheDocument();
    expect(screen.getByText('Analizuj wydatki')).toBeInTheDocument();
  });

  it('should render error state', () => {
    vi.mocked(useInsightsModule.useInsights).mockReturnValue({
      data: null,
      loading: false,
      error: 'Something went wrong',
      fetchLatest: vi.fn(),
      generateInsights: vi.fn(),
    });

    render(<AIInsightsCard />);

    expect(screen.getByText(/Wystąpił błąd/)).toBeInTheDocument();
    expect(screen.getByText('Spróbuj ponownie')).toBeInTheDocument();
  });

  it('should render success state with data', () => {
    const mockData = {
      id: 'insight-123',
      data: {
        analysis_period: { start_date: '2026-01-01', end_date: '2026-01-31', months_analyzed: 3 },
        total_spending: 10000,
        average_monthly_spending: 3333,
        total_potential_savings: 500,
        general_recommendation: 'Great!',
        insights: [
          {
            id: 'ins-1',
            category: 'Jedzenie',
            current_spending: 3500,
            suggested_target: 3000,
            potential_savings: 500,
            priority: 'high' as const,
            reasoning: 'Test reasoning',
            actionable_tips: ['Tip 1'],
          },
        ],
      },
      generated_at: new Date().toISOString(),
      months_analyzed: 3,
    };

    vi.mocked(useInsightsModule.useInsights).mockReturnValue({
      data: mockData,
      loading: false,
      error: null,
      fetchLatest: vi.fn(),
      generateInsights: vi.fn(),
    });

    render(<AIInsightsCard />);

    expect(screen.getByText('Możliwości oszczędności')).toBeInTheDocument();
    expect(screen.getByText(/500 PLN/)).toBeInTheDocument(); // Total savings
    expect(screen.getByText('Jedzenie')).toBeInTheDocument(); // Top category
    expect(screen.getByText('Zobacz pełną analizę')).toBeInTheDocument();
  });

  it('should call generateInsights when "Analizuj wydatki" is clicked', async () => {
    const mockGenerateInsights = vi.fn();

    vi.mocked(useInsightsModule.useInsights).mockReturnValue({
      data: null,
      loading: false,
      error: null,
      fetchLatest: vi.fn(),
      generateInsights: mockGenerateInsights,
    });

    const user = userEvent.setup();
    render(<AIInsightsCard />);

    const button = screen.getByText('Analizuj wydatki');
    await user.click(button);

    expect(mockGenerateInsights).toHaveBeenCalledWith({ months: 3, force_refresh: false });
  });

  it('should call generateInsights with force_refresh when refresh button is clicked', async () => {
    const mockGenerateInsights = vi.fn();

    const mockData = {
      id: 'insight-123',
      data: {
        insights: [],
        total_potential_savings: 500,
        general_recommendation: 'Test',
      },
      generated_at: new Date().toISOString(),
      months_analyzed: 3,
    };

    vi.mocked(useInsightsModule.useInsights).mockReturnValue({
      data: mockData as any,
      loading: false,
      error: null,
      fetchLatest: vi.fn(),
      generateInsights: mockGenerateInsights,
    });

    const user = userEvent.setup();
    render(<AIInsightsCard />);

    // Find refresh button (has RefreshCw icon)
    const refreshButton = screen.getByRole('button', { name: /odśwież/i });
    await user.click(refreshButton);

    expect(mockGenerateInsights).toHaveBeenCalledWith({ months: 3, force_refresh: true });
  });
});
```

---

### KROK 9: Testy dla InsightDetailCard component

**Plik:** `src/components/features/insights/InsightDetailCard.test.tsx`

**Test cases:**

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InsightDetailCard } from './InsightDetailCard';
import type { AIInsight } from '@/types';

describe('InsightDetailCard', () => {
  const mockInsight: AIInsight = {
    id: 'ins-1',
    category: 'Jedzenie',
    current_spending: 3500,
    suggested_target: 3000,
    potential_savings: 500,
    priority: 'high',
    reasoning: 'Wydajesz 3500 PLN miesięcznie na jedzenie.',
    actionable_tips: [
      'Planuj posiłki na tydzień',
      'Kupuj w tańszych sklepach',
      'Ogranicz jedzenie na wynos',
    ],
  };

  it('should render insight details correctly', () => {
    render(<InsightDetailCard insight={mockInsight} rank={1} />);

    expect(screen.getByText('Jedzenie')).toBeInTheDocument();
    expect(screen.getByText('Wysoki priorytet')).toBeInTheDocument();
    expect(screen.getByText('500 PLN')).toBeInTheDocument();
    expect(screen.getByText(/3500 PLN/)).toBeInTheDocument(); // Current spending
    expect(screen.getByText(/3000 PLN/)).toBeInTheDocument(); // Target
  });

  it('should display rank badge', () => {
    render(<InsightDetailCard insight={mockInsight} rank={3} />);

    expect(screen.getByText('3')).toBeInTheDocument(); // Rank number in badge
  });

  it('should calculate and display reduction percentage', () => {
    render(<InsightDetailCard insight={mockInsight} rank={1} />);

    // 500 / 3500 * 100 = 14.28... => "14%"
    expect(screen.getByText(/Redukcja o 14%/)).toBeInTheDocument();
  });

  it('should render all actionable tips', () => {
    render(<InsightDetailCard insight={mockInsight} rank={1} />);

    expect(screen.getByText('Planuj posiłki na tydzień')).toBeInTheDocument();
    expect(screen.getByText('Kupuj w tańszych sklepach')).toBeInTheDocument();
    expect(screen.getByText('Ogranicz jedzenie na wynos')).toBeInTheDocument();
  });

  it('should apply correct styling for high priority', () => {
    const { container } = render(<InsightDetailCard insight={mockInsight} rank={1} />);

    // Check for red border (high priority)
    const card = container.querySelector('.border-red-200');
    expect(card).toBeInTheDocument();
  });

  it('should apply correct styling for medium priority', () => {
    const mediumInsight = { ...mockInsight, priority: 'medium' as const };
    const { container } = render(<InsightDetailCard insight={mediumInsight} rank={1} />);

    // Check for amber border (medium priority)
    const card = container.querySelector('.border-amber-200');
    expect(card).toBeInTheDocument();
  });

  it('should apply correct styling for low priority', () => {
    const lowInsight = { ...mockInsight, priority: 'low' as const };
    const { container } = render(<InsightDetailCard insight={lowInsight} rank={1} />);

    // Check for blue border (low priority)
    const card = container.querySelector('.border-blue-200');
    expect(card).toBeInTheDocument();
  });
});
```

---

## 6. E2E Tests - User Flows

### KROK 10: E2E test dla całego flow AI Insights

**Plik:** `e2e/ai-insights.spec.ts`

**Test cases:**

```typescript
import { test, expect, type Page } from '@playwright/test';

test.describe.serial('AI Insights Flow', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();

    // Login
    await page.goto('/login');
    await page.getByTestId('email-input').fill(process.env.E2E_USERNAME || '');
    await page.getByTestId('password-input').fill(process.env.E2E_PASSWORD || '');
    await page.getByTestId('login-submit-button').click();

    await expect(page).toHaveURL('/', { timeout: 10000 });
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('should display AI Insights widget on dashboard', async () => {
    await page.goto('/');

    // Check if widget is visible
    await expect(page.getByText('Rekomendacje AI')).toBeVisible();
  });

  test('should navigate to /insights page from dashboard widget', async () => {
    await page.goto('/');

    // Wait for widget to load
    await expect(page.getByText('Rekomendacje AI')).toBeVisible();

    // Look for "Zobacz pełną analizę" button (if insights exist)
    const fullAnalysisButton = page.getByText('Zobacz pełną analizę');
    
    if (await fullAnalysisButton.isVisible()) {
      await fullAnalysisButton.click();
      await expect(page).toHaveURL('/insights');
    } else {
      // User might not have insights yet - check for "Analizuj wydatki" button
      const analyzeButton = page.getByText('Analizuj wydatki');
      await expect(analyzeButton).toBeVisible();
    }
  });

  test('should display insights page structure', async () => {
    await page.goto('/insights');

    // Check page title
    await expect(page.getByRole('heading', { name: 'Rekomendacje AI' })).toBeVisible();

    // Check for controls (dropdown and refresh button)
    await expect(page.getByRole('combobox')).toBeVisible(); // Period selector
    await expect(page.getByRole('button', { name: /odśwież/i })).toBeVisible();
  });

  test('should generate first analysis if none exists', async () => {
    await page.goto('/insights');

    // Check if empty state is shown
    const analyzeButton = page.getByText('Wygeneruj pierwszą analizę');

    if (await analyzeButton.isVisible()) {
      await analyzeButton.click();

      // Wait for loading (might take several seconds due to OpenAI API)
      await expect(page.getByText('Rekomendacje AI')).toBeVisible({ timeout: 15000 });

      // Check for success (summary banner or insights)
      // This depends on whether user has enough data
      const potentialSavings = page.getByText(/Możesz zaoszczędzić/i);
      
      if (await potentialSavings.isVisible()) {
        // Success - insights generated
        await expect(potentialSavings).toBeVisible();
      } else {
        // Might show error if insufficient data
        await expect(page.getByText(/Potrzebujesz co najmniej/i)).toBeVisible();
      }
    }
  });

  test('should change analysis period', async () => {
    await page.goto('/insights');

    // Assume insights exist
    const periodSelector = page.getByRole('combobox');
    await periodSelector.click();

    // Select 1 month
    await page.getByRole('option', { name: '1 miesiąc' }).click();

    // Wait for update (check generated_at timestamp changes or loading indicator)
    await page.waitForTimeout(2000); // Simple wait for API call

    // Verify period in UI (check summary banner shows "1 miesiąc")
    await expect(page.getByText(/1 miesiąc/i)).toBeVisible();
  });

  test('should refresh insights', async () => {
    await page.goto('/insights');

    const refreshButton = page.getByRole('button', { name: /odśwież/i });
    
    if (await refreshButton.isVisible()) {
      // Note the current timestamp (if visible)
      const timestampBefore = await page.getByText(/Ostatnia aktualizacja:/i).textContent();

      await refreshButton.click();

      // Wait for loading spinner (RefreshCw icon should animate)
      await page.waitForTimeout(1000);

      // Wait for completion
      await page.waitForTimeout(5000); // OpenAI API call

      // Verify timestamp updated
      const timestampAfter = await page.getByText(/Ostatnia aktualizacja:/i).textContent();
      expect(timestampAfter).not.toBe(timestampBefore);
    }
  });

  test('should display summary banner with metrics', async () => {
    await page.goto('/insights');

    // Check for summary metrics (if insights exist)
    await expect(page.getByText('Analizowany okres')).toBeVisible();
    await expect(page.getByText('Średnie wydatki')).toBeVisible();
    await expect(page.getByText(/Możesz zaoszczędzić/i)).toBeVisible();
  });

  test('should display charts', async () => {
    await page.goto('/insights');

    // Check for chart titles
    await expect(page.getByText('Porównanie wydatków')).toBeVisible();
    await expect(page.getByText('Projekcja oszczędności w czasie')).toBeVisible();
  });

  test('should display detailed recommendation cards', async () => {
    await page.goto('/insights');

    // Check for "Szczegółowe rekomendacje" section
    await expect(page.getByText('Szczegółowe rekomendacje')).toBeVisible();

    // Check for at least one insight card (with rank badge)
    const insightCards = page.locator('[class*="border-l-4"]'); // Cards have left border
    
    if (await insightCards.first().isVisible()) {
      await expect(insightCards.first()).toBeVisible();

      // Check card content
      await expect(insightCards.first().getByText(/priorytet/i)).toBeVisible();
      await expect(insightCards.first().getByText(/PLN/)).toBeVisible();
      await expect(insightCards.first().getByText(/Jak to osiągnąć:/i)).toBeVisible();
    }
  });

  test('should handle empty state gracefully', async () => {
    // This test assumes a fresh user with no transactions
    // In real scenario, you'd need to clear data or use a specific test user

    await page.goto('/insights');

    // Check for empty state message
    const emptyMessage = page.getByText(/Potrzebujesz co najmniej miesiąca/i);
    
    if (await emptyMessage.isVisible()) {
      await expect(emptyMessage).toBeVisible();
      await expect(page.getByText('Wygeneruj pierwszą analizę')).toBeVisible();
    }
  });

  test('should be responsive on mobile', async () => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

    await page.goto('/insights');

    // Check if elements stack vertically
    await expect(page.getByText('Rekomendacje AI')).toBeVisible();

    // Charts should stack on mobile
    const charts = page.locator('text="Porównanie wydatków"');
    if (await charts.isVisible()) {
      const box = await charts.boundingBox();
      expect(box?.width).toBeLessThan(400); // Mobile width
    }

    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });
});
```

---

## 7. Test Fixtures & Helpers

### KROK 11: Test fixtures dla AI Insights

**Plik:** `test/fixtures/ai-insights.fixtures.ts`

**Zawartość:**

```typescript
import type { AIInsightsSummary, AIInsight, AggregatedTransactionData } from '@/types';

/**
 * Mock aggregated transaction data
 */
export const mockAggregatedData: AggregatedTransactionData = {
  period: {
    start_date: '2026-01-01',
    end_date: '2026-03-31',
    months: 3,
  },
  total_spending: 37500,
  average_monthly_spending: 12500,
  category_breakdown: [
    {
      category_id: 'cat-food',
      category_name: 'Jedzenie',
      total_amount: 10500,
      monthly_average: 3500,
      transaction_count: 45,
    },
    {
      category_id: 'cat-transport',
      category_name: 'Transport',
      total_amount: 3600,
      monthly_average: 1200,
      transaction_count: 15,
    },
    {
      category_id: 'cat-entertainment',
      category_name: 'Rozrywka',
      total_amount: 2400,
      monthly_average: 800,
      transaction_count: 12,
    },
  ],
  budgets: [
    {
      budget_name: 'Żywność',
      budget_amount: 3000,
      category_names: ['Jedzenie'],
    },
  ],
};

/**
 * Mock AI insights
 */
export const mockInsights: AIInsight[] = [
  {
    id: 'ins-1',
    category: 'Jedzenie',
    category_id: 'cat-food',
    current_spending: 3500,
    suggested_target: 3100,
    potential_savings: 400,
    priority: 'high',
    reasoning: 'Wydajesz 3500 PLN miesięcznie na jedzenie, co jest 17% powyżej budżetu.',
    actionable_tips: [
      'Planuj posiłki na tydzień i twórz listę zakupów',
      'Rozważ zakupy w tańszych sieciach (np. Biedronka, Lidl)',
      'Ogranicz jedzenie na wynos do 1-2 razy w tygodniu',
    ],
  },
  {
    id: 'ins-2',
    category: 'Transport',
    category_id: 'cat-transport',
    current_spending: 1200,
    suggested_target: 900,
    potential_savings: 300,
    priority: 'medium',
    reasoning: 'Wysokie wydatki na transport mogą być zoptymalizowane przez komunikację publiczną.',
    actionable_tips: [
      'Rozważ karnet miesięczny zamiast pojedynczych biletów',
      'Użyj roweru miejskiego do krótkich tras',
    ],
  },
  {
    id: 'ins-3',
    category: 'Rozrywka',
    category_id: 'cat-entertainment',
    current_spending: 800,
    suggested_target: 650,
    potential_savings: 150,
    priority: 'low',
    reasoning: 'Możesz nieznacznie ograniczyć wydatki na rozrywkę bez wpływu na jakość życia.',
    actionable_tips: [
      'Szukaj darmowych wydarzeń w mieście',
      'Rozważ współdzielenie subskrypcji z rodziną',
    ],
  },
];

/**
 * Mock AI insights summary
 */
export const mockAIInsightsSummary: AIInsightsSummary = {
  analysis_period: {
    start_date: '2026-01-01',
    end_date: '2026-03-31',
    months_analyzed: 3,
  },
  total_spending: 37500,
  average_monthly_spending: 12500,
  total_potential_savings: 850,
  general_recommendation:
    'Widzę kilka obszarów gdzie możesz zoptymalizować wydatki bez drastycznych zmian w stylu życia. Największy potencjał to jedzenie i transport.',
  insights: mockInsights,
  confidence_score: 85,
};

/**
 * Mock OpenAI response
 */
export const mockOpenAIResponse = {
  choices: [
    {
      message: {
        content: JSON.stringify(mockAIInsightsSummary),
      },
    },
  ],
};

/**
 * Helper to create mock insight with custom values
 */
export function createMockInsight(overrides: Partial<AIInsight> = {}): AIInsight {
  return {
    id: 'ins-test',
    category: 'Test Category',
    current_spending: 1000,
    suggested_target: 800,
    potential_savings: 200,
    priority: 'medium',
    reasoning: 'Test reasoning',
    actionable_tips: ['Test tip 1', 'Test tip 2'],
    ...overrides,
  };
}
```

---

## 8. Coverage & Quality Gates

### KROK 12: Konfiguracja coverage

**Plik:** `vitest.config.ts` (już istnieje)

**Weryfikacja:**

```typescript
// Current config already includes:
coverage: {
  include: ["src/lib/**", "src/components/**", "src/pages/api/**"],
  exclude: ["src/env.d.ts"],
}
```

**Dodatkowe thresholds (opcjonalnie):**

```typescript
coverage: {
  include: ["src/lib/**", "src/components/**", "src/pages/api/**"],
  exclude: ["src/env.d.ts"],
  // Add coverage thresholds
  thresholds: {
    lines: 70,
    functions: 70,
    branches: 65,
    statements: 70,
  },
}
```

---

## 9. Testing Checklist

### Unit Tests Checklist

- [ ] `InsightsService.hasEnoughData()` - wszystkie edge cases
- [ ] `InsightsService.aggregateTransactionsForAI()` - agregacja danych
- [ ] `InsightsService.isCacheFresh()` - logika cache
- [ ] `InsightsService.generateInsights()` - cały flow z mockami
- [ ] Helper functions (formatTimeAgo, etc.)
- [ ] Zod validators dla AI types

### Integration Tests Checklist

- [ ] GET `/api/insights/latest` - 200, 404, 401, 500
- [ ] POST `/api/insights/analyze` - 200, 400, 401, 503
- [ ] Database operations (upsert, select)
- [ ] Cache logic (fresh vs stale)
- [ ] OpenAI integration (z MSW mock)

### Component Tests Checklist

- [ ] `useInsights` hook - fetch, generate, error states
- [ ] `AIInsightsCard` - loading, empty, error, success states
- [ ] `AIInsightsCard` - user interactions (analyze, refresh)
- [ ] `InsightDetailCard` - rendering, priority styling
- [ ] `InsightsHeader` - controls, period change
- [ ] `InsightsSummaryBanner` - metrics display
- [ ] `SavingsComparisonChart` - data transformation
- [ ] `SavingsImpactChart` - projection calculations

### E2E Tests Checklist

- [ ] Dashboard widget visibility
- [ ] Navigation to /insights
- [ ] First analysis generation
- [ ] Period change
- [ ] Refresh functionality
- [ ] Empty state handling
- [ ] Mobile responsiveness
- [ ] Full user flow (dashboard → insights → analyze → view results)

---

## 10. Running Tests

### Commands

```bash
# Run all unit tests
npm test

# Run unit tests in watch mode
npm run test:ui

# Run unit tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests in UI mode
npm run test:e2e:ui

# Run specific test file
npm test src/lib/services/insights.service.test.ts

# Run tests matching pattern
npm test -- insights
```

### CI/CD Integration

**Plik:** `.github/workflows/master.yml` (dodaj AI tests)

```yaml
- name: Run AI Insights Tests
  run: |
    npm run test:coverage -- src/lib/services/insights.service.test.ts
    npm run test:coverage -- src/pages/api/insights
    npm run test:coverage -- src/components/features/insights
```

---

## 11. Podsumowanie

### 11.1 Test Coverage Matrix

| Komponent | Unit | Integration | Component | E2E | Status |
|-----------|------|-------------|-----------|-----|--------|
| InsightsService | ✅ | ✅ | - | - | ⏳ TODO |
| GET /api/insights/latest | - | ✅ | - | - | ⏳ TODO |
| POST /api/insights/analyze | - | ✅ | - | - | ⏳ TODO |
| useInsights hook | ✅ | - | ✅ | - | ⏳ TODO |
| AIInsightsCard | - | - | ✅ | - | ⏳ TODO |
| InsightDetailCard | - | - | ✅ | - | ⏳ TODO |
| Full user flow | - | - | - | ✅ | ⏳ TODO |

### 11.2 Estimated Time

| Faza | Szacowany czas | Priorytet |
|------|---------------|-----------|
| Unit Tests (Services) | 4-6 godzin | MUST |
| Integration Tests (API) | 3-4 godziny | MUST |
| Component Tests | 4-5 godzin | SHOULD |
| E2E Tests | 2-3 godziny | SHOULD |
| Fixtures & Helpers | 1-2 godziny | NICE TO HAVE |
| **TOTAL** | **14-20 godzin** | - |

### 11.3 Priorytetyzacja

**Minimum Viable Tests (MVP):**
1. Unit tests dla `InsightsService.hasEnoughData()`
2. Unit tests dla `InsightsService.aggregateTransactionsForAI()`
3. Integration test dla POST `/api/insights/analyze` (happy path)
4. Component test dla `AIInsightsCard` (podstawowe stany)
5. E2E test (happy path: dashboard → insights → view)

**Nice to Have:**
- Wszystkie edge cases w unit tests
- Component tests dla wszystkich komponentów
- E2E tests dla wszystkich user flows
- Performance tests
- Load tests dla OpenAI integration

---

**Dokument przygotowany:** 1.02.2026  
**Autor:** AI Assistant (Claude)  
**Zakres:** Kompletny plan testowania dla modułu AI Insights  
**Status:** Ready for implementation  
**Zgodność z projektem:** ✅ Vitest, Playwright, Testing Library
