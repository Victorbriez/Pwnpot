// Généré par `pnpm abi` depuis contracts/contracts/CTFPlatform.sol.
// Ne pas modifier à la main : relancer `pnpm abi` après un changement du contrat.
export const ctfPlatformAbi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "arbitrator_",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "contestationPeriod_",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "votingPeriod_",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "appealPeriod_",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "arbitratorTimeout_",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "AlreadyHasTicket",
    type: "error",
  },
  {
    inputs: [],
    name: "AlreadySolved",
    type: "error",
  },
  {
    inputs: [],
    name: "AlreadyVoted",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "required",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "provided",
        type: "uint256",
      },
    ],
    name: "BondTooLow",
    type: "error",
  },
  {
    inputs: [],
    name: "CTFFull",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "ctfId",
        type: "uint256",
      },
    ],
    name: "CTFNotFound",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "endsAt",
        type: "uint256",
      },
    ],
    name: "ContestationNotOver",
    type: "error",
  },
  {
    inputs: [],
    name: "DisputeAlreadyOpened",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "factory",
        type: "address",
      },
    ],
    name: "FactoryNotContract",
    type: "error",
  },
  {
    inputs: [],
    name: "InstanceAlreadyCreated",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidDuration",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidInstance",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "levelIndex",
        type: "uint256",
      },
    ],
    name: "InvalidLevel",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidMaxPlayers",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "ruling",
        type: "uint256",
      },
    ],
    name: "InvalidRuling",
    type: "error",
  },
  {
    inputs: [],
    name: "NoInstance",
    type: "error",
  },
  {
    inputs: [],
    name: "NoLevels",
    type: "error",
  },
  {
    inputs: [],
    name: "NoTicket",
    type: "error",
  },
  {
    inputs: [],
    name: "NotAppealable",
    type: "error",
  },
  {
    inputs: [],
    name: "NotArbitrator",
    type: "error",
  },
  {
    inputs: [],
    name: "NotImplemented",
    type: "error",
  },
  {
    inputs: [],
    name: "NotSolved",
    type: "error",
  },
  {
    inputs: [],
    name: "NothingToRefund",
    type: "error",
  },
  {
    inputs: [],
    name: "NothingToWithdraw",
    type: "error",
  },
  {
    inputs: [],
    name: "OrganizerCannotPlay",
    type: "error",
  },
  {
    inputs: [],
    name: "ReentrancyGuardReentrantCall",
    type: "error",
  },
  {
    inputs: [],
    name: "StartInPast",
    type: "error",
  },
  {
    inputs: [],
    name: "TicketPriceTooLow",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "at",
        type: "uint256",
      },
    ],
    name: "TimeoutNotReached",
    type: "error",
  },
  {
    inputs: [],
    name: "TitleTooLong",
    type: "error",
  },
  {
    inputs: [],
    name: "TooManyLevels",
    type: "error",
  },
  {
    inputs: [],
    name: "TransferFailed",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "disputeID",
        type: "uint256",
      },
    ],
    name: "UnknownDispute",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "expected",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "sent",
        type: "uint256",
      },
    ],
    name: "WrongDisputeBond",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "enum ICTFPlatform.Phase",
        name: "current",
        type: "uint8",
      },
    ],
    name: "WrongPhase",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "expected",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "sent",
        type: "uint256",
      },
    ],
    name: "WrongValue",
    type: "error",
  },
  {
    inputs: [],
    name: "ZeroArbitrator",
    type: "error",
  },
  {
    inputs: [],
    name: "ZeroCashPrize",
    type: "error",
  },
  {
    inputs: [],
    name: "ZeroPeriod",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "ctfId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "disputeID",
        type: "uint256",
      },
    ],
    name: "Appealed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "ctfId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "organizer",
        type: "address",
      },
    ],
    name: "CTFCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "ctfId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "Credited",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "ctfId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "contester",
        type: "address",
      },
    ],
    name: "DisputeOpened",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "ctfId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "cheated",
        type: "bool",
      },
    ],
    name: "Finalized",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "ctfId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "levelIndex",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "player",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "instance",
        type: "address",
      },
    ],
    name: "InstanceCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "ctfId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "levelIndex",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "player",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "LevelSolved",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "ctfId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "player",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "RefundClaimed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "ctfId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "cheated",
        type: "bool",
      },
    ],
    name: "Ruled",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "contract IArbitrator",
        name: "_arbitrator",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "_disputeID",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_ruling",
        type: "uint256",
      },
    ],
    name: "Ruling",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "ctfId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "player",
        type: "address",
      },
    ],
    name: "TicketBought",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "ctfId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "voter",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "cheated",
        type: "bool",
      },
    ],
    name: "Voted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "Withdrawn",
    type: "event",
  },
  {
    inputs: [],
    name: "MAX_DURATION",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MAX_LEVELS",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MAX_PLAYERS",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MAX_TITLE_LENGTH",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MIN_DURATION",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MIN_TICKET_PRICE",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "VALIDATION_GAS",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "appeal",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "appealPeriod",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "applyVoteAfterTimeout",
    outputs: [],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "arbitrator",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "arbitratorTimeout",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "ctfId",
        type: "uint256",
      },
    ],
    name: "buyTicket",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "ctfId",
        type: "uint256",
      },
    ],
    name: "claimRefund",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "contestationPeriod",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "string",
            name: "title",
            type: "string",
          },
          {
            internalType: "uint256",
            name: "startTime",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "endTime",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "ticketPrice",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "maxPlayers",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "cashPrize",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "organizerBond",
            type: "uint256",
          },
        ],
        internalType: "struct ICTFPlatform.CTFParams",
        name: "p",
        type: "tuple",
      },
      {
        internalType: "address[]",
        name: "factories",
        type: "address[]",
      },
    ],
    name: "createCTF",
    outputs: [
      {
        internalType: "uint256",
        name: "ctfId",
        type: "uint256",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "ctfId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "levelIndex",
        type: "uint256",
      },
    ],
    name: "createInstance",
    outputs: [
      {
        internalType: "address",
        name: "instance",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "ctfCount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "ctfId",
        type: "uint256",
      },
    ],
    name: "finalize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "ctfId",
        type: "uint256",
      },
    ],
    name: "getCTF",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "organizer",
            type: "address",
          },
          {
            internalType: "string",
            name: "title",
            type: "string",
          },
          {
            internalType: "uint256",
            name: "startTime",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "endTime",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "ticketPrice",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "maxPlayers",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "cashPrize",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "organizerBond",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "playerCount",
            type: "uint256",
          },
          {
            internalType: "bool",
            name: "finalized",
            type: "bool",
          },
          {
            internalType: "bool",
            name: "cheated",
            type: "bool",
          },
        ],
        internalType: "struct ICTFPlatform.CTF",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "ctfId",
        type: "uint256",
      },
    ],
    name: "getDispute",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "contester",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "bond",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "openedAt",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "votesCheated",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "votesNotCheated",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "appellant",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "appealFee",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "appealedAt",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "disputeID",
            type: "uint256",
          },
          {
            internalType: "bool",
            name: "appealed",
            type: "bool",
          },
          {
            internalType: "bool",
            name: "resolved",
            type: "bool",
          },
        ],
        internalType: "struct ICTFPlatform.Dispute",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "ctfId",
        type: "uint256",
      },
    ],
    name: "getLevels",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "factory",
            type: "address",
          },
          {
            internalType: "bytes32",
            name: "codehash",
            type: "bytes32",
          },
        ],
        internalType: "struct ICTFPlatform.Level[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "ctfId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "player",
        type: "address",
      },
    ],
    name: "getPlayer",
    outputs: [
      {
        components: [
          {
            internalType: "bool",
            name: "hasTicket",
            type: "bool",
          },
          {
            internalType: "bool",
            name: "refunded",
            type: "bool",
          },
          {
            internalType: "uint256",
            name: "score",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "lastSolveTime",
            type: "uint256",
          },
        ],
        internalType: "struct ICTFPlatform.Player",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "ctfId",
        type: "uint256",
      },
    ],
    name: "getPodium",
    outputs: [
      {
        internalType: "address[3]",
        name: "",
        type: "address[3]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "ctfId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "levelIndex",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "player",
        type: "address",
      },
    ],
    name: "instanceOf",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "ctfId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "levelIndex",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "player",
        type: "address",
      },
    ],
    name: "isSolved",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "openDispute",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "owed",
    outputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "ctfId",
        type: "uint256",
      },
    ],
    name: "phaseOf",
    outputs: [
      {
        internalType: "enum ICTFPlatform.Phase",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "rule",
    outputs: [],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "ctfId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "levelIndex",
        type: "uint256",
      },
    ],
    name: "submit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    name: "vote",
    outputs: [],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "votingPeriod",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const
