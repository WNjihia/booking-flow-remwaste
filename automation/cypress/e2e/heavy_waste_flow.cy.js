// Heavy waste flow and plasterboard branching
describe('Heavy waste flow', () => {
  beforeEach(() => {
    cy.visit('/')
    // Navigate to step 1 and pick address
    cy.get('[data-testid="postcode-input"]').type('SW1A 1AA')
    cy.get('[data-testid="lookup-btn"]').click()
    cy.get('[data-testid="address-option-addr_1"]').click()
    cy.get('[data-testid="next-btn"]').click()
  })

  it('completes a full heavy waste booking with disabled skips visible', () => {
    // Step 2: Select heavy waste
    cy.get('[data-testid="waste-heavy"]').click()
    cy.get('[data-testid="heavy-waste-warning"]').should('be.visible')
    cy.get('[data-testid="next-btn"]').click()

    // Step 3: Skip selection
    cy.get('[data-testid="step-skips"]').should('be.visible')
    cy.get('[data-testid="heavy-waste-notice"]').should('be.visible')

    // 8-yard and 10-yard should be disabled
    cy.get('[data-testid="skip-8-yard"]').should('have.attr', 'data-disabled', 'true')
    cy.get('[data-testid="skip-10-yard"]').should('have.attr', 'data-disabled', 'true')

    // Disabled skips should still be visible (not hidden)
    cy.get('[data-testid="skip-8-yard"]').should('be.visible')
    cy.get('[data-testid="skip-10-yard"]').should('be.visible')

    // Enabled skips should be selectable
    cy.get('[data-testid="skip-12-yard"]').click()
    cy.get('[data-testid="skip-12-yard"]').should('have.class', 'selected')
    cy.get('[data-testid="next-btn"]').should('not.be.disabled')
    cy.get('[data-testid="next-btn"]').click()

    // Step 4: Review
    cy.get('[data-testid="review-details"]').within(() => {
      cy.contains('heavy')
      cy.contains('12-yard')
    })

    // Price: £260 + 20% VAT = £312
    cy.get('[data-testid="price-breakdown"]').within(() => {
      cy.contains('£260')
      cy.contains('£52')
    })
    cy.get('[data-testid="price-total"]').contains('£312')

    cy.get('[data-testid="confirm-btn"]').click()
    cy.get('[data-testid="success-view"]').should('be.visible')
    cy.get('[data-testid="booking-id"]').invoke('text').should('match', /^BK-\d{5}$/)
  })

  it('clicking a disabled skip does not select it', () => {
    cy.get('[data-testid="waste-heavy"]').click()
    cy.get('[data-testid="next-btn"]').click()

    cy.get('[data-testid="skip-8-yard"]').click()
    cy.get('[data-testid="skip-8-yard"]').should('not.have.class', 'selected')
    cy.get('[data-testid="next-btn"]').should('be.disabled')
  })

  it('switching from heavy to general re-enables all skips', () => {
    cy.get('[data-testid="waste-heavy"]').click()
    cy.get('[data-testid="next-btn"]').click()

    cy.get('[data-testid="skip-8-yard"]').should('have.attr', 'data-disabled', 'true')
    cy.get('[data-testid="back-btn"]').click()

    cy.get('[data-testid="waste-general"]').click()
    cy.get('[data-testid="next-btn"]').click()

    cy.get('[data-testid="skip-8-yard"]').should('have.attr', 'data-disabled', 'false')
    cy.get('[data-testid="skip-10-yard"]').should('have.attr', 'data-disabled', 'false')
  })
})

describe('Plasterboard flow', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.get('[data-testid="postcode-input"]').type('SW1A 1AA')
    cy.get('[data-testid="lookup-btn"]').click()
    cy.get('[data-testid="address-option-addr_1"]').click()
    cy.get('[data-testid="next-btn"]').click()
  })

  it('shows plasterboard options only when plasterboard is selected', () => {
    cy.get('[data-testid="plasterboard-options"]').should('not.exist')
    cy.get('[data-testid="waste-plasterboard"]').click()
    cy.get('[data-testid="plasterboard-options"]').should('be.visible')
    cy.get('[data-testid="waste-general"]').click()
    cy.get('[data-testid="plasterboard-options"]').should('not.exist')
  })

  it('next button is disabled until a plasterboard option is chosen', () => {
    cy.get('[data-testid="waste-plasterboard"]').click()
    cy.get('[data-testid="next-btn"]').should('be.disabled')
    cy.get('[data-testid="pb-option-separate_collection"]').click()
    cy.get('[data-testid="next-btn"]').should('not.be.disabled')
  })

  it('completes a plasterboard booking with separate collection', () => {
    cy.get('[data-testid="waste-plasterboard"]').click()
    cy.get('[data-testid="pb-option-separate_collection"]').click()
    cy.get('[data-testid="next-btn"]').click()

    // All skips available (plasterboard does not restrict sizes)
    cy.get('[data-testid="skip-grid"] [data-testid^="skip-"]').should('have.length', 8)
    cy.get('[data-disabled="true"]').should('have.length', 0)

    cy.get('[data-testid="skip-6-yard"]').click()
    cy.get('[data-testid="next-btn"]').click()

    cy.get('[data-testid="review-details"]').within(() => {
      cy.contains('plasterboard')
      cy.contains('Separate collection')
      cy.contains('6-yard')
    })

    // Price: £160 + £32 VAT = £192
    cy.get('[data-testid="price-total"]').contains('£192')

    cy.get('[data-testid="confirm-btn"]').click()
    cy.get('[data-testid="success-view"]').should('be.visible')
  })

  it('clears plasterboard option when switching away and back', () => {
    cy.get('[data-testid="waste-plasterboard"]').click()
    cy.get('[data-testid="pb-option-mixed_load"]').click()
    cy.get('[data-testid="waste-general"]').click()
    cy.get('[data-testid="waste-plasterboard"]').click()

    // option should be cleared — next still disabled
    cy.get('[data-testid="next-btn"]').should('be.disabled')
  })
})

describe('Simulated latency and error states', () => {
  it('shows loading state during slow postcode lookup (M1 1AE)', () => {
    cy.visit('/')
    cy.get('[data-testid="postcode-input"]').type('M1 1AE')
    cy.get('[data-testid="lookup-btn"]').click()
    cy.get('[data-testid="loading"]').should('be.visible')
    // Loading resolves after ~3s
    cy.get('[data-testid="address-list"]', { timeout: 8000 }).should('be.visible')
  })

  it('shows error then succeeds on retry (BS1 4DJ)', () => {
    cy.visit('/')
    cy.get('[data-testid="postcode-input"]').type('BS1 4DJ')
    cy.get('[data-testid="lookup-btn"]').click()
    cy.get('[data-testid="api-error"]').should('be.visible')
    cy.get('[data-testid="retry-btn"]').click()
    cy.get('[data-testid="address-list"]').should('be.visible')
  })
})
