import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { categoriesAPI } from '../services/api';
import type { 
  Category, 
  CategoryGroup, 
  CategoryContextType, 
  CreateCategoryRequest, 
  UpdateCategoryRequest,
  CategoryStats
} from '../types';

// =====================================================
// CategoryContext State Management - Phase 4 Core
// =====================================================

// State interface for reducer
interface CategoryState {
  categories: Category[];
  categoryGroups: CategoryGroup[];
  selectedCategory: string | null;
  sidebarCollapsed: boolean;
  loading: boolean;
  error: string | null;
  stats: CategoryStats | null;
  searchTerm: string;
  expandedGroups: Set<string>;
}

// Action types for reducer
type CategoryAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'SET_SELECTED_CATEGORY'; payload: string | null }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR_COLLAPSED'; payload: boolean }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'UPDATE_CATEGORY'; payload: { id: number; category: Category } }
  | { type: 'DELETE_CATEGORY'; payload: number }
  | { type: 'SET_STATS'; payload: CategoryStats }
  | { type: 'SET_SEARCH_TERM'; payload: string }
  | { type: 'TOGGLE_GROUP'; payload: string }
  | { type: 'SET_EXPANDED_GROUPS'; payload: Set<string> };

// Initial state
const initialState: CategoryState = {
  categories: [],
  categoryGroups: [],
  selectedCategory: null,
  sidebarCollapsed: false,
  loading: false,
  error: null,
  stats: null,
  searchTerm: '',
  expandedGroups: new Set(['personal', 'team', 'public']), // 默认展开所有分组
};

// State reducer
function categoryReducer(state: CategoryState, action: CategoryAction): CategoryState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };

    case 'SET_CATEGORIES': {
      const categories = action.payload;
      const categoryGroups = groupCategoriesByName(categories);
      return { 
        ...state, 
        categories, 
        categoryGroups,
        loading: false,
        error: null 
      };
    }

    case 'SET_SELECTED_CATEGORY':
      return { ...state, selectedCategory: action.payload };

    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed };

    case 'SET_SIDEBAR_COLLAPSED':
      return { ...state, sidebarCollapsed: action.payload };

    case 'ADD_CATEGORY': {
      const categories = [...state.categories, action.payload];
      const categoryGroups = groupCategoriesByName(categories);
      return { ...state, categories, categoryGroups };
    }

    case 'UPDATE_CATEGORY': {
      const categories = state.categories.map(cat => 
        cat.id === action.payload.id ? action.payload.category : cat
      );
      const categoryGroups = groupCategoriesByName(categories);
      return { ...state, categories, categoryGroups };
    }

    case 'DELETE_CATEGORY': {
      const categories = state.categories.filter(cat => cat.id !== action.payload);
      const categoryGroups = groupCategoriesByName(categories);
      return { ...state, categories, categoryGroups };
    }

    case 'SET_STATS':
      return { ...state, stats: action.payload };

    case 'SET_SEARCH_TERM':
      return { ...state, searchTerm: action.payload };

    case 'TOGGLE_GROUP': {
      const expandedGroups = new Set(state.expandedGroups);
      if (expandedGroups.has(action.payload)) {
        expandedGroups.delete(action.payload);
      } else {
        expandedGroups.add(action.payload);
      }
      return { ...state, expandedGroups };
    }

    case 'SET_EXPANDED_GROUPS':
      return { ...state, expandedGroups: action.payload };

    default:
      return state;
  }
}

// Helper function to group categories by name
function groupCategoriesByName(categories: Category[]): CategoryGroup[] {
  const groupMap = new Map<string, Category[]>();
  
  // Group categories by name
  categories.forEach(category => {
    if (!groupMap.has(category.name)) {
      groupMap.set(category.name, []);
    }
    groupMap.get(category.name)!.push(category);
  });

  // Convert to CategoryGroup array
  return Array.from(groupMap.entries()).map(([name, cats]) => ({
    name,
    categories: cats.sort((a, b) => a.scopeType.localeCompare(b.scopeType)),
    totalPrompts: cats.reduce((sum, cat) => sum + (cat.promptCount || 0), 0),
    scopes: [...new Set(cats.map(cat => cat.scopeType))],
    canCreate: cats.some(cat => cat.canEdit),
  }));
}

// Create context
const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

// Context provider component
export const CategoryProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [state, dispatch] = useReducer(categoryReducer, initialState);
  const navigate = useNavigate();
  const location = useLocation();

  // Load sidebar collapsed state from localStorage
  useEffect(() => {
    const collapsed = localStorage.getItem('sidebar-collapsed') === 'true';
    dispatch({ type: 'SET_SIDEBAR_COLLAPSED', payload: collapsed });
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', state.sidebarCollapsed.toString());
  }, [state.sidebarCollapsed]);

  // Parse selected category from URL
  useEffect(() => {
    const path = location.pathname;
    const categoryMatch = path.match(/^\/category\/(.+)$/);
    
    if (categoryMatch) {
      const categoryId = categoryMatch[1];
      dispatch({ type: 'SET_SELECTED_CATEGORY', payload: categoryId });
    } else if (path === '/') {
      dispatch({ type: 'SET_SELECTED_CATEGORY', payload: null });
    }
  }, [location.pathname]);

  // Load categories on mount
  useEffect(() => {
    refreshCategories();
  }, []);

  // Fetch categories from API
  const refreshCategories = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const [categoriesResult, statsResult] = await Promise.all([
        categoriesAPI.getCategories({ onlyActive: true }),
        categoriesAPI.getCategoryStats().catch(() => ({ stats: null }))
      ]);

      dispatch({ type: 'SET_CATEGORIES', payload: categoriesResult.categories });
      
      if (statsResult.stats) {
        dispatch({ type: 'SET_STATS', payload: statsResult.stats });
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: 'Failed to load categories. Please try again.' 
      });
    }
  }, []);

  // Select category and update URL
  const selectCategory = useCallback((categoryId: string | null) => {
    dispatch({ type: 'SET_SELECTED_CATEGORY', payload: categoryId });
    
    if (categoryId === null) {
      navigate('/');
    } else {
      navigate(`/category/${categoryId}`);
    }
  }, [navigate]);

  // Toggle sidebar
  const toggleSidebar = useCallback(() => {
    dispatch({ type: 'TOGGLE_SIDEBAR' });
  }, []);

  // Search categories
  const searchCategories = useCallback((term: string): Category[] => {
    if (!term.trim()) {
      return state.categories;
    }

    const lowerTerm = term.toLowerCase();
    return state.categories.filter(category =>
      category.name.toLowerCase().includes(lowerTerm) ||
      category.description?.toLowerCase().includes(lowerTerm)
    );
  }, [state.categories]);

  // Get category by ID
  const getCategoryById = useCallback((id: number): Category | undefined => {
    return state.categories.find(cat => cat.id === id);
  }, [state.categories]);

  // Get category group by name
  const getCategoryGroup = useCallback((name: string): CategoryGroup | undefined => {
    return state.categoryGroups.find(group => group.name === name);
  }, [state.categoryGroups]);

  // Create new category
  const createCategory = useCallback(async (data: CreateCategoryRequest): Promise<Category> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const result = await categoriesAPI.createCategory(data);
      const newCategory = result.category;
      
      dispatch({ type: 'ADD_CATEGORY', payload: newCategory });
      dispatch({ type: 'SET_LOADING', payload: false });
      
      return newCategory;
    } catch (error) {
      console.error('Failed to create category:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: 'Failed to create category. Please try again.' 
      });
      throw error;
    }
  }, []);

  // Update category
  const updateCategory = useCallback(async (
    id: number, 
    data: UpdateCategoryRequest
  ): Promise<Category> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const result = await categoriesAPI.updateCategory(id, data);
      const updatedCategory = result.category;
      
      dispatch({ 
        type: 'UPDATE_CATEGORY', 
        payload: { id, category: updatedCategory } 
      });
      dispatch({ type: 'SET_LOADING', payload: false });
      
      return updatedCategory;
    } catch (error) {
      console.error('Failed to update category:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: 'Failed to update category. Please try again.' 
      });
      throw error;
    }
  }, []);

  // Delete category
  const deleteCategory = useCallback(async (id: number): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      await categoriesAPI.deleteCategory(id);
      
      dispatch({ type: 'DELETE_CATEGORY', payload: id });
      dispatch({ type: 'SET_LOADING', payload: false });
      
      // If the deleted category was selected, clear selection
      if (state.selectedCategory === id.toString()) {
        selectCategory(null);
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: 'Failed to delete category. Please try again.' 
      });
      throw error;
    }
  }, [state.selectedCategory, selectCategory]);

  // Context value
  const contextValue: CategoryContextType = {
    // State
    categories: state.categories,
    categoryGroups: state.categoryGroups,
    selectedCategory: state.selectedCategory,
    sidebarCollapsed: state.sidebarCollapsed,
    loading: state.loading,
    error: state.error,

    // Actions
    selectCategory,
    toggleSidebar,
    searchCategories,
    getCategoryById,
    getCategoryGroup,
    createCategory,
    updateCategory,
    deleteCategory,
    refreshCategories,
  };

  return (
    <CategoryContext.Provider value={contextValue}>
      {children}
    </CategoryContext.Provider>
  );
};

// Custom hook to use category context
export const useCategory = (): CategoryContextType => {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error('useCategory must be used within a CategoryProvider');
  }
  return context;
};

// Export for direct access if needed
export { CategoryContext };
export default CategoryProvider;