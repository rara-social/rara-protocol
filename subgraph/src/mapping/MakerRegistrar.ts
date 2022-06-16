import {
  Bytes,
  log,
  ipfs,
  json,
  JSONValue,
  Address,
  BigInt,
} from "@graphprotocol/graph-ts";

import {Source, Transform} from "../../generated/schema";

import {
  Registered,
  Deregistered,
} from "../../generated/MakerRegistrar/MakerRegistrar";

export function handleRegistered(event: Registered): void {
  log.log(3, "handleRegistered");
  // uint256 nftChainId,
  // address indexed nftContractAddress,
  // uint256 indexed nftId,
  // address indexed nftOwnerAddress,
  // address nftCreatorAddress[],
  // uint256 creatorSaleBasisPoints,
  // uint256 optionBits,
  // uint256 sourceId,
  // uint256 transformId

  //
  // Source
  //
  let sourceKey = event.params.sourceId.toString();
  let source = Source.load(sourceKey);
  if (source == null) {
    source = new Source(sourceKey);
    source.sourceId = event.params.sourceId;
    source.user = event.params.nftOwnerAddress;
    source.nftChainId = event.params.nftChainId;
    source.nftContractAddress = event.params.nftContractAddress;
    source.nftId = event.params.nftId;

    source.createdAt = event.block.timestamp;
    source.blockNumber = event.block.number;
  }

  // these are updated each time "register()" is called
  source.creatorAddresses = event.params.nftCreatorAddresses.map<string>(
    (item) => item.toHexString()
  );
  source.creatorSaleBasisPoints = event.params.creatorSaleBasisPoints;
  source.registered = true;

  // timestamps
  source.updatedAt = event.block.timestamp;
  source.blockNumber = event.block.number;
  source.save();

  //
  // Transform
  //
  let transformKey = event.params.transformId.toString();
  let transform = Transform.load(transformKey);
  if (transform == null) {
    transform = new Transform(transformKey);
    transform.transformId = event.params.transformId;
    transform.source = event.params.sourceId.toString();
    transform.optionBits = event.params.optionBits;
    transform.createdAt = event.block.timestamp;
    transform.blockNumber = event.block.number;
  }

  // these are updated each time "register()" is called
  transform.ipfsHash = event.params.ipfsMetadataHash;
  const result = ipfs.cat(event.params.ipfsMetadataHash);
  if (result) {
    const data = json.fromBytes(result).toObject();
    let name = data.get("reactionName");
    if (name) {
      transform.name = name.toString();
    }
    let tags = data.get("reactionTags");
    if (tags) {
      let tagArray = tags.toArray();
      if (tagArray.length > 0) {
        transform.tags = tagArray.map<string>((item) => item.toString());
      }
    }
  }

  transform.updatedAt = event.block.timestamp;
  transform.blockNumber = event.block.number;
  transform.save();
}

export function handleDeregistered(event: Deregistered): void {
  log.log(3, "Deregistered");

  //
  // Source
  //
  let sourceKey = event.params.sourceId.toString();
  let source = Source.load(sourceKey);
  if (source == null) {
    source = new Source(sourceKey);
  }
  source.registered = false;

  // timestamp
  source.updatedAt = event.block.timestamp;
  source.blockNumber = event.block.number;
  source.save();
}
