/**
 * Serialises every write to one match.
 *
 * Two buzzes arriving in the same millisecond used to be a genuine
 * read-modify-write race: both requests read a state with nobody buzzed in,
 * both reduced, and the second write overwrote the first — so the pad that lost
 * could still end up on the screen. Everything runs in one process now, so the
 * fix is a queue rather than a distributed lock.
 *
 * Ordering is arrival order, which is exactly what a buzzer needs: whoever
 * reached the server first wins, and the loser's action is reduced against a
 * state where the room is already disarmed.
 */
const tails = new Map<string, Promise<void>>()

export function withMatchLock<T>(matchId: string, work: () => Promise<T>): Promise<T> {
  const previous = tails.get(matchId) ?? Promise.resolve()
  const result = previous.then(work)

  // The tail deliberately swallows failures. It exists to order the next
  // writer, and one rejected action must not wedge every action behind it.
  const tail = result.then(
    () => undefined,
    () => undefined,
  )
  tails.set(matchId, tail)
  void tail.then(() => {
    // Only drop the entry if nothing queued behind us while we ran.
    if (tails.get(matchId) === tail) tails.delete(matchId)
  })

  return result
}
