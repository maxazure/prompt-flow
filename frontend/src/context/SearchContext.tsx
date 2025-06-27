import React, { createContext, useContext, useState, useCallback } from 'react';

// =====================================================
// SearchContext - 全局搜索状态管理
// =====================================================

interface SearchContextType {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  clearSearch: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const useSearch = (): SearchContextType => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

interface SearchProviderProps {
  children: React.ReactNode;
}

export const SearchProvider: React.FC<SearchProviderProps> = ({ children }) => {
  const [searchTerm, setSearchTermState] = useState('');

  const setSearchTerm = useCallback((term: string) => {
    setSearchTermState(term);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTermState('');
  }, []);

  const value: SearchContextType = {
    searchTerm,
    setSearchTerm,
    clearSearch,
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
};

export default SearchProvider;