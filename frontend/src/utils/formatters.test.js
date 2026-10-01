import { describe, expect, it } from 'vitest'

import { splitInstallments } from './formatters'

describe('splitInstallments', () => {
  it('always adds back up to the total', () => {
    for (const cents of [733, 2851, 11637, 10000, 42900, 7, 1]) {
      const { count, baseCents, firstCents } = splitInstallments(cents, 12)
      expect(firstCents + baseCents * (count - 1)).toBe(cents)
      expect(baseCents).toBeGreaterThanOrEqual(1)
    }
  })

  it('puts the leftover cents in the first installment', () => {
    expect(splitInstallments(10000, 12)).toEqual({ count: 12, baseCents: 833, firstCents: 837 })
  })

  it('leaves every installment equal when the division is exact', () => {
    expect(splitInstallments(42900, 12)).toEqual({ count: 12, baseCents: 3575, firstCents: 3575 })
  })

  it('shrinks the count when the total cannot fill every installment', () => {
    expect(splitInstallments(7, 12).count).toBe(7)
    expect(splitInstallments(1, 12).count).toBe(1)
  })

  it('matches the backend split for the same amounts', () => {
    // Mirrors apps.storefront.tests.InstallmentSplitTests.
    expect(splitInstallments(733, 12)).toMatchObject({ baseCents: 61, firstCents: 62 })
    expect(splitInstallments(2851, 12)).toMatchObject({ baseCents: 237, firstCents: 244 })
    expect(splitInstallments(11637, 12)).toMatchObject({ baseCents: 969, firstCents: 978 })
  })
})
