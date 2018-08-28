# Consensys Academy 2018 Final Project of Simon Abela
# Design Pattern Decisions

## Use Withdrawal pattern
Contract tracked redeemable funds (called escrow, which is released once proposal is rejected or swap completed)
Collector can check his balance and withdraw whole balance at any time
Rationale: to avoid security risks of using the send pattern

## Use Restricting Access pattern
Contract implements OnlyCollector and OnlyCollectionOwner modifiers to restrict access to functions that change storage in particular
Sometimes Restricting access is also done inside functions using requires
Rationale: to avoid DOS attacks

## Use State Machine pattern
Contract uses this pattern to track state of Confirmed Swap and uses state to implement rules or restricting access
Rationale: prevent logic bugs and avoid attacks designed around weak state management

## Container data structures pattern
Dynamic arrays for confirmed swaps, collections, proposed swaps all use the container data structure pattern based on the CRUD doc https://medium.com/@robhitchens/solidity-crud-part-1-824ffa69509a

## Use Mappings where possible and avoid For Loops
To avoid DOS attacks and gas costs prefer Mappings over arrays for collection where iteration of collection is not required
Even when arrays are required implment a mapping to the index to allow direct access using a key
For example contract has implemented the Collection items array in this way with item name as the key (from a mapping)
To minimize gas costs and DOS attacks there are No for loops in contract (do understand that fixed length for loops may be ok)

## a collector may have many collections but only 1 in each category
To avoid DOS attacks i have implemented this rule that a collector may only have 1 collection per category
This should significantly limit the number of collections that the contract has to store
Does mean that owner has to provide sufficient categories and some functionality for collectors to suggest categories should be implemented

## How to store Image file of item
To save significant storage and gas costs i decided to store Image files in IPFS and pass the hash to the smart contract
To store ipfshash properly following https://github.com/saurfang/ipfs-multihash-on-solidity but not yet implemented storing hashtype and length prefix

## How to capture Postal Address for Proposed and Confirmed Swaps
Store Postal Address in IPFS to avoid storage, gas and stack issues and use strength of js libraries for address validation and allow dApp
to use public key of other party to encrypt address then store it in ipfs and pass hash to contract as an argument

## How to present swappable items 
To save gas leave it to dApp (not contract) to get swappable items for msg.sender up to given value (contract will validate if proposed swap is swappable) 
(Ie dApp get all items in msg.sender collection for that category) and then filter out non swappable

## Avoid Stack Limit Issue 
also pass index args as 1 fix sized array to avoid stack issue


