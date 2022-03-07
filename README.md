# RARA Protocol

This project is the protocol powering RARA!

## Hardhat commands

Try running some of the following tasks:

```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
npx hardhat help
REPORT_GAS=true npx hardhat test
npx hardhat coverage
npx hardhat run scripts/deploy.ts
TS_NODE_FILES=true npx ts-node scripts/deploy.ts
npx eslint '**/*.{js,ts}'
npx eslint '**/*.{js,ts}' --fix
npx prettier '**/*.{json,sol,md}' --check
npx prettier '**/*.{json,sol,md}' --write
npx solhint 'contracts/**/*.sol'
npx solhint 'contracts/**/*.sol' --fix
npx hardhat size-contracts
yarn run coverage
```

## Etherscan verification

To try out Etherscan verification, you first need to deploy a contract to an Ethereum network that's supported by Etherscan, such as Ropsten.

In this project, copy the .env.example file to a file named .env, and then edit it to fill in the details. Enter your Etherscan API key, your Ropsten node URL (eg from Alchemy), and the private key of the account which will send the deployment transaction. With a valid .env file in place, first deploy your contract:

```shell
hardhat run --network ropsten scripts/sample-script.ts
```

Then, copy the deployment address and paste it in to replace `DEPLOYED_CONTRACT_ADDRESS` in this command:

```shell
npx hardhat verify --network ropsten DEPLOYED_CONTRACT_ADDRESS "Hello, Hardhat!"
```

## Performance optimizations

For faster runs of your tests and scripts, consider skipping ts-node's type checking by setting the environment variable `TS_NODE_TRANSPILE_ONLY` to `1` in hardhat's environment. For more details see [the documentation](https://hardhat.org/guides/typescript.html#performance-optimizations).

## Contract Storage => Graph Entities

- "Maker": the owner of a NFT that registers an NFT with the protocol
- "registering": action performed by Maker to create a Reaction
- "Reaction": transformed NFT that is available for sale
- "Curator": owner of Reaction(s) that is exchanging fan art for curator shares
- "reacting": exchanging fan art + comment for curator shares
- "curator shares": a Curators claim on the CurationVault
- "CuratorReaction": record that is created by reacting
- "CuratorPosition": record of the total curator shares a reactor owns

## GraphAPI

### Deploy rara-protocol contracts

1. Start a new local ethereum chain. Open a new terminal and run: `npx run chain`

1. Deploy rara-protocol contracts. Open a new terminal and run: `npx run deploy`

### Start local graph node (postgres, IPFS, graphAPI)

1. Have [Docker Desktop](https://www.docker.com/products/docker-desktop) running on your local machine.

2. Start Docker compose. Open a new terminal and run: `run-graph-docker`

If everything is running correctly you should see the docker containers running and `graph-node-1` will begin processing blocks:

    graph-node_1  | Feb 22 16:38:38.515 INFO Starting JSON-RPC admin server at: http://localhost:8020, component: JsonRpcServer
    graph-node_1  | Feb 22 16:38:38.520 INFO Started all subgraphs, component: SubgraphRegistrar
    graph-node_1  | Feb 22 16:38:38.530 INFO Starting GraphQL HTTP server at: http://localhost:8000, component: GraphQLServer
    graph-node_1  | Feb 22 16:38:38.533 INFO Starting index node server at: http://localhost:8030, component: IndexNodeServer
    graph-node_1  | Feb 22 16:38:38.536 INFO Starting metrics server at: http://localhost:8040, component: MetricsServer
    graph-node_1  | Feb 22 16:38:38.538 INFO Starting GraphQL WebSocket server at: ws://localhost:8001, component: SubscriptionServer
    graph-node_1  | Feb 22 16:38:38.558 INFO Downloading latest blocks from Ethereum. This may take a few minutes...
