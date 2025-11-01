import { useQuery } from '@tanstack/react-query'
import axios from '../lib/api'

export type Book = {
  id: string
  title: string
  author?: string
  thumbnail?: string
  categories?: string[]
  copies?: any[]
  isbn?: string
}

type BooksQuery = {
  search?: string
  page?: number
  pageSize?: number
}

type BooksResponse = {
  items: Book[]
  meta: {
    total: number
    page: number
    pageSize: number
  }
}

export function useBooks({ search, page = 1, pageSize = 10 }: BooksQuery){
  return useQuery<BooksResponse>({
    queryKey: ['books', { search, page, pageSize }],
    placeholderData: previousData => previousData,
    queryFn: async () => {
      const params: Record<string, unknown> = {
        search: search?.trim() || undefined,
        page,
        limit: pageSize,
      }
      const { data } = await axios.get('/books', { params })

      if (Array.isArray(data)) {
        const start = (page - 1) * pageSize
        const slice = data.slice(start, start + pageSize)
        return {
          items: slice,
          meta: {
            total: data.length,
            page,
            pageSize,
          },
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
  })
}
