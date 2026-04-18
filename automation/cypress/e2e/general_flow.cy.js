// General waste → 4-yard skip → confirm booking
describe('General waste flow', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('completes a full general waste booking', () => {
    // Step 1: Postcode
    cy.get('[data-testid="step-postcode"]').should('be.visible')
    cy.get('[data-testid="postcode-input"]').type('SW1A 1AA')
    cy.get('[data-testid="lookup-btn"]').click()

    cy.get('[data-testid="address-list"]').should('be.visible')
    cy.get('[data-testid="address-option-addr_1"]').click()

    cy.get('[data-testid="next-btn"]').click()

    // Step 2: Waste type
    cy.get('[data-testid="step-waste"]').should('be.visible')
    cy.get('[data-testid="waste-general"]').click()
    cy.get('[data-testid="plasterboard-options"]').should('not.exist')
    cy.get('[data-testid="next-btn"]').click()

    // Step 3: Skip selection
    cy.get('[data-testid="step-skips"]').should('be.visible')
    cy.get('[data-testid="skip-grid"]').should('be.visible')

    // All 8 skips should be present and none disabled (general waste)
    cy.get('[data-testid="skip-grid"] [data-testid^="skip-"]').should('have.length', 8)
    cy.get('[data-disabled="true"]').should('have.length', 0)

    cy.get('[data-testid="skip-4-yard"]').click()
    cy.get('[data-testid="next-btn"]').click()

    // Step 4: Review
    cy.get('[data-testid="step-review"]').should('be.visible')

    cy.get('[data-testid="review-details"]').within(() => {
      cy.contains('10 Downing Street')
      cy.contains('SW1A 1AA')
      cy.contains('general')
      cy.contains('4-yard')
    })

    // Price breakdown should show net, VAT, and total
    cy.get('[data-testid="price-breakdown"]').within(() => {
      cy.contains('£120')   // net
      cy.contains('£24')    // VAT
    })
    cy.get('[data-testid="price-total"]').contains('£144')

    cy.get('[data-testid="confirm-btn"]').click()

    // Success
    cy.get('[data-testid="success-view"]').should('be.visible')
    cy.get('[data-testid="booking-id"]').invoke('text').should('match', /^BK-\d{5}$/)
  })

  it('shows inline validation for empty postcode', () => {
    cy.get('[data-testid="lookup-btn"]').click()
    cy.get('[data-testid="postcode-error"]').should('contain', 'required')
  })

  it('shows validation error for invalid postcode format', () => {
    cy.get('[data-testid="postcode-input"]').type('NOTAPOSTCODE')
    cy.get('[data-testid="lookup-btn"]').click()
    cy.get('[data-testid="postcode-error"]').should('contain', 'valid UK postcode')
  })

  it('shows empty state for EC1A 1BB', () => {
    cy.get('[data-testid="postcode-input"]').type('EC1A 1BB')
    cy.get('[data-testid="lookup-btn"]').click()
    cy.get('[data-testid="no-addresses"]').should('be.visible')
  })

  it('allows manual address entry when no addresses found', () => {
    cy.get('[data-testid="postcode-input"]').type('EC1A 1BB')
    cy.get('[data-testid="lookup-btn"]').click()
    cy.get('[data-testid="no-addresses"]').should('be.visible')
    cy.get('[data-testid="manual-entry-btn"]').click()
    cy.get('[data-testid="manual-address-input"]').type('42 Custom Lane, London')
    cy.get('[data-testid="next-btn"]').should('not.be.disabled')
  })

  it('next button is disabled until address is selected', () => {
    cy.get('[data-testid="postcode-input"]').type('SW1A 1AA')
    cy.get('[data-testid="lookup-btn"]').click()
    cy.get('[data-testid="address-list"]').should('be.visible')
    cy.get('[data-testid="next-btn"]').should('be.disabled')
    cy.get('[data-testid="address-option-addr_1"]').click()
    cy.get('[data-testid="next-btn"]').should('not.be.disabled')
  })

  it('shows retry button on API error (BS1 4DJ first call)', () => {
    cy.get('[data-testid="postcode-input"]').type('BS1 4DJ')
    cy.get('[data-testid="lookup-btn"]').click()
    cy.get('[data-testid="api-error"]').should('be.visible')
    cy.get('[data-testid="retry-btn"]').should('be.visible').click()
    cy.get('[data-testid="address-list"]').should('be.visible')
  })

  it('prevents double submit on confirm', () => {
    cy.intercept('POST', '/api/booking/confirm', {
      statusCode: 200,
      body: { status: 'success', bookingId: 'BK-99999' }
    }).as('confirmBooking')

    cy.get('[data-testid="postcode-input"]').type('SW1A 1AA')
    cy.get('[data-testid="lookup-btn"]').click()
    cy.get('[data-testid="address-option-addr_1"]').click()
    cy.get('[data-testid="next-btn"]').click()
    cy.get('[data-testid="waste-general"]').click()
    cy.get('[data-testid="next-btn"]').click()
    cy.get('[data-testid="skip-6-yard"]').click()
    cy.get('[data-testid="next-btn"]').click()

    cy.get('[data-testid="step-review"]').should('be.visible')
    cy.get('[data-testid="confirm-btn"]').should('not.be.disabled').click()
    cy.wait('@confirmBooking')

    // After confirmation the review step is gone — double submit is impossible
    cy.get('[data-testid="success-view"]').should('be.visible')
    cy.get('[data-testid="confirm-btn"]').should('not.exist')
  })

  it('back navigation returns to previous step', () => {
    cy.get('[data-testid="postcode-input"]').type('SW1A 1AA')
    cy.get('[data-testid="lookup-btn"]').click()
    cy.get('[data-testid="address-option-addr_1"]').click()
    cy.get('[data-testid="next-btn"]').click()

    cy.get('[data-testid="step-waste"]').should('be.visible')
    cy.get('[data-testid="back-btn"]').click()
    cy.get('[data-testid="step-postcode"]').should('be.visible')
  })

  it('can restart after a successful booking', () => {
    cy.get('[data-testid="postcode-input"]').type('SW1A 1AA')
    cy.get('[data-testid="lookup-btn"]').click()
    cy.get('[data-testid="address-option-addr_1"]').click()
    cy.get('[data-testid="next-btn"]').click()
    cy.get('[data-testid="waste-general"]').click()
    cy.get('[data-testid="next-btn"]').click()
    cy.get('[data-testid="skip-4-yard"]').click()
    cy.get('[data-testid="next-btn"]').click()
    cy.get('[data-testid="confirm-btn"]').click()

    cy.get('[data-testid="success-view"]').should('be.visible')
    cy.get('[data-testid="restart-btn"]').click()
    cy.get('[data-testid="step-postcode"]').should('be.visible')
  })
})
