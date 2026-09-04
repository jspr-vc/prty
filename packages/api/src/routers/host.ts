import { hostPinSchema } from '@workspace/common/schemas'
import { resetHostPin } from '@workspace/db/bootstrap'
import { z } from 'zod'
import { isHostPin } from '../context'
import { createTRPCRouter, hostProcedure, publicProcedure } from '../trpc'

export const hostRouter = createTRPCRouter({
  /**
   * Lets the console tell "wrong PIN" from "not paired yet" without making the
   * user submit a form to find out. Takes the PIN as an argument rather than
   * reading the header so the sign-in screen can check before it stores one.
   */
  verify: publicProcedure
    .input(z.object({ pin: hostPinSchema }))
    .query(({ input }) => ({ ok: isHostPin(input.pin) })),

  /** Whether the PIN this client is already sending still works. */
  session: publicProcedure.query(({ ctx }) => ({ isHost: ctx.isHost })),

  rotatePin: hostProcedure.mutation(({ ctx }) => ({ pin: resetHostPin(ctx.db) })),
})
