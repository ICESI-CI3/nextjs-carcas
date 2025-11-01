import { useQuery } from '@tanstack/react-query'
import axios from '../lib/api'

export function useBooks(search?: string){
  return useQuery({
    queryKey: ['books', search],
    queryFn: async () => {
      const { data } = await axios.get('/books', { params: { search } })
      return data
    }
  })
}
