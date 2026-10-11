import { useCallback, useEffect, useState } from 'react'
import type { LeaderboardResponse } from '../worker/types.ts'
import { fetchLeaderboard } from './api.ts'

// Loads the board, and gives a way to load it again after a check or an add.
export function useLeaderboard() {
  const [boards, setBoards] = useState<LeaderboardResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(() => {
    fetchLeaderboard()
      .then((loaded) => {
        setBoards(loaded)
        setError(null)
      })
      .catch((caught: Error) => setError(caught.message))
  }, [])

  useEffect(reload, [reload])
  return { boards, error, reload }
}
