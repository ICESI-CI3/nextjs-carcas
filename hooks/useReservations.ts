import { useQuery } from '@tanstack/react-query'
import axios from '../lib/api'

type Reservation = {
  id: string
  status: string
  createdAt: string
  expiresAt?: string
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

export function useMyReservations(){
  return useQuery<Reservation[]>({
    queryKey: ['my-reservations'],
    queryFn: async () => {
      const { data } = await axios.get('/reservations/my')
      return data
    },
    staleTime: 30_000,
  })
}

export function usePendingReservations(enabled: boolean){
  return useQuery<Reservation[]>({
    queryKey: ['reservations', 'pending'],
    queryFn: async () => {
      const { data } = await axios.get('/reservations/pending')
      return data
    },
    enabled,
    staleTime: 15_000,
  })
}

export function useAllReservations(enabled: boolean){
  return useQuery<Reservation[]>({
    queryKey: ['reservations', 'all'],
    queryFn: async () => {
      const { data } = await axios.get('/reservations')
      return data
    },
    enabled,
    staleTime: 15_000,
  })
}
