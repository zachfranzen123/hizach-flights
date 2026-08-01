export type Flight = {
  airline: string
  airlineIata: string
  airlineIcao: string
  flightNumber: string
  origin: string
  originCity: string
  destination: string
  destinationCity: string
  departureDate: string
  departureTime: string
  arrivalTime: string
  aircraftName: string
  aircraftCode: string
  status: 'current' | 'up-next' | 'complete'
}

export const sampleFlight: Flight = {
  airline: 'Iberia',
  airlineIata: 'IB',
  airlineIcao: 'IBE',
  flightNumber: '356',
  origin: 'SFO',
  originCity: 'San Francisco',
  destination: 'MAD',
  destinationCity: 'Madrid',
  departureDate: '10 AUG 2026',
  departureTime: '18:15 PDT',
  arrivalTime: '14:30 CEST',
  aircraftName: 'Airbus A330-200',
  aircraftCode: 'A332',
  status: 'up-next',
}
