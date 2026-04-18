beforeEach(() => {
  cy.request({
    method: 'DELETE',
    url: 'http://localhost:8000/api/booking/reset',
    failOnStatusCode: false,
  })
})