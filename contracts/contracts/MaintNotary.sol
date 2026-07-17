// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Minimal hash-store contract for MaintNotary Lite (spec §12).
/// Stores a SHA-256 content hash per opaque record id; never stores PII.
contract MaintNotary {
    address public owner;

    event RecordAnchored(bytes32 indexed recordId, bytes32 contentHash, uint256 timestamp);

    mapping(bytes32 => bytes32) public hashes;
    mapping(bytes32 => uint256) public anchoredAt;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    // onlyOwner prevents any external party from poisoning a record_id
    // with a fake hash before the anchor worker gets to it.
    function anchor(bytes32 recordId, bytes32 contentHash) external onlyOwner {
        require(hashes[recordId] == bytes32(0), "Already anchored");
        hashes[recordId] = contentHash;
        anchoredAt[recordId] = block.timestamp;
        emit RecordAnchored(recordId, contentHash, block.timestamp);
    }
}
