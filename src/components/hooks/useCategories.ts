import { useState, useCallback } from "react";
import type { 
  CategoryDTO, 
  CreateCategoryCommand, 
  UpdateCategoryCommand 
} from "@/types";

interface UseCategoriesResult {
  categories: CategoryDTO[];
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
  addCategory: (data: CreateCategoryCommand) => Promise<CategoryDTO>;
  updateCategory: (id: string, data: UpdateCategoryCommand) => Promise<CategoryDTO>;
  deleteCategory: (id: string) => Promise<void>;
}

export function useCategories(): UseCategoriesResult {
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setError(null);
    try {
      const response = await fetch("/api/categories");
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      setIsError(true);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addCategory = async (data: CreateCategoryCommand): Promise<CategoryDTO> => {
    const response = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Failed to create category");
    }

    const newCategory = await response.json();
    setCategories((prev) => [newCategory, ...prev]);
    return newCategory;
  };

  const updateCategory = async (id: string, data: UpdateCategoryCommand): Promise<CategoryDTO> => {
    const response = await fetch(`/api/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Failed to update category");
    }

    const updatedCategory = await response.json();
    setCategories((prev) =>
      prev.map((cat) => (cat.id === id ? updatedCategory : cat))
    );
    return updatedCategory;
  };

  const deleteCategory = async (id: string): Promise<void> => {
    const response = await fetch(`/api/categories/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      // Handle 409 Conflict specifically if needed by the caller
      if (response.status === 409) {
        throw new Error("CATEGORY_HAS_TRANSACTIONS");
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || "Failed to delete category");
    }

    setCategories((prev) => prev.filter((cat) => cat.id !== id));
  };

  return {
    categories,
    isLoading,
    isError,
    error,
    fetchCategories,
    addCategory,
    updateCategory,
    deleteCategory,
  };
}

