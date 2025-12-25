export const mockSportsData = [
  {
    id: "1",
    eventType: "1",
    name: "Football",
    marketCount: 156,
    status: "active",
  },
  {
    id: "2",
    eventType: "2",
    name: "Cricket",
    marketCount: 89,
    status: "active",
  },
  {
    id: "3",
    eventType: "3",
    name: "Tennis",
    marketCount: 67,
    status: "active",
  },
  {
    id: "4",
    eventType: "4",
    name: "Basketball",
    marketCount: 45,
    status: "active",
  },
  {
    id: "5",
    eventType: "5",
    name: "Baseball",
    marketCount: 34,
    status: "active",
  },
  {
    id: "6",
    eventType: "6",
    name: "Ice Hockey",
    marketCount: 28,
    status: "active",
  },
];

export const mockSeriesData = (eventTypeId: string) => [
  { id: "10001", name: `Premier League ${eventTypeId}`, marketCount: 45 },
  { id: "10002", name: `Champions League ${eventTypeId}`, marketCount: 32 },
  { id: "10003", name: `World Cup ${eventTypeId}`, marketCount: 28 },
];

export const mockMatchesData = [
  {
    id: "1001",
    name: "Manchester United vs Liverpool",
    inPlay: true,
    openDate: new Date().toISOString(),
    marketCount: 15,
    event: { countryCode: "GB" },
  },
  {
    id: "1002",
    name: "Barcelona vs Real Madrid",
    inPlay: false,
    openDate: new Date(Date.now() + 7200000).toISOString(),
    marketCount: 18,
    event: { countryCode: "ES" },
  },
  {
    id: "1003",
    name: "Bayern Munich vs PSG",
    inPlay: false,
    openDate: new Date(Date.now() + 86400000).toISOString(),
    marketCount: 12,
    event: { countryCode: "DE" },
  },
];

export const mockOddsData = [
  {
    marketId: "M1",
    market: "Match Winner",
    status: "OPEN",
    inplay: true,
    totalMatched: 250000,
    runners: [
      {
        selectionId: 1,
        runner: "Team A",
        status: "ACTIVE",
        lastPriceTraded: 2.5,
        back: [
          { price: 2.6, size: 1000 },
          { price: 2.5, size: 800 },
        ],
        lay: [
          { price: 2.7, size: 900 },
          { price: 2.8, size: 700 },
        ],
      },
      {
        selectionId: 2,
        runner: "Team B",
        status: "ACTIVE",
        lastPriceTraded: 1.8,
        back: [
          { price: 1.9, size: 1200 },
          { price: 1.8, size: 1000 },
        ],
        lay: [
          { price: 2.0, size: 1100 },
          { price: 2.1, size: 900 },
        ],
      },
    ],
  },
];

export const mockSessionsData = [
  {
    RunnerName: "Team A Total Runs",
    SelectionId: "S1",
    GameStatus: "active",
    BackPrice1: 150,
    BackSize1: 500,
    LayPrice1: 155,
    LaySize1: 400,
    min: "100",
    max: "50000",
    gtype: "session",
  },
];

export const mockBookmakersData = [
  {
    marketId: "BM1",
    marketName: "Match Winner",
    status: "OPEN",
    provider: "Betfair",
    totalMatched: 180000,
    runners: [
      {
        selectionId: 1,
        runnerName: "Team A",
        status: "ACTIVE",
        lastPriceTraded: 2.4,
        back: [{ price: 2.5, size: "1000" }],
        lay: [{ price: 2.6, size: "800" }],
      },
    ],
  },
];
