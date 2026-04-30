import { createContext, useContext, useState, useCallback } from 'react'

const DataContext = createContext(null)

/**
 * DataProvider manages a global 'dataVersion' that increments whenever
 * transactions or budgets are modified. Pages can use this version to 
 * trigger immediate re-fetches of related data (like analytics/graphs).
 */
export const DataProvider = ({ children }) => {
  const [dataVersion, setDataVersion] = useState(0)

  const notifyDataChange = useCallback(() => {
    setDataVersion(prev => prev + 1)
  }, [])

  return (
    <DataContext.Provider value={{ dataVersion, notifyDataChange }}>
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
