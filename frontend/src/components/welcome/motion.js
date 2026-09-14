/**
 * The motion language, kept local so this folder has no reach outside itself.
 *
 * Every curve here is an ease-OUT: motion arrives and settles, never
 * overshoots. Nothing bounces, springs or rubber-bands — distance stays small
 * and duration stays long, which is what the eye reads as weight rather than
 * as speed.
 */

export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1]
export const EASE_OUT_QUART = [0.22, 1, 0.36, 1]
export const EASE_IN_OUT = [0.65, 0, 0.35, 1]
