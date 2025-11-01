import { useQuery } from '@tanstack/react-query'
import axios from '../lib/api'

type Loan = {
  id: string
  status: string
  borrowedAt: string
  dueDate?: string
  returnedAt?: string
  fine?: number
  copy?: {
    id: string
    code?: string
    book?: {
      id: string
      title: string
    }
  }
  user?: {
    id: string
    firstName?: string
    lastName?: string
    email: string
  }
}

export function useMyLoans(){
  return useQuery<Loan[]>({
    queryKey: ['my-loans'],
    queryFn: async () => {
      const { data } = await axios.get('/loans/my')
      return data
    },
    staleTime: 30_000,
  })
}

export function useAllLoans(enabled: boolean){
  return useQuery<Loan[]>({
    queryKey: ['loans', 'all'],
    queryFn: async () => {
      const { data } = await axios.get('/loans')
      return data
    },
    enabled,
    staleTime: 15_000,
  })
}
