# RARA, the Social Curation Protocol for NFTs

*This protocol is officially open-sourced. Read about it in [RARA! Protocol for Devs](https://rara.mirror.xyz/GKuzfq1sv77nbjmfL_mRm2cVX3c_2UIWsDiklGccjiY).*

RARA is a social curation protocol first published on March 31st, 2022 in our [Loud Paper](https://rara.mirror.xyz/czut-1X7ubQcAwt3PnNPQHJ3DHn2TiQJvm4nxR8AwpQ).

Pronounced *“Rah rah!”* like a cheer, the goal of RARA’s protocol is to give a voice to a world of curators with NFT-backed reactions tokens, the Web3 equivalent of a like, emoji, or meme. Open to anyone wishing to curate NFTs with others, the objectives of the protocol are:

* Reward discovery and curation of NFTs;
* Enable personal expression through NFT-backed reactions; and
* Create public, composable curation data.

This project is the implementation of RARA's protocol as further detailed in our [documentation](https://docs.rara.social/).

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

If all contracts were deployed using the deploy script, you can verify them with:

```shell
npx hardhat --network mumbai etherscan-verify
```

## Performance optimizations

For faster runs of your tests and scripts, consider skipping ts-node's type checking by setting the environment variable `TS_NODE_TRANSPILE_ONLY` to `1` in hardhat's environment. For more details see the [documentation](https://hardhat.org/guides/typescript.html#performance-optimizations).

# Local Development

### Start a local chain

1. Open a new terminal and run: `yarn chain`

### Setup Metamask for local development

1. In Metamask, select localhost network from dropdown: "Localhost 8545"
2. Copy one of the private keys from the `yarn chain` output:

   ```
   Account #0: 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 (10000 ETH)
   Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```

3. In Metamask, go to "Import Account" and paste in private key

### Deploy rara-protocol contracts

1. Open a new terminal and run: `yarn deploy`

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

### Deploy GraphAPI

1. Generate types, schemas, etc: `yarn graph-codegen`
2. Build into WASM: `yarn graph-build`
3. Deploy locally: `yarn graph-build`
