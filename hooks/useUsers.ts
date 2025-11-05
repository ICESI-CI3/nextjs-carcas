import { useQuery } from '@tanstack/react-query'
import axios from '../lib/api'

type UsersQuery = {
  search?: string
  page?: number
  pageSize?: number
}

type UsersResponse = {
  items: any[]
  meta: {
    total: number
    page: number
    pageSize: number
  }
}

export function useUsers({ search, page = 1, pageSize = 10 }: UsersQuery) {
  return useQuery<UsersResponse>({
    queryKey: ['users', { search, page, pageSize }],
    queryFn: async () => {
      const params: Record<string, unknown> = {
        search: search?.trim() || undefined,
        q: search?.trim() || undefined,
        page,
        limit: pageSize,
      }
      const { data } = await axios.get('/users', { params })

      if (Array.isArray(data)) {
        const start = (page - 1) * pageSize
        const slice = data.slice(start, start + pageSize)
        return {
          items: slice,
          meta: { total: data.length, page, pageSize },
        }
      }

      const inferredItems = data.items ?? data.data ?? []
      const meta = data.meta ?? {
        total: data.total ?? inferredItems.length,
        page: data.page ?? page,
        pageSize: data.limit ?? pageSize,
      }

      return {
        items: inferredItems,
        meta: {
          total: Number(meta.total) || inferredItems.length,
          page: Number(meta.page) || page,
          pageSize: Number(meta.pageSize ?? meta.limit) || pageSize,
        },
      }
    },
    staleTime: 15_000,
  })
}

export default useUsers
