import type { Context } from 'hono'
import { CHECK_MAX_AGE_MS } from './checks.ts'
import {
  ApiError,
  type Board,
  type LeaderboardAddResponse,
  type LeaderboardEntry,
  type LeaderboardResponse,
} from './types.ts'

type AppContext = Context<{ Bindings: Env }>

type RankedCheck = {
  githubLogin: string
  larpPercent: number
  avatarUrl: string | null
}

const BOARD_SIZE = 50
const SHARP_BELOW_PERCENT = 50
const ENTRY_COLUMNS = `github_login AS login, avatar_url AS avatarUrl,
  larp_percent AS larpPercent, updated_at AS updatedAt`
const UUID = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i

// Lists the board sorted both ways: the 50 sharpest first, and the 50 larpiest.
export async function listLeaderboard(c: AppContext) {
  const db = c.env.DB
  const [sharpest, larpiest] = await db.batch<LeaderboardEntry>([
    db
      .prepare(
        `SELECT ${ENTRY_COLUMNS} FROM leaderboard
         ORDER BY larp_percent ASC, added_at ASC LIMIT ?`,
      )
      .bind(BOARD_SIZE),
    db
      .prepare(
        `SELECT ${ENTRY_COLUMNS} FROM leaderboard
         ORDER BY larp_percent DESC, added_at ASC LIMIT ?`,
      )
      .bind(BOARD_SIZE),
  ])

  const response: LeaderboardResponse = {
    sharpest: sharpest.results,
    larpiest: larpiest.results,
  }
  return c.json(response)
}

// Reads the id of the check to put on the board.
async function readCheckId(c: AppContext): Promise<string> {
  const body = await c.req.json().catch(() => null)
  const checkId = body?.checkId

  if (typeof checkId !== 'string' || !UUID.test(checkId)) {
    throw new ApiError(400, 'check_expired')
  }
  return checkId
}

// Copies a recent GitHub check onto the board, or updates that profile's line.
async function saveEntry(db: D1Database, checkId: string) {
  const now = Date.now()

  return db
    .prepare(
      `INSERT INTO leaderboard (github_login, avatar_url, larp_percent, added_at, updated_at)
       SELECT github_login, avatar_url, larp_percent, ?, ? FROM checks
       WHERE id = ? AND created_at > ? AND github_login IS NOT NULL
       ON CONFLICT (github_login) DO UPDATE SET
         avatar_url = excluded.avatar_url,
         larp_percent = excluded.larp_percent,
         updated_at = excluded.updated_at
       RETURNING github_login AS login, larp_percent AS larpPercent`,
    )
    .bind(now, now, checkId, now - CHECK_MAX_AGE_MS)
    .first<{ login: string; larpPercent: number }>()
}

// Picks the sort that shows a profile best, and its place in it; ties share one.
async function findRank(db: D1Database, larpPercent: number) {
  const board: Board = larpPercent < SHARP_BELOW_PERCENT ? 'sharpest' : 'larpiest'
  const ahead = board === 'sharpest' ? '<' : '>'
  const row = await db
    .prepare(`SELECT COUNT(*) AS count FROM leaderboard WHERE larp_percent ${ahead} ?`)
    .bind(larpPercent)
    .first<{ count: number }>()

  return { board, rank: (row?.count ?? 0) + 1 }
}

// Puts the profile of a recent check on the board and says where it landed.
export async function addToLeaderboard(c: AppContext) {
  const checkId = await readCheckId(c)
  const entry = await saveEntry(c.env.DB, checkId)

  if (!entry) {
    throw new ApiError(400, 'check_expired')
  }
  const response: LeaderboardAddResponse = {
    login: entry.login,
    ...(await findRank(c.env.DB, entry.larpPercent)),
  }
  return c.json(response)
}

// Keeps a ranked profile's score current each time someone checks it again.
export async function refreshLeaderboard(db: D1Database, entry: RankedCheck) {
  try {
    await db
      .prepare(
        `UPDATE leaderboard SET larp_percent = ?, avatar_url = ?, updated_at = ?
         WHERE github_login = ?`,
      )
      .bind(entry.larpPercent, entry.avatarUrl, Date.now(), entry.githubLogin)
      .run()
  } catch (error) {
    console.error('Could not refresh the leaderboard', error)
  }
}
